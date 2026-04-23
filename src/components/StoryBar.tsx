import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Edit3, X, Plus } from "lucide-react";
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

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const StoryBar = ({ refreshKey }: { refreshKey?: number }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [viewing, setViewing] = useState<{ list: Story[]; index: number } | null>(null);
  const [posting, setPosting] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
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
      .limit(100);

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

  const postStatus = async ({ file, text }: { file?: File; text?: string }) => {
    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: post, error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content: text || "", tag: "status" })
        .select().single();
      if (error) throw error;

      if (file) {
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
      }

      toast.success("Status posted");
      setTextOpen(false);
      setTextValue("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPosting(false);
    }
  };

  // Group statuses by user (most recent first per user)
  const byUser = new Map<string, Story[]>();
  for (const s of stories) {
    const arr = byUser.get(s.user_id) || [];
    arr.push(s);
    byUser.set(s.user_id, arr);
  }
  const myStatuses = me ? (byUser.get(me.user_id) || []) : [];
  const others = [...byUser.entries()]
    .filter(([uid]) => !me || uid !== me.user_id)
    .map(([, arr]) => arr)
    .sort((a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime());

  const StatusRing = ({ avatar, name, count = 1, dim = false }: { avatar?: string | null; name?: string | null; count?: number; dim?: boolean }) => {
    // Segmented ring for multiple statuses
    const segments = Math.min(count, 8);
    const gap = segments > 1 ? 4 : 0;
    const total = 360;
    const segDeg = (total - gap * segments) / segments;
    return (
      <div className="relative w-[52px] h-[52px] shrink-0">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 52 52">
          {Array.from({ length: segments }).map((_, i) => {
            const start = i * (segDeg + gap);
            const r = 24;
            const c = 2 * Math.PI * r;
            const dash = (segDeg / 360) * c;
            return (
              <circle
                key={i}
                cx="26" cy="26" r={r}
                fill="none"
                stroke={dim ? "hsl(var(--muted-foreground) / 0.4)" : "url(#statusGrad)"}
                strokeWidth="2.5"
                strokeDasharray={`${dash} ${c}`}
                strokeDashoffset={-(start / 360) * c}
                strokeLinecap="round"
              />
            );
          })}
          <defs>
            <linearGradient id="statusGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.18 145)" />
              <stop offset="50%" stopColor="oklch(0.65 0.2 240)" />
              <stop offset="100%" stopColor="oklch(0.6 0.22 300)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-[4px] rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={name || ""} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-primary">{getInitials(name)}</span>
          )}
        </div>
      </div>
    );
  };

  const openViewer = (list: Story[]) => setViewing({ list, index: 0 });
  const next = () => {
    if (!viewing) return;
    if (viewing.index + 1 >= viewing.list.length) setViewing(null);
    else setViewing({ ...viewing, index: viewing.index + 1 });
  };
  const prev = () => {
    if (!viewing) return;
    if (viewing.index === 0) return;
    setViewing({ ...viewing, index: viewing.index - 1 });
  };

  return (
    <div className="content-card !p-0 mb-3 overflow-hidden">
      {/* My status row */}
      <button
        onClick={() => myStatuses.length > 0 ? openViewer(myStatuses) : fileRef.current?.click()}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors bg-transparent border-none cursor-pointer text-left"
      >
        <div className="relative">
          {myStatuses.length > 0 ? (
            <StatusRing avatar={me?.avatar_url} name={me?.display_name} count={myStatuses.length} />
          ) : (
            <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {me?.avatar_url ? (
                <img src={me.avatar_url} alt="me" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-primary">{getInitials(me?.display_name)}</span>
              )}
            </div>
          )}
          {myStatuses.length === 0 && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
              <Plus className="w-3 h-3" strokeWidth={3} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">My status</div>
          <div className="text-xs text-muted-foreground truncate">
            {posting ? "Posting…" : myStatuses.length > 0
              ? `${myStatuses.length} update${myStatuses.length > 1 ? "s" : ""} · ${timeAgo(myStatuses[0].created_at)}`
              : "Tap to add status update"}
          </div>
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={posting}
            className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center border-none cursor-pointer hover:bg-emerald-600 transition-colors"
            aria-label="Add photo status"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTextOpen(true)}
            disabled={posting}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-none cursor-pointer hover:opacity-90 transition-opacity"
            aria-label="Add text status"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) postStatus({ file: f });
          if (fileRef.current) fileRef.current.value = "";
        }}
      />

      {/* Recent updates */}
      {others.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-y border-border/50">
            Recent updates
          </div>
          <div className="divide-y divide-border/40">
            {others.map((list) => {
              const head = list[0];
              return (
                <button
                  key={head.user_id}
                  onClick={() => openViewer(list)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors bg-transparent border-none cursor-pointer text-left"
                >
                  <StatusRing avatar={head.profile?.avatar_url} name={head.profile?.display_name} count={list.length} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-1 truncate">
                      <span className="truncate">{head.profile?.display_name || "User"}</span>
                      <VerifiedBadge verified={head.profile?.verified} className="w-3 h-3" />
                    </div>
                    <div className="text-xs text-muted-foreground">{timeAgo(head.created_at)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {others.length === 0 && myStatuses.length === 0 && (
        <div className="px-3 pb-3 text-[11px] text-muted-foreground">No status updates in the last 24 hours.</div>
      )}

      {/* Text status composer */}
      {textOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={() => setTextOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-xl w-full max-w-md p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">New text status</h3>
              <button onClick={() => setTextOpen(false)} className="bg-transparent border-none cursor-pointer text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              maxLength={280}
              rows={4}
              placeholder="Type a status..."
              className="w-full p-3 rounded-lg bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-muted-foreground">{textValue.length}/280 · expires in 24h</span>
              <button
                onClick={() => textValue.trim() && postStatus({ text: textValue.trim() })}
                disabled={posting || !textValue.trim()}
                className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold border-none cursor-pointer disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story viewer */}
      {viewing && (() => {
        const cur = viewing.list[viewing.index];
        return (
          <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center" onClick={next}>
            {/* Progress bars */}
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
              {viewing.list.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                  <div className={`h-full bg-white transition-all ${i < viewing.index ? "w-full" : i === viewing.index ? "w-full animate-[grow_5s_linear]" : "w-0"}`} />
                </div>
              ))}
            </div>
            <button onClick={(e) => { e.stopPropagation(); setViewing(null); }}
              className="absolute top-5 right-3 text-white bg-white/10 rounded-full p-2 border-none cursor-pointer z-20">
              <X className="w-5 h-5" />
            </button>
            <div className="absolute top-6 left-3 right-16 flex items-center gap-2 text-white z-10">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                {cur.profile?.avatar_url
                  ? <img src={cur.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xs">{getInitials(cur.profile?.display_name)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1">
                  {cur.profile?.display_name || "User"}
                  <VerifiedBadge verified={cur.profile?.verified} />
                </div>
                <div className="text-[11px] text-white/70">{timeAgo(cur.created_at)}</div>
              </div>
            </div>

            {/* Tap zones */}
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-0 top-0 bottom-0 w-1/4 bg-transparent border-none cursor-pointer z-[5]"
              aria-label="Previous"
            />
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-0 top-0 bottom-0 w-1/4 bg-transparent border-none cursor-pointer z-[5]"
              aria-label="Next"
            />

            <div className="max-w-[92vw] max-h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {cur.attachment?.file_type?.startsWith("video/") ? (
                <video src={cur.attachment.file_url} controls autoPlay className="max-w-full max-h-[80vh]" />
              ) : cur.attachment?.file_type?.startsWith("image/") ? (
                <img src={cur.attachment.file_url} alt="status" className="max-w-full max-h-[80vh] object-contain" />
              ) : (
                <p className="text-white text-2xl font-medium px-8 text-center leading-relaxed">{cur.content}</p>
              )}
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes grow { from { width: 0 } to { width: 100% } }`}</style>
    </div>
  );
};

export default StoryBar;
