import { Download } from "lucide-react";

const pastQuestions = [
  { id: 1, course: "CSC 301", title: "Data Structures & Algorithms — 2022/2023", session: "2022/2023", semester: "1st Semester", pages: 8, downloads: 456 },
  { id: 2, course: "CSC 305", title: "Operating Systems — 2022/2023", session: "2022/2023", semester: "1st Semester", pages: 6, downloads: 389 },
  { id: 3, course: "CSC 311", title: "Database Management — 2021/2022", session: "2021/2022", semester: "2nd Semester", pages: 10, downloads: 521 },
  { id: 4, course: "MTH 301", title: "Numerical Analysis — 2022/2023", session: "2022/2023", semester: "1st Semester", pages: 5, downloads: 278 },
  { id: 5, course: "CSC 301", title: "Data Structures & Algorithms — 2021/2022", session: "2021/2022", semester: "1st Semester", pages: 7, downloads: 612 },
  { id: 6, course: "CSC 305", title: "Operating Systems — 2021/2022", session: "2021/2022", semester: "2nd Semester", pages: 9, downloads: 345 },
];

const PastQuestionsPanel = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">Past Questions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{pastQuestions.length} papers available</p>
        </div>
      </div>

      <div className="space-y-2">
        {pastQuestions.map((pq) => (
          <div key={pq.id} className="content-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">📋</div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-primary mb-0.5">{pq.course}</div>
              <div className="text-sm font-semibold truncate">{pq.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{pq.session} · {pq.semester} · {pq.pages} pages</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] text-muted-foreground mb-1">{pq.downloads} downloads</div>
              <button className="text-xs font-medium text-primary hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1">
                <Download className="w-3 h-3" /> View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PastQuestionsPanel;
