import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  level: string;
  semester: string;
}

const CoursesPanel = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("department, level")
        .eq("user_id", user.id)
        .single();

      setUserLevel(profile?.level ?? null);

      if (!profile?.department) { setLoading(false); return; }

      const { data: dept } = await supabase
        .from("departments")
        .select("id")
        .eq("name", profile.department)
        .maybeSingle();

      if (!dept) { setLoading(false); return; }

      let query = supabase
        .from("courses")
        .select("id, code, title, units, level, semester")
        .eq("department_id", dept.id)
        .order("code");

      if (profile.level) query = query.in("level", [profile.level, "ALL"]);

      const { data } = await query;
      setCourses((data as Course[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const current = courses.filter((c) => c.level !== "ALL");

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">My Courses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {current.length === 0 ? "No courses registered yet" : `${current.length} courses · ${userLevel ? `${userLevel} Level` : "all levels"}`}
          </p>
        </div>
      </div>

      {current.length === 0 ? (
        <div className="content-card flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <GraduationCap className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No courses yet</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Your registered courses will appear here once your admin adds them for your department & level.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {current.map((c) => (
            <div key={c.id} className="content-card flex items-center gap-3">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded w-[80px] text-center flex-shrink-0">
                {c.code}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.title}</div>
                <div className="text-[11px] text-muted-foreground">{c.units} CU · {c.semester} Sem · {c.level}L</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPanel;
