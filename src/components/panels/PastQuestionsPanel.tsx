import { useEffect, useState } from "react";
import { Download, FileQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PastQuestion {
  id: string;
  title: string;
  session: string | null;
  semester: string | null;
  pages: number | null;
  downloads: number;
  file_url: string;
  file_name: string;
  course_code?: string;
}

const PastQuestionsPanel = () => {
  const [items, setItems] = useState<PastQuestion[]>([]);
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
        .from("past_questions")
        .select("id, title, session, semester, pages, downloads, file_url, file_name, target_departments, department_id, level, courses(code)")
        .order("created_at", { ascending: false });

      if (profile?.level) query = query.or(`level.eq.${profile.level},level.is.null`);

      const { data } = await query;
      const filtered = ((data as any[]) || []).filter((r) => {
        if (!deptId) return true;
        const targets: string[] = r.target_departments || [];
        if (targets.length > 0) return targets.includes(deptId);
        return !r.department_id || r.department_id === deptId;
      });
      setItems(filtered.map((r) => ({ ...r, course_code: r.courses?.code })));
      setLoading(false);
    };
    load();
  }, []);

  const handleDownload = async (pq: PastQuestion) => {
    window.open(pq.file_url, "_blank");
    await supabase.from("past_questions").update({ downloads: pq.downloads + 1 }).eq("id", pq.id);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">Past Questions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length === 0 ? "No papers uploaded yet" : `${items.length} papers available`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="content-card flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileQuestion className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No past questions yet</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Past question papers will appear here once your admin uploads them for your department.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((pq) => (
            <div key={pq.id} className="content-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">📋</div>
              <div className="flex-1 min-w-0">
                {pq.course_code && <div className="text-[11px] font-semibold text-primary mb-0.5">{pq.course_code}</div>}
                <div className="text-sm font-semibold truncate">{pq.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {[pq.session, pq.semester, pq.pages ? `${pq.pages} pages` : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[11px] text-muted-foreground mb-1">{pq.downloads} downloads</div>
                <button onClick={() => handleDownload(pq)} className="text-xs font-medium text-primary hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1">
                  <Download className="w-3 h-3" /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastQuestionsPanel;
