import { GraduationCap } from "lucide-react";

interface Course {
  code: string;
  name: string;
  units: number;
  lecturer: string;
  grade: string;
  status: string;
}

const gradeColor: Record<string, string> = {
  A: "text-emerald-600",
  "B+": "text-blue-600",
  "—": "text-muted-foreground",
};

const CoursesPanel = () => {
  // Real courses will be uploaded by admins per department/level. Until then, show an empty state.
  const courses: Course[] = [];
  const pastCourses: Course[] = [];

  const totalCourses = courses.length + pastCourses.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">My Courses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCourses === 0 ? "No courses registered yet" : `${totalCourses} courses total`}
          </p>
        </div>
      </div>

      {totalCourses === 0 ? (
        <div className="content-card flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <GraduationCap className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No courses yet</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Your registered courses will appear here once your admin sets up your semester.
          </p>
        </div>
      ) : (
        <>
          {courses.length > 0 && (
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
          )}

          {pastCourses.length > 0 && (
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
          )}
        </>
      )}
    </div>
  );
};

export default CoursesPanel;
