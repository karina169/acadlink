import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, ChevronDown, ChevronUp, Send, Trash2, Bookmark, BookmarkCheck, FileText, Download } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import CampusReels from "./CampusReels";

interface PostData {
  id: string;
  user_id: string;
  content: string;
  tag: string;
  created_at: string;
  profile?: { display_name: string | null; department: string | null; level: string | null; avatar_url: string | null; verified: boolean | null } | null;
  attachments: { id: string; file_url: string; file_name: string; file_size: string | null; file_type: string | null }[];
  like_count: number;
  comment_count: number;
  user_liked: boolean;
}

const tagStyles: Record<string, { bg: string; label: string }> = {
  announcement: { bg: "bg-amber-50 text-amber-700 border border-amber-200", label: "NOTICE" },
  question: { bg: "bg-blue-50 text-blue-700 border border-blue-200", label: "QUESTION" },
  resource: { bg: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "RESOURCE" },
  discussion: { bg: "bg-purple-50 text-purple-700 border border-purple-200", label: "DISCUSSION" },
};

const timeAgo = (date: string) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
};

interface CommentData {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { display_name: string | null; verified: boolean | null } | null;
}

const CommentsSection = ({ postId, userId }: { postId: string; userId: string }) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const { data } = await supabase.from("comments").select("id, user_id, content, created_at").eq("post_id", postId).order("created_at", { ascending: true });
    if (data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, verified").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setComments(data.map(c => ({ ...c, profile: profileMap.get(c.user_id) })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: userId, content: newComment.trim() });
    if (error) toast.error(error.message);
    else { setNewComment(""); fetchComments(); }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("comments").delete().eq("id", id);
    fetchComments();
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      {loading ? (
        <div className="text-xs text-muted-foreground py-2">Loading comments...</div>
      ) : (
        <div className="space-y-2.5 mb-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground flex-shrink-0">
                {getInitials(c.profile?.display_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold flex items-center gap-0.5">{c.profile?.display_name || "User"}<VerifiedBadge verified={c.profile?.verified} className="w-3 h-3" /></span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
              </div>
              {c.user_id === userId && (
                <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer"><Trash2 className="w-3 h-3" /></button>
              )}
            </div>
          ))}
          {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>}
        </div>
      )}
      <div className="flex gap-2">
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()} placeholder="Write a comment..."
          className="flex-1 h-8 px-3 rounded-md border border-input bg-transparent text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <button onClick={handleSubmit} disabled={submitting || !newComment.trim()} className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 border-none cursor-pointer">
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const FeedPost = ({ post, userId }: { post: PostData; userId: string }) => {
  const [liked, setLiked] = useState(post.user_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const tag = tagStyles[post.tag] || tagStyles.discussion;

  const handleLike = async () => {
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  return (
    <div className="content-card mb-3">
      <div className="flex gap-2.5 items-center mb-3">
        {post.profile?.avatar_url ? (
          <img src={post.profile.avatar_url} alt={post.profile.display_name || "User"} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {getInitials(post.profile?.display_name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm flex items-center gap-1">
            <span className="truncate">{post.profile?.display_name || "User"}</span>
            <VerifiedBadge verified={post.profile?.verified} />
          </div>
          <div className="text-[11px] text-muted-foreground">
            {post.profile?.department || ""}{post.profile?.level ? ` · ${post.profile.level} Level` : ""} · {timeAgo(post.created_at)}
          </div>
        </div>
      </div>

      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${tag.bg}`}>
        {tag.label}
      </span>

      <p className="text-sm leading-relaxed text-foreground/80 mb-3 whitespace-pre-wrap">{post.content}</p>

      {post.attachments.length > 0 && post.attachments.map(att => {
        const isImage = att.file_type?.startsWith("image/");
        const isVideo = att.file_type?.startsWith("video/");

        if (isImage) {
          return (
            <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="block mb-3 rounded-lg overflow-hidden border border-border">
              <img src={att.file_url} alt={att.file_name} className="w-full max-h-[400px] object-cover" loading="lazy" />
            </a>
          );
        }

        if (isVideo) {
          return (
            <div key={att.id} className="mb-3 rounded-lg overflow-hidden border border-border">
              <video src={att.file_url} controls className="w-full max-h-[400px]" preload="metadata" />
            </div>
          );
        }

        return (
          <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer"
            className="bg-muted rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-muted/80 mb-3 no-underline text-foreground border border-border">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{att.file_name}</div>
              <div className="text-[11px] text-muted-foreground">{att.file_size || "Document"}</div>
            </div>
            <Download className="w-4 h-4 text-primary flex-shrink-0" />
          </a>
        );
      })}

      <div className="flex gap-1 items-center">
        <button onClick={handleLike}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-transparent border-none cursor-pointer ${liked ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
          👍 {likeCount}
        </button>

        <button onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors bg-transparent border-none cursor-pointer">
          <MessageCircle className="w-3.5 h-3.5" /> {post.comment_count}
        </button>

        <button onClick={() => setBookmarked(!bookmarked)} className={`ml-auto inline-flex items-center px-2 py-1.5 rounded-md text-xs transition-colors bg-transparent border-none cursor-pointer ${bookmarked ? "text-primary" : "text-muted-foreground hover:bg-muted"}`}>
          {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} userId={userId} />}
    </div>
  );
};

const filterTabs = [
  { key: "all", label: "All" },
  { key: "live", label: "Live Event" },
  { key: "creels", label: "Campus Reels" },
];

const FeedList = ({ refreshKey }: { refreshKey?: number }) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    let query = supabase.from("posts").select("id, user_id, content, tag, created_at").neq("tag", "status").order("created_at", { ascending: false }).limit(50);
    if (filter === "live") query = query.eq("tag", "live");
    else if (filter === "creels") query = query.eq("tag", "creels");

    const { data: postsData } = await query;
    if (!postsData) { setLoading(false); return; }

    const postIds = postsData.map(p => p.id);
    const userIds = [...new Set(postsData.map(p => p.user_id))];

    const [profilesRes, attachmentsRes, likesRes, commentsRes, userLikesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, department, level, avatar_url, verified").in("user_id", userIds),
      supabase.from("post_attachments").select("id, post_id, file_url, file_name, file_size, file_type").in("post_id", postIds),
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
      supabase.from("post_likes").select("post_id").in("post_id", postIds).eq("user_id", user.id),
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
    const attachMap = new Map<string, any[]>();
    attachmentsRes.data?.forEach(a => {
      if (!attachMap.has(a.post_id)) attachMap.set(a.post_id, []);
      attachMap.get(a.post_id)!.push(a);
    });
    const likeCountMap = new Map<string, number>();
    likesRes.data?.forEach(l => likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1));
    const commentCountMap = new Map<string, number>();
    commentsRes.data?.forEach(c => commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1));
    const userLikedSet = new Set(userLikesRes.data?.map(l => l.post_id) || []);

    setPosts(postsData.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id),
      attachments: attachMap.get(p.id) || [],
      like_count: likeCountMap.get(p.id) || 0,
      comment_count: commentCountMap.get(p.id) || 0,
      user_liked: userLikedSet.has(p.id),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [refreshKey, filter]);

  useEffect(() => {
    const channel = supabase.channel("feed-realtime").on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`filter-pill text-xs whitespace-nowrap ${filter === t.key ? "filter-pill-active" : ""}`}>
            {t.label}
          </button>
        ))}
      </div>

      {filter === "creels" ? (
        <CampusReels refreshKey={refreshKey} />
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map(post => <FeedPost key={post.id} post={post} userId={userId} />)
      )}
    </div>
  );
};

export default FeedList;
