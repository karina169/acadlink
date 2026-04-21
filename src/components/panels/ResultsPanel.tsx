import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, Award, FileText } from "lucide-react";

interface CourseResult {
  code: string;
  title: string;
  units: number;
  score: number;
  grade: string;
}

interface SemesterResult {
  session: string;
  semester: string;
  gpa: number;
  courses: CourseResult[];
}

const gradeColor = (g: string) => {
  if (g === "A") return "text-emerald-600";
  if (g === "B") return "text-blue-600";
  if (g === "C") return "text-amber-600";
  if (g === "D") return "text-orange-600";
  return "text-destructive";
};

const ResultsPanel = () => {
  // Real results will be uploaded by admins per student. Until then, show an empty state.
  const results: SemesterResult[] = [];
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const cgpa = results.length > 0 ? (results.reduce((s, r) => s + r.gpa, 0) / results.length).toFixed(2) : "—";
  const latestGpa = results[0]?.gpa.toFixed(2) ?? "—";
  const totalCourses = results.reduce((s, r) => s + r.courses.length, 0);

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
              <div key={idx} className="content-card !p-0 overflow-hidden">
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
                          <tr key={c.code}>
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-xs">{c.code}</span>
                              <span className="text-xs text-muted-foreground ml-1.5">{c.title}</span>
                            </td>
                            <td className="text-center text-xs text-muted-foreground px-2">{c.units}</td>
                            <td className="text-center text-xs font-medium px-2">{c.score}</td>
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
