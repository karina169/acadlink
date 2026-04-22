import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, Award, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CourseResult {
  id: string;
  course_code: string;
  course_title: string | null;
  units: number;
  score: number | null;
  grade: string;
}

interface SemesterResult {
  session: string;
  semester: string;
  gpa: number;
  courses: CourseResult[];
}

const gradePoint = (g: string) => {
  const m: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
  return m[g.toUpperCase()] ?? 0;
};

const gradeColor = (g: string) => {
  const G = g.toUpperCase();
  if (G === "A") return "text-emerald-600";
  if (G === "B") return "text-blue-600";
  if (G === "C") return "text-amber-600";
  if (G === "D") return "text-orange-600";
  return "text-destructive";
};

const ResultsPanel = () => {
  const [results, setResults] = useState<SemesterResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("student_results")
        .select("id, session, semester, course_code, course_title, units, score, grade")
        .eq("student_id", user.id)
        .order("session", { ascending: false })
        .order("semester", { ascending: false });

      const grouped = new Map<string, SemesterResult>();
      ((data as CourseResult[] & { session: string; semester: string }[]) || []).forEach((row: any) => {
        const key = `${row.session}__${row.semester}`;
        if (!grouped.has(key)) grouped.set(key, { session: row.session, semester: row.semester, gpa: 0, courses: [] });
        grouped.get(key)!.courses.push(row);
      });

      const list = Array.from(grouped.values()).map((sem) => {
        const totalUnits = sem.courses.reduce((s, c) => s + c.units, 0);
        const totalPoints = sem.courses.reduce((s, c) => s + gradePoint(c.grade) * c.units, 0);
        sem.gpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
        return sem;
      });

      setResults(list);
      setLoading(false);
    };
    load();
  }, []);

  const cgpa = results.length > 0 ? (results.reduce((s, r) => s + r.gpa, 0) / results.length).toFixed(2) : "—";
  const latestGpa = results[0] ? results[0].gpa.toFixed(2) : "—";
  const totalCourses = results.reduce((s, r) => s + r.courses.length, 0);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="page-header">Academic Results</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your academic performance summary</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card text-center">
          <Award className="w-5 h-5 mx-auto mb-1.5 text-primary" />
          <div className="text-xl font-bold">{cgpa}</div>
          <div className="text-[11px] text-muted-foreground font-medium">CGPA</div>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1.5 text-primary" />
          <div className="text-xl font-bold">{latestGpa}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Latest GPA</div>
        </div>
        <div className="stat-card text-center">
          <FileText className="w-5 h-5 mx-auto mb-1.5 text-primary" />
          <div className="text-xl font-bold">{totalCourses}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Courses</div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="content-card flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No results published yet</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Your semester results will appear here once your admin uploads them.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((sem, idx) => {
            const open = expandedIdx === idx;
            const totalUnits = sem.courses.reduce((s, c) => s + c.units, 0);
            return (
              <div key={`${sem.session}-${sem.semester}`} className="content-card !p-0 overflow-hidden">
                <button onClick={() => setExpandedIdx(open ? null : idx)} className="w-full flex items-center justify-between p-4 text-left bg-transparent border-none cursor-pointer">
                  <div>
                    <h3 className="font-semibold text-sm">{sem.session} — {sem.semester}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">GPA: <span className="text-primary font-semibold">{sem.gpa.toFixed(2)}</span> · {totalUnits} Units · {sem.courses.length} Courses</p>
                  </div>
                  {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {open && (
                  <div className="border-t border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          <th className="text-left px-4 py-2">Course</th>
                          <th className="text-center px-2 py-2">Units</th>
                          <th className="text-center px-2 py-2">Score</th>
                          <th className="text-center px-2 py-2">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sem.courses.map((c) => (
                          <tr key={c.id}>
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-xs">{c.course_code}</span>
                              {c.course_title && <span className="text-xs text-muted-foreground ml-1.5">{c.course_title}</span>}
                            </td>
                            <td className="text-center text-xs text-muted-foreground px-2">{c.units}</td>
                            <td className="text-center text-xs font-medium px-2">{c.score ?? "—"}</td>
                            <td className={`text-center text-xs font-semibold px-2 ${gradeColor(c.grade)}`}>{c.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;
