import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import PostComposer from "./PostComposer";

interface PostScreenProps {
  open: boolean;
  userInitials: string;
  onClose: () => void;
  onPostCreated?: () => void;
}

const PostScreen = ({ open, userInitials, onClose, onPostCreated }: PostScreenProps) => {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handlePosted = () => {
    onPostCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-background animate-in fade-in duration-150 sm:bg-foreground/40 sm:flex sm:items-start sm:justify-center sm:py-10 overflow-y-auto">
      <div className="w-full sm:max-w-[640px] sm:rounded-xl sm:shadow-2xl bg-background min-h-full sm:min-h-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-3 py-2.5 flex items-center gap-3">
          <button
            onClick={onClose}
            aria-label="Back to feed"
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center bg-transparent border-none cursor-pointer text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold">Create post</span>
        </div>

        {/* Composer in fullscreen mode */}
        <div className="p-3 sm:p-4 flex-1">
          <PostComposer
            userInitials={userInitials}
            onPostCreated={handlePosted}
            fullscreen
          />
        </div>
      </div>
    </div>
  );
};

export default PostScreen;
