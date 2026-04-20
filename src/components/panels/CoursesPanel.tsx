const courses = [
  { code: "CSC 301", name: "Data Structures & Algorithms", units: 3, lecturer: "Dr. Aminu B.", grade: "—", status: "In Progress" },
  { code: "CSC 305", name: "Operating Systems", units: 3, lecturer: "Prof. Yusuf K.", grade: "—", status: "In Progress" },
  { code: "CSC 311", name: "Database Management Systems", units: 3, lecturer: "Dr. Fatima M.", grade: "—", status: "In Progress" },
  { code: "MTH 301", name: "Numerical Analysis", units: 2, lecturer: "Dr. Sani A.", grade: "—", status: "In Progress" },
  { code: "GST 301", name: "Nigerian Peoples & Culture", units: 2, lecturer: "Mal. Ibrahim D.", grade: "—", status: "In Progress" },
];

const pastCourses = [
  { code: "CSC 201", name: "Computer Programming II", units: 3, lecturer: "Dr. Aminu B.", grade: "A", status: "Completed" },
  { code: "CSC 205", name: "Computer Architecture", units: 3, lecturer: "Prof. Yusuf K.", grade: "B+", status: "Completed" },
  { code: "MTH 201", name: "Mathematical Methods", units: 3, lecturer: "Dr. Sani A.", grade: "A", status: "Completed" },
  { code: "STA 201", name: "Intro to Statistics", units: 2, lecturer: "Dr. Halima Y.", grade: "B+", status: "Completed" },
];

const gradeColor: Record<string, string> = {
  A: "text-emerald-600",
  "B+": "text-blue-600",
  "—": "text-muted-foreground",
};

const CoursesPanel = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">My Courses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{courses.length + pastCourses.length} courses total</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold">Current Semester</h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">2025/2026 — 1st</span>
        </div>
        <div className="space-y-2">
          {courses.map((c) => (
            <div key={c.code} className="content-card flex items-center gap-3">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded w-[80px] text-center flex-shrink-0">
                {c.code}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">{c.lecturer} · {c.units} CU</div>
              </div>
              <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Previous Semester</h3>
        <div className="space-y-2">
          {pastCourses.map((c) => (
            <div key={c.code} className="content-card flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded w-[80px] text-center flex-shrink-0">
                {c.code}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">{c.lecturer} · {c.units} CU</div>
              </div>
              <span className={`text-sm font-semibold ${gradeColor[c.grade]}`}>{c.grade}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPanel;
