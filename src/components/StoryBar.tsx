import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import VerifiedBadge from "./VerifiedBadge";

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
}

interface Story {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
  attachment?: { file_url: string; file_type: string | null } | null;
}

const STATUS_HOURS = 24;

const getInitials = (name: string | null | undefined) =>
  (name || "??").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const StoryBar = ({ refreshKey }: { refreshKey?: number }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [viewing, setViewing] = useState<Story | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, verified")
      .eq("user_id", user.id)
      .maybeSingle();
    setMe(myProfile as Profile);

    const since = new Date(Date.now() - STATUS_HOURS * 3600 * 1000).toISOString();
    const { data: posts } = await supabase
      .from("posts")
      .select("id, user_id, content, created_at")
      .eq("tag", "status")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!posts || posts.length === 0) { setStories([]); return; }

    const ids = [...new Set(posts.map(p => p.user_id))];
    const [{ data: profiles }, { data: atts }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, verified").in("user_id", ids),
      supabase.from("post_attachments").select("post_id, file_url, file_type").in("post_id", posts.map(p => p.id)),
    ]);
    const profMap = new Map((profiles || []).map(p => [p.user_id, p as Profile]));
    const attMap = new Map((atts || []).map(a => [a.post_id, a]));

    setStories(posts.map(p => ({
      ...p,
      profile: profMap.get(p.user_id),
      attachment: (attMap.get(p.id) as any) || null,
    })));
  };

  useEffect(() => { load(); }, [refreshKey]);

  const handleAddStatus = async (file: File) => {
    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: post, error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content: "", tag: "status" })
        .select().single();
      if (error) throw error;

      const ext = file.name.split(".").pop();
      const path = `${user.id}/status_${post.id}.${ext}`;
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

      toast.success("Status posted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPosting(false);
    }
  };

  // Group: my own stories first, then unique others (most recent per user)
  const seen = new Set<string>();
  const ordered: Story[] = [];
  for (const s of stories) {
    if (seen.has(s.user_id)) continue;
    seen.add(s.user_id);
    ordered.push(s);
  }
  const myStory = ordered.find(s => me && s.user_id === me.user_id);
  const others = ordered.filter(s => !me || s.user_id !== me.user_id);

  return (
    <div className="content-card !p-3 mb-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-1 px-1">
        {/* Add / my story */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={posting}
          className="shrink-0 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-0"
        >
          <div className="relative">
            <div className={`w-14 h-14 rounded-full p-[2px] ${myStory ? "bg-gradient-to-tr from-emerald-500 via-primary to-purple-500" : "bg-muted"}`}>
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                {me?.avatar_url ? (
                  <img src={me.avatar_url} alt="me" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-sm font-semibold text-primary">{getInitials(me?.display_name)}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
              <Plus className="w-3 h-3" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground max-w-[60px] truncate">
            {posting ? "Posting…" : "My status"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleAddStatus(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />

        {others.map(s => (
          <button key={s.id} onClick={() => setViewing(s)}
            className="shrink-0 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-0">
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-emerald-500 via-primary to-purple-500">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                {s.profile?.avatar_url ? (
                  <img src={s.profile.avatar_url} alt={s.profile.display_name || ""} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-sm font-semibold text-primary">{getInitials(s.profile?.display_name)}</span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground max-w-[60px] truncate flex items-center gap-0.5">
              {(s.profile?.display_name || "User").split(" ")[0]}
              <VerifiedBadge verified={s.profile?.verified} className="w-2.5 h-2.5" />
            </span>
          </button>
        ))}

        {others.length === 0 && !myStory && (
          <div className="flex items-center text-[11px] text-muted-foreground pl-2">No status updates yet.</div>
        )}
      </div>

      {/* Story viewer */}
      {viewing && (
        <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center" onClick={() => setViewing(null)}>
          <button onClick={(e) => { e.stopPropagation(); setViewing(null); }}
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 border-none cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-4 right-16 flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
              {viewing.profile?.avatar_url
                ? <img src={viewing.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-xs">{getInitials(viewing.profile?.display_name)}</span>}
            </div>
            <div className="text-sm font-semibold flex items-center gap-1">
              {viewing.profile?.display_name || "User"}
              <VerifiedBadge verified={viewing.profile?.verified} />
            </div>
          </div>
          <div className="max-w-[90vw] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            {viewing.attachment?.file_type?.startsWith("video/") ? (
              <video src={viewing.attachment.file_url} controls autoPlay className="max-w-full max-h-[80vh]" />
            ) : viewing.attachment?.file_type?.startsWith("image/") ? (
              <img src={viewing.attachment.file_url} alt="status" className="max-w-full max-h-[80vh] object-contain" />
            ) : (
              <p className="text-white text-lg p-6">{viewing.content}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryBar;
