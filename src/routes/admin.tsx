import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  Shield, Users, FileText, BarChart3, GraduationCap, Building2,
  BookOpen, Trash2, Plus, ChevronRight, Newspaper,
  Home, AlertTriangle, Search,
  RefreshCw, Edit, X, Check, MessageCircle, Image,
  Clock, TrendingUp, Rocket, Settings as SettingsIcon, BadgeCheck,
  Inbox, History
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { isBannerActive } from "@/components/AnnouncementBanner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — AcadLink" },
      { name: "description", content: "AcadLink administration dashboard — manage users, content, academics, and platform settings." },
    ],
  }),
  component: AdminPage,
});

type AdminTab = "overview" | "users" | "verify" | "verifyqueue" | "audit" | "posts" | "boost" | "news" | "academics" | "groups" | "roles" | "settings";

const adminTabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "verify", label: "Verify Users", icon: BadgeCheck },
  { key: "verifyqueue", label: "Verify Queue", icon: Inbox },
  { key: "audit", label: "Audit Log", icon: History },
  { key: "posts", label: "Posts", icon: FileText },
  { key: "boost", label: "Boost / Viral", icon: Rocket },
  { key: "news", label: "Campus News", icon: Newspaper },
  { key: "academics", label: "Academics", icon: GraduationCap },
  { key: "groups", label: "Group Chats", icon: MessageCircle },
  { key: "roles", label: "User Roles", icon: Shield },
  { key: "settings", label: "System Settings", icon: SettingsIcon },
];

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("overview");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session: sess } } = await supabase.auth.getSession();
      setSession(sess);
      if (sess?.user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", sess.user.id);
        setIsAdmin(roles?.some((r: any) => r.role === "admin") || false);
      }
      setLoading(false);
    };
    checkAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      if (!sess) setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold mb-2">Authentication Required</h2>
            <p className="text-sm text-muted-foreground mb-4">Please log in to access the admin panel.</p>
            <Link to="/" className="text-primary underline text-sm">Go to Login</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-bold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground mb-4">You don't have admin privileges.</p>
            <Link to="/" className="text-primary underline text-sm">Back to Home</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="sticky top-0 z-50 bg-card border-b border-border h-14 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center text-destructive-foreground font-bold text-sm">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight">AcadLink Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Back to App</span>
          </Link>
        </div>
      </nav>

      <div className="flex">
        <aside className="hidden md:block w-[220px] min-h-[calc(100vh-56px)] bg-card border-r border-border p-3 sticky top-14">
          <div className="space-y-1">
            {adminTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-none text-left cursor-pointer ${
                  tab === key
                    ? "bg-primary/10 text-primary"
                    : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50 overflow-x-auto">
          {adminTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium border-none cursor-pointer transition-colors ${
                tab === key ? "text-primary bg-primary/5" : "text-muted-foreground bg-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-20 md:pb-6">
          {tab === "overview" && <OverviewPanel />}
          {tab === "users" && <UsersPanel />}
          {tab === "verify" && <VerifyUsersPanel />}
          {tab === "verifyqueue" && <VerificationQueuePanel />}
          {tab === "audit" && <AuditLogPanel />}
          {tab === "posts" && <PostsPanel />}
          {tab === "boost" && <BoostPanel />}
          {tab === "news" && <NewsPanel />}
          {tab === "academics" && <AcademicsPanel />}
          {tab === "groups" && <GroupsPanel />}
          {tab === "roles" && <RolesPanel />}
          {tab === "settings" && <SystemSettingsPanel />}
        </main>
      </div>
    </div>
  );
}

function OverviewPanel() {
  const [stats, setStats] = useState({ users: 0, posts: 0, faculties: 0, departments: 0, courses: 0, news: 0, comments: 0, likes: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("faculties").select("id", { count: "exact", head: true }),
      supabase.from("departments").select("id", { count: "exact", head: true }),
      supabase.from("courses").select("id", { count: "exact", head: true }),
      supabase.from("campus_news").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }),
      supabase.from("post_likes").select("id", { count: "exact", head: true }),
    ]).then(([u, p, f, d, c, n, cm, l]) => {
      setStats({
        users: u.count || 0, posts: p.count || 0, faculties: f.count || 0,
        departments: d.count || 0, courses: c.count || 0, news: n.count || 0,
        comments: cm.count || 0, likes: l.count || 0,
      });
    });
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-500" },
    { label: "Total Posts", value: stats.posts, icon: FileText, color: "text-green-500" },
    { label: "Comments", value: stats.comments, icon: MessageCircle, color: "text-purple-500" },
    { label: "Likes", value: stats.likes, icon: TrendingUp, color: "text-pink-500" },
    { label: "Faculties", value: stats.faculties, icon: Building2, color: "text-orange-500" },
    { label: "Departments", value: stats.departments, icon: Building2, color: "text-yellow-500" },
    { label: "Courses", value: stats.courses, icon: BookOpen, color: "text-cyan-500" },
    { label: "News Articles", value: stats.news, icon: Newspaper, color: "text-red-500" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Dashboard Overview</h1>
      <p className="text-sm text-muted-foreground mb-6">Platform statistics at a glance</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    return !s || (u.display_name || "").toLowerCase().includes(s) || (u.department || "").toLowerCase().includes(s) || (u.matric_number || "").toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 w-[200px] text-sm" />
          </div>
          <Button size="sm" variant="outline" onClick={loadUsers}><RefreshCw className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3">Level</th>
                  <th className="text-left px-4 py-3">Matric No.</th>
                  <th className="text-left px-4 py-3">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {(u.display_name || "?").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {u.display_name || "No name"}
                            {u.verified && <Check className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0]" />}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.department || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.level || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.matric_number || "—"}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={u.verified ? "default" : "outline"}
                        className="h-7 text-[11px] gap-1"
                        onClick={async () => {
                          const { error } = await supabase.from("profiles").update({ verified: !u.verified }).eq("user_id", u.user_id);
                          if (error) return toast.error(error.message);
                          toast.success(u.verified ? "Unverified" : "Verified");
                          loadUsers();
                        }}
                      >
                        {u.verified ? <><X className="w-3 h-3" />Unverify</> : <><Check className="w-3 h-3" />Verify</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No users found.</p>}
        </Card>
      )}
    </div>
  );
}

