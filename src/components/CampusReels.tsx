import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Volume2, VolumeX, Play } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";

interface Reel {
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  file_url: string;
  file_type: string | null;
  profile?: { display_name: string | null; avatar_url: string | null; verified: boolean | null } | null;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
}

const getInitials = (name: string | null | undefined) =>
  (name || "??").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const ReelItem = ({ reel, active, muted, onToggleMute, userId, onLikeChange }: {
  reel: Reel; active: boolean; muted: boolean; onToggleMute: () => void; userId: string;
  onLikeChange: (postId: string, liked: boolean) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && !paused) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active, paused]);

  const toggleLike = async () => {
    if (reel.user_liked) {
      await supabase.from("post_likes").delete().eq("post_id", reel.post_id).eq("user_id", userId);
      onLikeChange(reel.post_id, false);
    } else {
      await supabase.from("post_likes").insert({ post_id: reel.post_id, user_id: userId });
      onLikeChange(reel.post_id, true);
    }
  };

  return (
    <div className="relative h-full w-full snap-start snap-always flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={reel.file_url}
        loop
        playsInline
        muted={muted}
        onClick={() => setPaused(p => !p)}
        className="max-h-full max-w-full object-contain cursor-pointer"
      />
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="w-16 h-16 text-white/80 drop-shadow-lg" fill="currentColor" />
        </div>
      )}

      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center border-none cursor-pointer backdrop-blur-sm"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Right action rail */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
        <button onClick={toggleLike} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer text-white">
          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Heart className={`w-5 h-5 ${reel.user_liked ? "fill-red-500 text-red-500" : ""}`} />
          </div>
          <span className="text-[11px] font-semibold drop-shadow">{reel.like_count}</span>
        </button>
        <div className="flex flex-col items-center gap-0.5 text-white">
          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold drop-shadow">{reel.comment_count}</span>
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute left-3 right-16 bottom-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          {reel.profile?.avatar_url ? (
            <img src={reel.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/40" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
              {getInitials(reel.profile?.display_name)}
            </div>
          )}
          <span className="text-sm font-semibold flex items-center gap-1 drop-shadow">
            {reel.profile?.display_name || "User"}
            <VerifiedBadge verified={reel.profile?.verified} />
          </span>
        </div>
        {reel.content && <p className="text-xs leading-snug line-clamp-2 drop-shadow">{reel.content}</p>}
      </div>
    </div>
  );
};

const CampusReels = ({ refreshKey }: { refreshKey?: number }) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [userId, setUserId] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    // Pull recent video attachments + their parent posts (excluding statuses)
    const { data: atts } = await supabase
      .from("post_attachments")
      .select("post_id, file_url, file_type")
      .like("file_type", "video/%")
      .order("created_at", { ascending: false })
      .limit(60);

    if (!atts || atts.length === 0) { setReels([]); setLoading(false); return; }

    const postIds = [...new Set(atts.map(a => a.post_id))];
    const [{ data: posts }, { data: likes }, { data: comments }, { data: userLikes }] = await Promise.all([
      supabase.from("posts").select("id, user_id, content, created_at, tag").in("id", postIds).neq("tag", "status"),
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
      supabase.from("post_likes").select("post_id").in("post_id", postIds).eq("user_id", user.id),
    ]);

    const validPosts = posts || [];
    const userIds = [...new Set(validPosts.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, display_name, avatar_url, verified").in("user_id", userIds);
    const profMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const postMap = new Map(validPosts.map(p => [p.id, p]));
    const likeCount = new Map<string, number>();
    likes?.forEach(l => likeCount.set(l.post_id, (likeCount.get(l.post_id) || 0) + 1));
    const commentCount = new Map<string, number>();
    comments?.forEach(c => commentCount.set(c.post_id, (commentCount.get(c.post_id) || 0) + 1));
    const likedSet = new Set(userLikes?.map(l => l.post_id) || []);

    const merged: Reel[] = [];
    const seenPosts = new Set<string>();
    for (const a of atts) {
      const p = postMap.get(a.post_id);
      if (!p || seenPosts.has(p.id)) continue;
      seenPosts.add(p.id);
      merged.push({
        post_id: p.id,
        user_id: p.user_id,
        content: p.content,
        created_at: p.created_at,
        file_url: a.file_url,
        file_type: a.file_type,
        profile: profMap.get(p.user_id),
        like_count: likeCount.get(p.id) || 0,
        comment_count: commentCount.get(p.id) || 0,
        user_liked: likedSet.has(p.id),
      });
    }
    setReels(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  // Track which reel is in view via IntersectionObserver
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLDivElement>("[data-reel-idx]");
    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        const idx = Number((visible.target as HTMLElement).dataset.reelIdx);
        if (!Number.isNaN(idx)) setActiveIdx(idx);
      }
    }, { root, threshold: [0.5, 0.75] });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [reels.length]);

  const handleLikeChange = (postId: string, liked: boolean) => {
    setReels(rs => rs.map(r => r.post_id === postId
      ? { ...r, user_liked: liked, like_count: r.like_count + (liked ? 1 : -1) }
      : r));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="content-card text-center py-10">
        <p className="text-sm text-muted-foreground">No campus reels yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Post a video to start the reel.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden bg-black snap-y snap-mandatory overflow-y-scroll scrollbar-none"
      style={{ height: "calc(100vh - 200px)", maxHeight: "720px" }}
    >
      {reels.map((r, i) => (
        <div key={r.post_id} data-reel-idx={i} className="h-full w-full">
          <ReelItem
            reel={r}
            active={i === activeIdx}
            muted={muted}
            onToggleMute={() => setMuted(m => !m)}
            userId={userId}
            onLikeChange={handleLikeChange}
          />
        </div>
      ))}
    </div>
  );
};

export default CampusReels;
