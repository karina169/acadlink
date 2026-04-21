import { Download, FileQuestion } from "lucide-react";

interface PastQuestion {
  id: string;
  course: string;
  title: string;
  session: string;
  semester: string;
  pages: number;
  downloads: number;
}

const PastQuestionsPanel = () => {
  // Real past questions will be uploaded by admins. Until then, show an empty state.
  const pastQuestions: PastQuestion[] = [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">Past Questions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pastQuestions.length === 0 ? "No papers uploaded yet" : `${pastQuestions.length} papers available`}
          </p>
        </div>
      </div>

      {pastQuestions.length === 0 ? (
        <div className="content-card flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileQuestion className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No past questions yet</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Past question papers will appear here once your admin uploads them.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default PastQuestionsPanel;
