import { useState, useEffect } from "react";
import { Newspaper, Pin, Plus, Trash2, Calendar, Megaphone, GraduationCap, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface NewsItem {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  published_by: string;
  created_at: string;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  announcement: { icon: Megaphone, color: "bg-blue-50 text-blue-700", label: "Announcement" },
  exam_schedule: { icon: Calendar, color: "bg-amber-50 text-amber-700", label: "Exam Schedule" },
  event: { icon: PartyPopper, color: "bg-emerald-50 text-emerald-700", label: "Event" },
  scholarship: { icon: GraduationCap, color: "bg-purple-50 text-purple-700", label: "Scholarship" },
};

const CampusNewsPanel = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("announcement");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      setIsAdmin(roles?.some((r: any) => r.role === "admin") || false);
      const { data } = await supabase.from("campus_news").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
      setNews(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handlePublish = async () => {
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("campus_news").insert({ title: title.trim(), body: body.trim(), category, pinned, published_by: user.id });
    if (error) { toast.error(error.message); } else {
      toast.success("News published!");
      setTitle(""); setBody(""); setCategory("announcement"); setPinned(false); setShowForm(false);
      const { data } = await supabase.from("campus_news").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
      setNews(data || []);
    }
    setPosting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("campus_news").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setNews((prev) => prev.filter((n) => n.id !== id)); toast.success("Deleted"); }
  };

  const filtered = filter === "all" ? news : news.filter((n) => n.category === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">Campus News</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Latest announcements and updates</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Publish</Button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="content-card mb-4 space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Body..." value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <button key={key} onClick={() => setCategory(key)}
                className={`filter-pill text-xs ${category === key ? "filter-pill-active" : ""}`}>
                {cfg.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" /> Pin to top
            </label>
            <Button size="sm" onClick={handlePublish} disabled={posting || !title.trim() || !body.trim()}>
              {posting ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {["all", ...Object.keys(categoryConfig)].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`filter-pill text-xs ${filter === f ? "filter-pill-active" : ""}`}>
            {f === "all" ? "All" : categoryConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No news yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cfg = categoryConfig[item.category] || categoryConfig.announcement;
            const Icon = cfg.icon;
            return (
              <div key={item.id} className="content-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${cfg.color}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                      {item.pinned && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">{item.body}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 bg-transparent border-none cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampusNewsPanel;
