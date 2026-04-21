import { Pencil } from "lucide-react";

interface PostComposerTriggerProps {
  userInitials: string;
  onClick: () => void;
}

const PostComposerTrigger = ({ userInitials, onClick }: PostComposerTriggerProps) => {
  return (
    <button
      onClick={onClick}
      className="content-card w-full text-left flex items-center gap-3 cursor-pointer border-none transition-all hover:ring-2 hover:ring-primary/15 hover:border-primary/30"
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
        {userInitials}
      </div>
      <div className="flex-1 bg-muted/60 rounded-full px-4 py-2 text-sm text-muted-foreground">
        What's on your mind?
      </div>
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Pencil className="w-4 h-4" />
      </div>
    </button>
  );
};

export default PostComposerTrigger;
