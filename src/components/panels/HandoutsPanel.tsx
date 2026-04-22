import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Handout {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: string | null;
  created_at: string;
  course_code?: string;
}

const HandoutsPanel = () => {
  const [items, setItems] = useState<Handout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("department, level")
        .eq("user_id", user.id)
        .single();

      let deptId: string | null = null;
      if (profile?.department) {
        const { data: dept } = await supabase.from("departments").select("id").eq("name", profile.department).maybeSingle();
        deptId = dept?.id ?? null;
      }

      let query = supabase
        .from("handouts")
        .select("id, title, description, file_url, file_name, file_size, created_at, target_departments, department_id, level, courses(code)")
        .order("created_at", { ascending: false });

      if (profile?.level) query = query.or(`level.eq.${profile.level},level.is.null`);

      const { data } = await query;
      const filtered = ((data as any[]) || []).filter((r) => {
        if (!deptId) return true;
        const targets: string[] = r.target_departments || [];
        if (targets.length > 0) return targets.includes(deptId);
        // legacy: fall back to single department_id (or all if null)
        return !r.department_id || r.department_id === deptId;
      });
      setItems(filtered.map((r) => ({ ...r, course_code: r.courses?.code })));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="page-header">Handouts</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {items.length === 0 ? "No handouts uploaded yet" : `${items.length} handout${items.length === 1 ? "" : "s"} available`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="content-card flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No handouts yet</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Lecture handouts will appear here once your admin uploads them for your department & level.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((h) => (
            <div key={h.id} className="content-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">📄</div>
              <div className="flex-1 min-w-0">
                {h.course_code && <div className="text-[11px] font-semibold text-primary mb-0.5">{h.course_code}</div>}
                <div className="text-sm font-semibold truncate">{h.title}</div>
                {h.description && <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{h.description}</div>}
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(h.created_at).toLocaleDateString()} {h.file_size && `· ${h.file_size}`}
                </div>
              </div>
              <a href={h.file_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center gap-1 flex-shrink-0">
                <Download className="w-3 h-3" /> Open
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HandoutsPanel;