function PostsPanel() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("posts").select("*, post_attachments(id, file_url, file_type), post_likes(id), comments(id)").order("created_at", { ascending: false }).limit(100);
    setPosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error("Failed to delete: " + error.message);
    else { setPosts((p) => p.filter((x) => x.id !== id)); toast.success("Post deleted"); }
  };

  const filtered = posts.filter((p) => !search || p.content.toLowerCase().includes(search.toLowerCase()) || p.tag.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Posts</h1>
          <p className="text-sm text-muted-foreground">{posts.length} total posts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 w-[200px] text-sm" />
          </div>
          <Button size="sm" variant="outline" onClick={loadPosts}><RefreshCw className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-3">{p.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{p.tag}</Badge>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(p.created_at).toLocaleDateString()}</span>
                      <span>{p.post_likes?.length || 0} likes</span>
                      <span>{p.comments?.length || 0} comments</span>
                      {p.post_attachments?.length > 0 && <span className="flex items-center gap-1"><Image className="w-3 h-3" />{p.post_attachments.length} files</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No posts found.</p>}
        </div>
      )}
    </div>
  );
}

function NewsPanel() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "general", pinned: false });

  const loadNews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("campus_news").select("*").order("created_at", { ascending: false });
    setNews(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.body.trim()) return toast.error("Title and body required");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("campus_news").insert({ title: form.title.trim(), body: form.body.trim(), category: form.category, pinned: form.pinned, published_by: user.id });
    if (error) toast.error(error.message);
    else { toast.success("News published!"); setForm({ title: "", body: "", category: "general", pinned: false }); setShowForm(false); loadNews(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this news article?")) return;
    const { error } = await supabase.from("campus_news").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setNews((n) => n.filter((x) => x.id !== id)); toast.success("Deleted"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Campus News</h1>
          <p className="text-sm text-muted-foreground">{news.length} articles</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "New Article"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="Article title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 text-sm" />
            <Textarea placeholder="Article body..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="text-sm" />
            <div className="flex gap-2 items-center flex-wrap">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="event">Event</option>
                <option value="urgent">Urgent</option>
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="rounded" />
                Pin to top
              </label>
              <Button size="sm" onClick={handleCreate} className="ml-auto gap-1"><Check className="w-3.5 h-3.5" />Publish</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {news.map((n) => (
            <Card key={n.id}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{n.title}</h3>
                      {n.pinned && <Badge variant="secondary" className="text-[10px]">Pinned</Badge>}
                      <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.body}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(n.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {news.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No news yet.</p>}
        </div>
      )}
    </div>
  );
}

function AcademicsPanel() {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFaculty, setNewFaculty] = useState("");
  const [newDept, setNewDept] = useState({ name: "", faculty_id: "" });
  const [newCourse, setNewCourse] = useState({ code: "", title: "", department_id: "", level: "100", semester: "1st", units: 3 });
  const [expandedFac, setExpandedFac] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [f, d, c] = await Promise.all([
      supabase.from("faculties").select("*").order("name"),
      supabase.from("departments").select("*").order("name"),
      supabase.from("courses").select("*").order("code"),
    ]);
    setFaculties(f.data || []); setDepartments(d.data || []); setCourses(c.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addFaculty = async () => {
    if (!newFaculty.trim()) return;
    const { error } = await supabase.from("faculties").insert({ name: newFaculty.trim() });
    if (error) toast.error(error.message); else { toast.success("Faculty added"); setNewFaculty(""); loadAll(); }
  };

  const deleteFaculty = async (id: string) => {
    if (!confirm("Delete this faculty and all its departments/courses?")) return;
    const { error } = await supabase.from("faculties").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); loadAll(); }
  };

  const addDept = async () => {
    if (!newDept.name.trim() || !newDept.faculty_id) return;
    const { error } = await supabase.from("departments").insert({ name: newDept.name.trim(), faculty_id: newDept.faculty_id });
    if (error) toast.error(error.message); else { toast.success("Department added"); setNewDept({ name: "", faculty_id: "" }); loadAll(); }
  };

  const deleteDept = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); loadAll(); }
  };

  const addCourse = async () => {
    if (!newCourse.code.trim() || !newCourse.title.trim() || !newCourse.department_id) return;
    const { error } = await supabase.from("courses").insert({
      code: newCourse.code.trim(), title: newCourse.title.trim(),
      department_id: newCourse.department_id, level: newCourse.level,
      semester: newCourse.semester, units: newCourse.units,
    });
    if (error) toast.error(error.message); else {
      toast.success("Course added");
      setNewCourse({ code: "", title: "", department_id: "", level: "100", semester: "1st", units: 3 });
      loadAll();
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); loadAll(); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Academic Structure</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage faculties, departments, and courses</p>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Add Faculty</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Faculty name" value={newFaculty} onChange={(e) => setNewFaculty(e.target.value)} className="h-9 text-sm" />
            <Button size="sm" onClick={addFaculty} className="w-full gap-1"><Plus className="w-3 h-3" />Add Faculty</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Add Department</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <select value={newDept.faculty_id} onChange={(e) => setNewDept({ ...newDept, faculty_id: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Select Faculty</option>
              {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <Input placeholder="Department name" value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} className="h-9 text-sm" />
            <Button size="sm" onClick={addDept} className="w-full gap-1"><Plus className="w-3 h-3" />Add Department</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Add Course</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <select value={newCourse.department_id} onChange={(e) => setNewCourse({ ...newCourse, department_id: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Code" value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} className="h-9 text-sm" />
              <Input placeholder="Title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select value={newCourse.level} onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {["100", "200", "300", "400", "500"].map((l) => <option key={l} value={l}>{l}L</option>)}
              </select>
              <select value={newCourse.semester} onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="1st">1st</option><option value="2nd">2nd</option>
              </select>
              <Input type="number" value={newCourse.units} onChange={(e) => setNewCourse({ ...newCourse, units: parseInt(e.target.value) || 3 })} className="h-9 text-sm" />
            </div>
            <Button size="sm" onClick={addCourse} className="w-full gap-1"><Plus className="w-3 h-3" />Add Course</Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-sm font-bold mb-3">Existing Structure</h2>
      <div className="space-y-2">
        {faculties.map((fac) => {
          const facDepts = departments.filter((d) => d.faculty_id === fac.id);
          const isExpanded = expandedFac === fac.id;
          return (
            <Card key={fac.id}>
              <CardContent className="p-0">
                <button onClick={() => setExpandedFac(isExpanded ? null : fac.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-transparent border-none cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    <span className="font-semibold text-sm">{fac.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{facDepts.length} depts</Badge>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); deleteFaculty(fac.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-2">
                    {facDepts.map((dept) => {
                      const deptCourses = courses.filter((c) => c.department_id === dept.id);
                      return (
                        <div key={dept.id} className="bg-muted/40 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold">{dept.name}</span>
                            <Button size="sm" variant="ghost" className="text-destructive h-6 w-6 p-0"
                              onClick={() => deleteDept(dept.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          {deptCourses.length > 0 ? (
                            <div className="space-y-1">
                              {deptCourses.map((c) => (
                                <div key={c.id} className="flex items-center justify-between text-xs bg-background rounded px-2 py-1.5">
                                  <span><strong>{c.code}</strong> — {c.title} ({c.level}L, {c.semester}, {c.units}u)</span>
                                  <button onClick={() => deleteCourse(c.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer p-0.5">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No courses</span>
                          )}
                        </div>
                      );
                    })}
                    {facDepts.length === 0 && <p className="text-xs text-muted-foreground">No departments in this faculty</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {faculties.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No faculties created yet.</p>}
      </div>
    </div>
  );
}

// ============== GROUPS PANEL (chat group management) ==============
type GroupRow = {
  id: string; code: string; title: string; display_name: string | null;
  avatar_url: string | null; scope: string; level: string;
  department_id: string | null; faculty_id: string | null;
};

function GroupsPanel() {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [editing, setEditing] = useState<GroupRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [managingMembers, setManagingMembers] = useState<GroupRow | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [addMemberId, setAddMemberId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newG, setNewG] = useState({ code: "", title: "", scope: "level", faculty_id: "", department_id: "", level: "100" });

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [g, f, d, p, m] = await Promise.all([
      supabase.from("courses").select("*").order("scope").order("title"),
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("departments").select("id, name, faculty_id").order("name"),
      supabase.from("profiles").select("user_id, display_name, matric_number").order("display_name"),
      supabase.from("course_members").select("course_id"),
    ]);
    setGroups((g.data || []) as GroupRow[]);
    setFaculties(f.data || []); setDepartments(d.data || []); setProfiles(p.data || []);
    const counts: Record<string, number> = {};
    (m.data || []).forEach((x: any) => { counts[x.course_id] = (counts[x.course_id] || 0) + 1; });
    setMemberCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const facMap = Object.fromEntries(faculties.map((f) => [f.id, f.name]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const nameOf = (uid: string) => {
    const p = profiles.find((x) => x.user_id === uid);
    return p?.display_name || p?.matric_number || uid.slice(0, 8);
  };

  const filtered = groups.filter((g) => {
    if (scopeFilter !== "all" && g.scope !== scopeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const hay = `${g.title} ${g.display_name || ""} ${g.code} ${g.department_id ? deptMap[g.department_id] : ""} ${g.faculty_id ? facMap[g.faculty_id] : ""}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });

  const startEdit = (g: GroupRow) => {
    setEditing(g);
    setEditName(g.display_name || g.title);
    setEditAvatar(g.avatar_url || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("courses")
      .update({ display_name: editName.trim() || null, avatar_url: editAvatar.trim() || null })
      .eq("id", editing.id);
    if (error) toast.error(error.message);
    else { toast.success("Group updated"); setEditing(null); loadAll(); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    const path = `group-avatars/${editing.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setEditAvatar(data.publicUrl);
    toast.success("Avatar uploaded — click Save");
  };

  const deleteGroup = async (g: GroupRow) => {
    if (!confirm(`Delete "${g.display_name || g.title}" and all its messages?`)) return;
    await supabase.from("chat_messages").delete().eq("course_id", g.id);
    await supabase.from("course_members").delete().eq("course_id", g.id);
    const { error } = await supabase.from("courses").delete().eq("id", g.id);
    if (error) toast.error(error.message); else { toast.success("Group deleted"); loadAll(); }
  };

  const openMembers = async (g: GroupRow) => {
    setManagingMembers(g);
    const { data } = await supabase.from("course_members").select("user_id").eq("course_id", g.id);
    setGroupMembers((data || []).map((m) => m.user_id));
  };

  const addMember = async () => {
    if (!addMemberId || !managingMembers) return;
    const { error } = await supabase.from("course_members").insert({ course_id: managingMembers.id, user_id: addMemberId });
    if (error) toast.error(error.message);
    else { setGroupMembers((m) => [...m, addMemberId]); setAddMemberId(""); toast.success("Member added"); }
  };

  const removeMember = async (uid: string) => {
    if (!managingMembers) return;
    const { error } = await supabase.from("course_members").delete()
      .eq("course_id", managingMembers.id).eq("user_id", uid);
    if (error) toast.error(error.message);
    else { setGroupMembers((m) => m.filter((x) => x !== uid)); }
  };

  const createGroup = async () => {
    if (!newG.title.trim()) { toast.error("Title required"); return; }
    const payload: any = {
      code: newG.code.trim() || `G-${Date.now()}`,
      title: newG.title.trim(),
      display_name: newG.title.trim(),
      scope: newG.scope,
      semester: "1st",
      units: 0,
      level: newG.scope === "level" ? newG.level : "ALL",
      department_id: newG.scope === "level" || newG.scope === "department" ? newG.department_id || null : null,
      faculty_id: newG.scope === "faculty" ? newG.faculty_id || null : null,
    };
    if ((newG.scope === "level" || newG.scope === "department") && !payload.department_id) {
      toast.error("Select a department"); return;
    }
    if (newG.scope === "faculty" && !payload.faculty_id) {
      toast.error("Select a faculty"); return;
    }
    const { error } = await supabase.from("courses").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Group created");
      setShowCreate(false);
      setNewG({ code: "", title: "", scope: "level", faculty_id: "", department_id: "", level: "100" });
      loadAll();
    }
  };

  const scopeBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      university: { label: "🌍 University", cls: "bg-accent/20 text-accent-foreground" },
      faculty: { label: "🏛️ Faculty", cls: "bg-primary/15 text-primary" },
      department: { label: "🎓 Dept General", cls: "bg-secondary text-secondary-foreground" },
      level: { label: "📚 Level", cls: "bg-muted text-foreground" },
    };
    const v = map[s] || map.level;
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${v.cls}`}>{v.label}</span>;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">Group Chats</h1>
        <Button size="sm" onClick={() => setShowCreate((s) => !s)} className="gap-1"><Plus className="w-3.5 h-3.5" />New Group</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Rename, change avatars, manage members or delete any chat group.</p>

      {showCreate && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={newG.scope} onChange={(e) => setNewG({ ...newG, scope: e.target.value })}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="level">Level (dept + level)</option>
                <option value="department">Department General</option>
                <option value="faculty">Faculty General</option>
                <option value="university">University-wide</option>
              </select>
              <Input placeholder="Group title" value={newG.title} onChange={(e) => setNewG({ ...newG, title: e.target.value })} className="h-9 text-sm" />
            </div>
            {(newG.scope === "level" || newG.scope === "department") && (
              <select value={newG.department_id} onChange={(e) => setNewG({ ...newG, department_id: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            {newG.scope === "faculty" && (
              <select value={newG.faculty_id} onChange={(e) => setNewG({ ...newG, faculty_id: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">Select Faculty</option>
                {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
            {newG.scope === "level" && (
              <select value={newG.level} onChange={(e) => setNewG({ ...newG, level: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {["100", "200", "300", "400", "500"].map((l) => <option key={l} value={l}>{l} Level</option>)}
              </select>
            )}
            <Input placeholder="Code (optional)" value={newG.code} onChange={(e) => setNewG({ ...newG, code: e.target.value })} className="h-9 text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={createGroup} className="flex-1">Create</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
        <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="all">All scopes</option>
          <option value="university">University</option>
          <option value="faculty">Faculty</option>
          <option value="department">Department General</option>
          <option value="level">Level</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((g) => (
          <Card key={g.id}>
            <CardContent className="p-3 flex items-center gap-3">
              {g.avatar_url ? (
                <img src={g.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  {g.scope === "university" ? "🌍" : g.scope === "faculty" ? "🏛️" : g.level === "ALL" ? "GEN" : `${g.level}L`}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm truncate">{g.display_name || g.title}</span>
                  {scopeBadge(g.scope)}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {g.code} · {g.faculty_id ? facMap[g.faculty_id] : g.department_id ? deptMap[g.department_id] : "All users"} · {memberCounts[g.id] || 0} members
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openMembers(g)} title="Manage members">
                  <Users className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(g)} title="Rename / avatar">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteGroup(g)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No groups found.</p>}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Edit group</CardTitle>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                {editAvatar ? (
                  <img src={editAvatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xs font-bold">No img</div>
                )}
                <label className="flex-1 text-xs cursor-pointer">
                  <span className="block mb-1 font-medium">Avatar (max 2MB)</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="text-xs" />
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Display name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Avatar URL (optional)</label>
                <Input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://..." className="h-9 text-sm" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveEdit} className="flex-1 gap-1"><Check className="w-3.5 h-3.5" />Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members modal */}
      {managingMembers && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setManagingMembers(null)}>
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base truncate">Members · {managingMembers.display_name || managingMembers.title}</CardTitle>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setManagingMembers(null)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto">
              <div className="flex gap-2">
                <select value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="">Add user...</option>
                  {profiles.filter((p) => !groupMembers.includes(p.user_id)).map((p) => (
                    <option key={p.user_id} value={p.user_id}>{p.display_name || p.matric_number || p.user_id.slice(0, 8)}</option>
                  ))}
                </select>
                <Button size="sm" onClick={addMember} disabled={!addMemberId}>Add</Button>
              </div>
              <div className="text-xs text-muted-foreground">{groupMembers.length} members</div>
              <div className="space-y-1">
                {groupMembers.map((uid) => (
                  <div key={uid} className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-2">
                    <span className="text-sm truncate">{nameOf(uid)}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeMember(uid)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
// ==============================================================

function RolesPanel() {
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "moderator" | "user">("moderator");

  const loadRoles = useCallback(async () => {
    setLoading(true);
    const [r, p] = await Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.from("profiles").select("user_id, display_name, matric_number"),
    ]);
    setRoles(r.data || []);
    setProfiles(p.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const getProfileName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.display_name || p?.matric_number || userId.slice(0, 8);
  };

  const handleAddRole = async () => {
    if (!addUserId) return toast.error("Select a user");
    const { error } = await supabase.from("user_roles").insert({ user_id: addUserId, role: addRole });
    if (error) toast.error(error.message); else { toast.success("Role assigned"); setAddUserId(""); loadRoles(); }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Remove this role?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) toast.error("Cannot remove: " + error.message);
    else { setRoles((r) => r.filter((x) => x.id !== id)); toast.success("Role removed"); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">User Roles</h1>
      <p className="text-sm text-muted-foreground mb-6">Assign admin and moderator roles</p>

      <Card className="mb-6">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Assign Role</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)}
              className="flex-1 min-w-[160px] h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Select User</option>
              {profiles.map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.display_name || p.matric_number || p.user_id.slice(0, 8)}</option>
              ))}
            </select>
            <select value={addRole} onChange={(e) => setAddRole(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
            <Button size="sm" onClick={handleAddRole} className="gap-1"><Shield className="w-3.5 h-3.5" />Assign</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{getProfileName(r.user_id)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.role === "admin" ? "destructive" : r.role === "moderator" ? "default" : "secondary"} className="text-xs">
                      {r.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => handleDeleteRole(r.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {roles.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No roles assigned yet.</p>}
      </Card>
    </div>
  );
}

// ============== VERIFY USERS PANEL ==============
function VerifyUsersPanel() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("id, user_id, display_name, matric_number, department, level, avatar_url, verified").order("display_name").limit(50);
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`display_name.ilike.${s},matric_number.ilike.${s},department.ilike.${s}`);
    }
    const { data } = await q;
    setUsers(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { runSearch(); }, [runSearch]);

  const toggleVerify = async (u: any) => {
    const { error } = await supabase.from("profiles").update({ verified: !u.verified }).eq("user_id", u.user_id);
    if (error) return toast.error(error.message);
    toast.success(u.verified ? "Verification removed" : "Account verified ✓");
    setUsers(prev => prev.map(x => x.user_id === u.user_id ? { ...x, verified: !x.verified } : x));
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-[#1d9bf0]" /> Verify Users</h1>
        <p className="text-sm text-muted-foreground">Search by name, matric number or department, then grant the blue verified badge.</p>
      </div>
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search students by name, matric, department…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-10 text-sm" />
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {users.map(u => (
            <Card key={u.id}>
              <CardContent className="pt-4 pb-4 px-4 flex items-center gap-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                    {(u.display_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1 truncate">
                    {u.display_name || "No name"}
                    {u.verified && <Check className="w-3.5 h-3.5 text-[#1d9bf0]" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {u.matric_number || "—"} · {u.department || "—"} · {u.level || "—"}
                  </div>
                </div>
                <Button size="sm" variant={u.verified ? "outline" : "default"} className="h-8 text-[11px] gap-1 shrink-0" onClick={() => toggleVerify(u)}>
                  {u.verified ? <><X className="w-3 h-3" />Unverify</> : <><BadgeCheck className="w-3 h-3" />Verify</>}
                </Button>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && <p className="text-center text-sm text-muted-foreground py-8 sm:col-span-2">No matching users.</p>}
        </div>
      )}
    </div>
  );
}

// ============== BOOST PANEL (make posts/accounts viral) ==============
function BoostPanel() {
  const [tab, setTab] = useState<"posts" | "accounts">("posts");
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === "posts") {
      let q = supabase.from("posts").select("id, user_id, content, tag, boosted_until, created_at").order("created_at", { ascending: false }).limit(60);
      if (search.trim()) q = q.ilike("content", `%${search.trim()}%`);
      const { data } = await q;
      setItems(data || []);
    } else {
      let q = supabase.from("profiles").select("id, user_id, display_name, matric_number, department, level, avatar_url, verified, boosted_until").order("display_name").limit(60);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`display_name.ilike.${s},matric_number.ilike.${s}`);
      }
      const { data } = await q;
      setItems(data || []);
    }
    setLoading(false);
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  const setBoost = async (item: any, days: number | null) => {
    const table = tab === "posts" ? "posts" : "profiles";
    const id = tab === "posts" ? item.id : item.user_id;
    const filter = tab === "posts" ? "id" : "user_id";
    const value = days === null ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await (supabase.from(table) as any).update({ boosted_until: value }).eq(filter, id);
    if (error) return toast.error(error.message);
    toast.success(days === null ? "Boost removed" : `Boosted for ${days} day${days === 1 ? "" : "s"} 🚀`);
    load();
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><Rocket className="w-5 h-5 text-[hsl(var(--boost))]" /> Boost / Viral</h1>
        <p className="text-sm text-muted-foreground">Pin posts to the top of every feed or mark accounts as Viral. Boosted items show a fire badge to all users.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("posts")} className={`filter-pill text-xs ${tab === "posts" ? "filter-pill-active" : ""}`}>Boost Posts</button>
        <button onClick={() => setTab("accounts")} className={`filter-pill text-xs ${tab === "accounts" ? "filter-pill-active" : ""}`}>Boost Accounts</button>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={tab === "posts" ? "Search posts…" : "Search accounts…"} value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-10 text-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {items.map(it => {
            const isBoosted = it.boosted_until && new Date(it.boosted_until) > new Date();
            return (
              <Card key={it.id} className={isBoosted ? "border-[hsl(var(--boost))]/50" : ""}>
                <CardContent className="pt-4 pb-4 px-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {tab === "posts" ? (
                      <>
                        <p className="text-sm line-clamp-2">{it.content}</p>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{it.tag}</Badge>
                          <span>{new Date(it.created_at).toLocaleDateString()}</span>
                          {isBoosted && <span className="boost-badge"><Rocket className="w-2.5 h-2.5" />Boosted until {new Date(it.boosted_until).toLocaleDateString()}</span>}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        {it.avatar_url ? (
                          <img src={it.avatar_url} alt="" className={`w-10 h-10 rounded-full object-cover ${isBoosted ? "boost-ring" : ""}`} />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold ${isBoosted ? "boost-ring" : ""}`}>
                            {(it.display_name || "?").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate flex items-center gap-1">
                            {it.display_name || "No name"}
                            {it.verified && <Check className="w-3.5 h-3.5 text-[#1d9bf0]" />}
                            {isBoosted && <span className="boost-badge"><Rocket className="w-2.5 h-2.5" />VIRAL</span>}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">{it.department || "—"} · {it.level || "—"}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {isBoosted ? (
                      <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => setBoost(it, null)}>
                        <X className="w-3 h-3" />Remove boost
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => setBoost(it, 1)}>
                          <Rocket className="w-3 h-3" />1 day
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setBoost(it, 7)}>7 days</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setBoost(it, 30)}>30 days</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {items.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nothing to show.</p>}
        </div>
      )}
    </div>
  );
}

// ============== SYSTEM SETTINGS PANEL ==============
function SystemSettingsPanel() {
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("system_settings" as any).select("*").eq("id", true).maybeSingle();
      setS(data || { site_name: "AcadLink", tagline: "", reels_enabled: true, voice_notes_enabled: true, live_events_enabled: true, registration_open: true, default_post_tag: "discussion", max_post_length: 2000, announcement_banner: "", banner_starts_at: null, banner_ends_at: null, banner_variant: "info" });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase.from("system_settings" as any) as any).update({
      site_name: s.site_name, tagline: s.tagline,
      reels_enabled: s.reels_enabled, voice_notes_enabled: s.voice_notes_enabled,
      live_events_enabled: s.live_events_enabled, registration_open: s.registration_open,
      default_post_tag: s.default_post_tag, max_post_length: s.max_post_length,
      announcement_banner: s.announcement_banner,
      banner_starts_at: s.banner_starts_at || null,
      banner_ends_at: s.banner_ends_at || null,
      banner_variant: s.banner_variant || "info",
    }).eq("id", true);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("System settings saved");
  };

  if (loading || !s) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> System Settings</h1>
        <p className="text-sm text-muted-foreground">Global controls for the entire AcadLink platform.</p>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-sm">Branding</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Site name</label>
            <Input value={s.site_name || ""} onChange={e => setS({ ...s, site_name: e.target.value })} className="h-9 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Tagline</label>
            <Input value={s.tagline || ""} onChange={e => setS({ ...s, tagline: e.target.value })} className="h-9 text-sm" />
          </div>
        </CardContent>
      </Card>

      <AnnouncementBannerEditor s={s} setS={setS} />

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-sm">Feature toggles</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "reels_enabled", label: "Campus Reels", desc: "Allow users to post and watch short videos." },
            { key: "voice_notes_enabled", label: "Voice notes", desc: "Hold-to-record voice messages in course chats." },
            { key: "live_events_enabled", label: "Live Events", desc: "Show the Live Event tab in the feed." },
            { key: "registration_open", label: "Open registration", desc: "When off, new students cannot sign up." },
          ].map(f => (
            <div key={f.key} className="flex items-center justify-between gap-3 py-1">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{f.label}</div>
                <div className="text-[11px] text-muted-foreground">{f.desc}</div>
              </div>
              <Switch checked={!!s[f.key]} onCheckedChange={v => setS({ ...s, [f.key]: v })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-sm">Posting rules</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Default post tag</label>
            <select value={s.default_post_tag} onChange={e => setS({ ...s, default_post_tag: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="discussion">Discussion</option>
              <option value="question">Question</option>
              <option value="resource">Resource</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Max post length (characters)</label>
            <Input type="number" value={s.max_post_length} onChange={e => setS({ ...s, max_post_length: parseInt(e.target.value) || 2000 })} className="h-9 text-sm" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="gap-1">
        <Check className="w-4 h-4" />{saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}

// Helper: convert ISO timestamp <-> value for <input type="datetime-local">
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const BANNER_VARIANTS: { key: string; label: string; className: string }[] = [
  { key: "info", label: "Info", className: "bg-primary text-primary-foreground" },
  { key: "warning", label: "Warning", className: "bg-amber-500 text-white" },
  { key: "success", label: "Success", className: "bg-emerald-500 text-white" },
  { key: "alert", label: "Alert", className: "bg-destructive text-destructive-foreground" },
];

function AnnouncementBannerEditor({ s, setS }: { s: any; setS: (v: any) => void }) {
  const active = isBannerActive(s);
  const now = Date.now();
  const startsAt = s.banner_starts_at ? new Date(s.banner_starts_at).getTime() : null;
  const endsAt = s.banner_ends_at ? new Date(s.banner_ends_at).getTime() : null;

  let status = "Hidden";
  let statusTone = "bg-muted text-muted-foreground";
  if (s.announcement_banner?.trim()) {
    if (startsAt && startsAt > now) { status = `Scheduled — starts ${new Date(startsAt).toLocaleString()}`; statusTone = "bg-amber-500/15 text-amber-700 dark:text-amber-400"; }
    else if (endsAt && endsAt < now) { status = `Expired ${new Date(endsAt).toLocaleString()}`; statusTone = "bg-muted text-muted-foreground"; }
    else if (active) { status = endsAt ? `Live — ends ${new Date(endsAt).toLocaleString()}` : "Live — no end date"; statusTone = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"; }
  }

  const variant = BANNER_VARIANTS.find(v => v.key === (s.banner_variant || "info")) || BANNER_VARIANTS[0];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span>Announcement banner</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusTone}`}>{status}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5">Message (leave blank to disable)</label>
          <Textarea
            rows={2}
            value={s.announcement_banner || ""}
            onChange={e => setS({ ...s, announcement_banner: e.target.value })}
            placeholder="e.g. Server maintenance on Sunday 9 PM. The site may be slow for ~30 minutes."
            className="text-sm"
          />
          <div className="text-[10px] text-muted-foreground mt-1">{(s.announcement_banner || "").length} characters</div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">Style</label>
          <div className="flex flex-wrap gap-2">
            {BANNER_VARIANTS.map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => setS({ ...s, banner_variant: v.key })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  (s.banner_variant || "info") === v.key
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                } ${v.className}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Starts at (optional)</label>
            <Input
              type="datetime-local"
              value={isoToLocalInput(s.banner_starts_at)}
              onChange={e => setS({ ...s, banner_starts_at: localInputToIso(e.target.value) })}
              className="h-9 text-sm"
            />
            <div className="text-[10px] text-muted-foreground mt-1">Leave blank to start immediately.</div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Ends at (optional)</label>
            <Input
              type="datetime-local"
              value={isoToLocalInput(s.banner_ends_at)}
              onChange={e => setS({ ...s, banner_ends_at: localInputToIso(e.target.value) })}
              className="h-9 text-sm"
            />
            <div className="text-[10px] text-muted-foreground mt-1">Leave blank to show indefinitely.</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setS({ ...s, banner_starts_at: new Date().toISOString(), banner_ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString() })}>
            Schedule next 24h
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setS({ ...s, banner_starts_at: new Date().toISOString(), banner_ends_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() })}>
            Schedule next 7 days
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setS({ ...s, banner_starts_at: null, banner_ends_at: null })}>
            Clear schedule
          </Button>
        </div>

        <div>
          <div className="text-xs font-semibold mb-1.5 text-muted-foreground">Live preview</div>
          {s.announcement_banner?.trim() ? (
            <div className={`${variant.className} w-full px-3 py-2 flex items-center gap-2 text-sm rounded-md`}>
              <span className="flex-1 leading-snug">{s.announcement_banner}</span>
              <X className="w-4 h-4 opacity-70" />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic px-3 py-2 border border-dashed rounded-md">Banner is empty — nothing will be shown.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============== AUDIT LOG HELPER ==============
async function logAdminAction(action: string, opts: {
  target_type?: string;
  target_id?: string | null;
  target_user_id?: string | null;
  metadata?: Record<string, any>;
} = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_audit_log").insert({
      actor_id: user.id,
      action,
      target_type: opts.target_type ?? null,
      target_id: opts.target_id ?? null,
      target_user_id: opts.target_user_id ?? null,
      metadata: opts.metadata ?? {},
    });
  } catch (e) {
    console.warn("audit log failed", e);
  }
}

// ============== VERIFICATION QUEUE PANEL ==============
type VerifReq = {
  id: string;
  user_id: string;
  full_name: string;
  matric_number: string | null;
  department: string | null;
  level: string | null;
  reason: string | null;
  evidence_url: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
};

function VerificationQueuePanel() {
  const [requests, setRequests] = useState<VerifReq[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("verification_requests").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    const reqs = (data || []) as VerifReq[];
    setRequests(reqs);

    const userIds = Array.from(new Set(reqs.map(r => r.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("user_id, display_name, avatar_url, verified, matric_number, department, level")
        .in("user_id", userIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const counts = {
    pending: requests.filter(r => r.status === "pending").length,
    all: requests.length,
  };

  const handleApprove = async (req: VerifReq) => {
    const notes = noteDraft[req.id]?.trim() || null;
    const { data: { user } } = await supabase.auth.getUser();
    const { error: e1 } = await supabase.from("verification_requests").update({
      status: "approved",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    }).eq("id", req.id);
    if (e1) return toast.error(e1.message);

    const { error: e2 } = await supabase.from("profiles").update({ verified: true }).eq("user_id", req.user_id);
    if (e2) return toast.error("Approved but failed to mark profile: " + e2.message);

    await logAdminAction("verification.approve", {
      target_type: "verification_request",
      target_id: req.id,
      target_user_id: req.user_id,
      metadata: { full_name: req.full_name, notes },
    });
    toast.success(`Approved ${req.full_name}`);
    load();
  };

  const handleReject = async (req: VerifReq) => {
    const notes = noteDraft[req.id]?.trim();
    if (!notes) return toast.error("Add a rejection reason in the notes field first.");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("verification_requests").update({
      status: "rejected",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    }).eq("id", req.id);
    if (error) return toast.error(error.message);

    await logAdminAction("verification.reject", {
      target_type: "verification_request",
      target_id: req.id,
      target_user_id: req.user_id,
      metadata: { full_name: req.full_name, notes },
    });
    toast.success(`Rejected ${req.full_name}`);
    load();
  };

  const handleReopen = async (req: VerifReq) => {
    const { error } = await supabase.from("verification_requests").update({
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
    }).eq("id", req.id);
    if (error) return toast.error(error.message);
    await logAdminAction("verification.reopen", {
      target_type: "verification_request",
      target_id: req.id,
      target_user_id: req.user_id,
    });
    toast.success("Returned to queue");
    load();
  };

  const filtered = requests.filter(r => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return r.full_name.toLowerCase().includes(s) ||
      (r.matric_number || "").toLowerCase().includes(s) ||
      (r.department || "").toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" /> Verification Queue
        </h1>
        <p className="text-sm text-muted-foreground">
          Review user-submitted verification requests. Approving grants the blue badge automatically.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            className="h-8 capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
            {f === "pending" && counts.pending > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">{counts.pending}</Badge>
            )}
          </Button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, matric, department…" value={search}
            onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[260px] text-sm" />
        </div>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No verification requests.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const prof = profiles[req.user_id];
            return (
              <Card key={req.id}>
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-start gap-3">
                    {prof?.avatar_url ? (
                      <img src={prof.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                        {(req.full_name || "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{req.full_name}</span>
                        {prof?.verified && <BadgeCheck className="w-4 h-4 fill-[#1d9bf0] text-white" />}
                        <Badge variant={req.status === "pending" ? "secondary" : req.status === "approved" ? "default" : "destructive"} className="text-[10px] capitalize">
                          {req.status}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground ml-auto">{new Date(req.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        {req.matric_number || "—"} · {req.department || "—"} · {req.level || "—"}
                      </div>
                      {req.reason && (
                        <p className="text-sm mt-2 bg-muted/40 rounded-md px-2.5 py-1.5 whitespace-pre-wrap">{req.reason}</p>
                      )}
                      {req.evidence_url && (
                        <a href={req.evidence_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary underline mt-1.5 inline-block break-all">
                          Evidence: {req.evidence_url}
                        </a>
                      )}
                      {req.status !== "pending" && req.review_notes && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Reviewer notes: </span>
                          <span className="text-foreground">{req.review_notes}</span>
                        </div>
                      )}

                      {req.status === "pending" ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Optional notes (required for rejection)"
                            value={noteDraft[req.id] || ""}
                            onChange={e => setNoteDraft(d => ({ ...d, [req.id]: e.target.value }))}
                            className="text-xs min-h-[60px]"
                          />
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="h-8 gap-1" onClick={() => handleApprove(req)}>
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => handleReject(req)}>
                              <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => handleReopen(req)}>
                            <RefreshCw className="w-3 h-3" /> Reopen
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============== AUDIT LOG PANEL ==============
function AuditLogPanel() {
  const [entries, setEntries] = useState<any[]>([]);
  const [actors, setActors] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    const rows = data || [];
    setEntries(rows);
    const ids = Array.from(new Set(rows.flatMap((r: any) => [r.actor_id, r.target_user_id]).filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setActors(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e: any) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    const actor = actors[e.actor_id]?.display_name || "";
    const target = actors[e.target_user_id]?.display_name || "";
    return e.action.toLowerCase().includes(s) || actor.toLowerCase().includes(s) || target.toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><History className="w-5 h-5 text-primary" /> Audit Log</h1>
          <p className="text-sm text-muted-foreground">{entries.length} most recent admin actions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Filter by action or name…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[240px] text-sm" />
          </div>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No audit entries.</CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3">When</th>
                  <th className="text-left px-4 py-3">Actor</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Target</th>
                  <th className="text-left px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((e: any) => {
                  const actor = actors[e.actor_id];
                  const target = actors[e.target_user_id];
                  return (
                    <tr key={e.id} className="hover:bg-muted/20 align-top">
                      <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{actor?.display_name || <span className="text-muted-foreground font-mono text-[11px]">{e.actor_id.slice(0, 8)}</span>}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] font-mono">{e.action}</Badge></td>
                      <td className="px-4 py-3 text-[12px]">
                        {target?.display_name || (e.target_user_id ? <span className="text-muted-foreground font-mono text-[11px]">{e.target_user_id.slice(0, 8)}</span> : "—")}
                        {e.target_type && <div className="text-[10px] text-muted-foreground">{e.target_type}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {e.metadata && Object.keys(e.metadata).length > 0 ? (
                          <pre className="text-[10px] bg-muted/40 rounded p-1.5 max-w-[260px] overflow-x-auto whitespace-pre-wrap break-words">
{JSON.stringify(e.metadata, null, 0)}
                          </pre>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
