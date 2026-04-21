import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Paperclip, X, Image, Film, FileText } from "lucide-react";

interface PostComposerProps {
  userInitials: string;
  onPostCreated?: () => void;
  fullscreen?: boolean;
}

const tags = [
  { value: "discussion", label: "Discussion" },
  { value: "question", label: "Question" },
  { value: "announcement", label: "Notice" },
  { value: "resource", label: "Resource" },
];

const PostComposer = ({ userInitials, onPostCreated, fullscreen = false }: PostComposerProps) => {
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("discussion");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(fullscreen);
  const fileRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus in fullscreen mode
  useEffect(() => {
    if (fullscreen) textareaRef.current?.focus();
  }, [fullscreen]);

  // Close toolbar when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) {
        if (!content.trim() && !file) setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [content, file]);

  // Generate preview for images/videos
  useEffect(() => {
    if (!file) { setFilePreview(null); return; }
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreview(null);
  }, [file]);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: post, error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        tag,
      }).select().single();
      if (error) throw error;

      if (file && post) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${post.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-files").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("post-files").getPublicUrl(path);
        await supabase.from("post_attachments").insert({
          post_id: post.id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: `${(file.size / 1024).toFixed(0)} KB`,
          file_type: file.type,
        });
      }

      setContent("");
      setFile(null);
      setTag("discussion");
      setExpanded(false);
      toast.success("Post published!");
      onPostCreated?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPosting(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4 text-emerald-500" />;
    if (file.type.startsWith("video/")) return <Film className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div ref={composerRef} className={`content-card transition-all ${expanded ? "ring-2 ring-primary/15 border-primary/30" : ""}`}>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
          {userInitials}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none outline-none text-sm resize-none placeholder:text-muted-foreground"
            rows={expanded ? 3 : 1}
          />

          {/* File preview */}
          {file && (
            <div className="mt-2 relative">
              {file.type.startsWith("image/") && filePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={filePreview} alt={file.name} className="w-full max-h-[200px] object-cover" />
                  <button onClick={() => setFile(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 border-none cursor-pointer hover:bg-black/80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : file.type.startsWith("video/") && filePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <video src={filePreview} className="w-full max-h-[200px] object-cover" muted />
                  <button onClick={() => setFile(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 border-none cursor-pointer hover:bg-black/80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Film className="w-3 h-3" /> Video
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  {getFileIcon()}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{file.name}</div>
                    <div className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Expandable toolbar — only shows when focused/expanded */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex gap-1">
                {tags.map(t => (
                  <button key={t.value} onClick={() => setTag(t.value)}
                    className={`filter-pill text-xs ${tag === t.value ? "filter-pill-active" : ""}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" hidden accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer" title="Attach file">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button onClick={handlePost} disabled={posting || !content.trim()}
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium border-none cursor-pointer transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
