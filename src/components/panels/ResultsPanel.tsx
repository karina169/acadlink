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

const results: SemesterResult[] = [
  {
    session: "2024/2025", semester: "First Semester", gpa: 4.12,
    courses: [
      { code: "CSC 201", title: "Computer Programming II", units: 3, score: 78, grade: "A" },
      { code: "CSC 203", title: "Discrete Mathematics", units: 3, score: 65, grade: "B" },
      { code: "MTH 201", title: "Mathematical Methods I", units: 3, score: 58, grade: "C" },
      { code: "STA 201", title: "Probability & Statistics", units: 3, score: 72, grade: "B" },
      { code: "PHY 201", title: "Electromagnetism", units: 3, score: 82, grade: "A" },
      { code: "GST 201", title: "Nigerian Peoples & Culture", units: 2, score: 70, grade: "B" },
    ],
  },
  {
    session: "2023/2024", semester: "Second Semester", gpa: 3.85,
    courses: [
      { code: "CSC 104", title: "Intro to Programming", units: 3, score: 85, grade: "A" },
      { code: "MTH 102", title: "Elementary Maths II", units: 3, score: 62, grade: "B" },
      { code: "PHY 102", title: "General Physics II", units: 3, score: 55, grade: "C" },
      { code: "CHM 102", title: "General Chemistry II", units: 3, score: 68, grade: "B" },
      { code: "GST 102", title: "Use of English II", units: 2, score: 74, grade: "B" },
    ],
  },
  {
    session: "2023/2024", semester: "First Semester", gpa: 3.67,
    courses: [
      { code: "CSC 101", title: "Intro to Computer Science", units: 3, score: 80, grade: "A" },
      { code: "MTH 101", title: "Elementary Maths I", units: 3, score: 56, grade: "C" },
      { code: "PHY 101", title: "General Physics I", units: 3, score: 60, grade: "B" },
      { code: "CHM 101", title: "General Chemistry I", units: 3, score: 52, grade: "C" },
      { code: "GST 101", title: "Use of English I", units: 2, score: 71, grade: "B" },
    ],
  },
];

const cgpa = (results.reduce((s, r) => s + r.gpa, 0) / results.length).toFixed(2);

const ResultsPanel = () => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

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
          <div className="text-xl font-bold">{results[0].gpa.toFixed(2)}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Latest GPA</div>
        </div>
        <div className="stat-card text-center">
          <FileText className="w-5 h-5 mx-auto mb-1.5 text-primary" />
          <div className="text-xl font-bold">{results.reduce((s, r) => s + r.courses.length, 0)}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Courses</div>
        </div>
      </div>

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
    </div>
  );
};

export default ResultsPanel;
