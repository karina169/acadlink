import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Paperclip, Image, FileText, Mic, MicOff, Users, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface CourseGroup {
  id: string;
  code: string;
  title: string;
  department_name: string;
  level: string;
  member_count: number;
  last_message?: string;
  last_message_at?: string;
}

interface ChatMessage {
  id: string;
  course_id: string;
  user_id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  reply_to: string | null;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

const CourseChatsPanel = () => {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [activeCourse, setActiveCourse] = useState<CourseGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [members, setMembers] = useState<{ user_id: string; display_name: string | null }[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [canCreateGroup, setCanCreateGroup] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; faculty_id: string }[]>([]);
  const [newGroup, setNewGroup] = useState({ code: "", title: "", faculty_id: "", department_id: "", level: "100", semester: "1st", units: 3 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load course groups the user belongs to
  useEffect(() => {
    const loadGroups = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Check if user is admin/group_admin (can create chat groups)
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const isAdmin = roles?.some(r => r.role === "admin" || r.role === "group_admin") || false;
      setCanCreateGroup(isAdmin);

      const { data: memberships } = await supabase
        .from("course_members")
        .select("course_id")
        .eq("user_id", user.id);

      if (!memberships?.length) {
        // Auto-join: get profile dept+level, find matching courses
        const { data: profile } = await supabase
          .from("profiles")
          .select("department, level")
          .eq("user_id", user.id)
          .single();

        if (profile?.department && profile?.level) {
          const { data: depts } = await supabase
            .from("departments")
            .select("id")
            .eq("name", profile.department);

          if (depts?.length) {
            const { data: courses } = await supabase
              .from("courses")
              .select("id")
              .eq("department_id", depts[0].id)
              .eq("level", profile.level);

            if (courses?.length) {
              for (const c of courses) {
                await supabase.from("course_members").upsert(
                  { course_id: c.id, user_id: user.id },
                  { onConflict: "course_id,user_id" }
                );
              }
            }
          }
        }
      }

      // Re-fetch memberships
      const { data: myMemberships } = await supabase
        .from("course_members")
        .select("course_id")
        .eq("user_id", user.id);

      if (!myMemberships?.length) {
        setLoading(false);
        return;
      }

      const courseIds = myMemberships.map(m => m.course_id);

      const { data: courses } = await supabase
        .from("courses")
        .select("id, code, title, level, department_id")
        .in("id", courseIds);

      if (!courses) {
        setLoading(false);
        return;
      }

      const deptIds = [...new Set(courses.map(c => c.department_id))];
      const { data: depts } = await supabase
        .from("departments")
        .select("id, name")
        .in("id", deptIds);

      const deptMap = Object.fromEntries((depts || []).map(d => [d.id, d.name]));

      // Get member counts
      const { data: allMembers } = await supabase
        .from("course_members")
        .select("course_id")
        .in("course_id", courseIds);

      const countMap: Record<string, number> = {};
      (allMembers || []).forEach(m => {
        countMap[m.course_id] = (countMap[m.course_id] || 0) + 1;
      });

      const groupList: CourseGroup[] = courses.map(c => ({
        id: c.id,
        code: c.code,
        title: c.title,
        department_name: deptMap[c.department_id] || "Unknown",
        level: c.level,
        member_count: countMap[c.id] || 0,
      }));

      setGroups(groupList);
      setLoading(false);
    };

    loadGroups();
  }, []);

  // Load messages when a course is selected
  useEffect(() => {
    if (!activeCourse) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("course_id", activeCourse.id)
        .order("created_at", { ascending: true })
        .limit(200);

      if (data?.length) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = Object.fromEntries(
          (profiles || []).map(p => [p.user_id, p])
        );

        setMessages(
          data.map(m => ({ ...m, profile: profileMap[m.user_id] || null }))
        );
      } else {
        setMessages([]);
      }
      setTimeout(scrollToBottom, 100);
    };

    loadMessages();

    // Load members
    const loadMembers = async () => {
      const { data: mems } = await supabase
        .from("course_members")
        .select("user_id")
        .eq("course_id", activeCourse.id);

      if (mems?.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", mems.map(m => m.user_id));
        setMembers(profiles || []);
      }
    };
    loadMembers();

    // Real-time subscription
    const channel = supabase
      .channel(`chat-${activeCourse.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `course_id=eq.${activeCourse.id}`,
        },
        async (payload) => {
          const msg = payload.new as ChatMessage;
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .eq("user_id", msg.user_id)
            .single();
          msg.profile = profile || undefined;
          setMessages(prev => [...prev, msg]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCourse, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeCourse || sending) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      course_id: activeCourse.id,
      user_id: currentUserId,
      content: newMessage.trim(),
      message_type: "text",
      reply_to: replyTo?.id || null,
    });
    if (error) {
      toast.error(error.message);
    }
    setNewMessage("");
    setReplyTo(null);
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCourse) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${activeCourse.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(path, file);

    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    let msgType = "document";
    if (file.type.startsWith("image/")) msgType = "image";
    else if (file.type.startsWith("video/")) msgType = "video";
    else if (file.type.startsWith("audio/")) msgType = "audio";

    await supabase.from("chat_messages").insert({
      course_id: activeCourse.id,
      user_id: currentUserId,
      content: file.name,
      message_type: msgType,
      file_url: urlData.publicUrl,
      file_name: file.name,
    });

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());

        if (!activeCourse) return;
        const path = `${activeCourse.id}/voice_${Date.now()}.webm`;
        await supabase.storage.from("chat-files").upload(path, blob);
        const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

        await supabase.from("chat_messages").insert({
          course_id: activeCourse.id,
          user_id: currentUserId,
          content: "Voice note",
          message_type: "audio",
          file_url: urlData.publicUrl,
          file_name: "voice_note.webm",
        });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // GROUP LIST VIEW
  if (!activeCourse) {
    return (
      <div>
        <h2 className="font-syne text-lg font-bold mb-4">💬 Course Group Chats</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <p>No course groups yet.</p>
            <p className="mt-1 text-xs">Groups are created by admins. You'll be auto-joined based on your department & level.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setActiveCourse(g)}
                className="w-full bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-primary/50 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {g.code.split(" ")[0]?.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{g.code} — {g.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{g.department_name} · {g.level} Level</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    <Users className="w-3 h-3 mr-1" />{g.member_count}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // CHAT VIEW
  const getInitials = (name: string | null) =>
    (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const renderMessageContent = (msg: ChatMessage) => {
    switch (msg.message_type) {
      case "image":
        return (
          <div>
            {msg.content && <p className="text-[13px] mb-1">{msg.content}</p>}
            <img src={msg.file_url!} alt="" className="max-w-[240px] rounded-lg cursor-pointer" onClick={() => window.open(msg.file_url!, "_blank")} />
          </div>
        );
      case "video":
        return (
          <video src={msg.file_url!} controls className="max-w-[260px] rounded-lg" />
        );
      case "audio":
        return (
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            <audio src={msg.file_url!} controls className="h-8" />
          </div>
        );
      case "document":
        return (
          <a href={msg.file_url!} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 hover:bg-background/80 transition">
            <FileText className="w-5 h-5 text-primary" />
            <div className="min-w-0">
              <div className="text-[12px] font-medium truncate">{msg.file_name || "Document"}</div>
              <div className="text-[10px] text-muted-foreground">Tap to download</div>
            </div>
          </a>
        );
      default:
        return <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-card border-b border-border rounded-t-xl">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setActiveCourse(null)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{activeCourse.code}</div>
          <div className="text-[11px] text-muted-foreground">{activeCourse.title} · {members.length} members</div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowMembers(!showMembers)}>
          <Users className="w-4 h-4" />
        </Button>
      </div>

      {/* Members panel */}
      {showMembers && (
        <div className="bg-card border-b border-border px-4 py-3 max-h-[200px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">Members ({members.length})</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowMembers(false)}><X className="w-3 h-3" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <span key={m.user_id} className="text-[11px] bg-muted px-2 py-1 rounded-full">{m.display_name || "Student"}</span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-xs">
            No messages yet. Start the conversation! 🎓
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.user_id === currentUserId;
          const showAvatar = !isMe && (i === 0 || messages[i - 1]?.user_id !== msg.user_id);
          const repliedMsg = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;

          return (
            <div key={msg.id} className={`flex mb-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <div className="w-7 mr-1.5 flex-shrink-0">
                  {showAvatar ? (
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                        {getInitials(msg.profile?.display_name || null)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              )}
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {showAvatar && !isMe && (
                  <span className="text-[10px] font-semibold text-primary ml-1 mb-0.5">
                    {msg.profile?.display_name || "Student"}
                  </span>
                )}
                {repliedMsg && (
                  <div className="text-[10px] bg-muted/50 border-l-2 border-primary px-2 py-1 rounded mb-0.5 truncate max-w-full">
                    {repliedMsg.content?.slice(0, 60)}
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl cursor-pointer ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  }`}
                  onClick={() => setReplyTo(msg)}
                >
                  {renderMessageContent(msg)}
                  <div className={`text-[9px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "h:mm a")}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-t border-border">
          <div className="flex-1 text-[11px] truncate">
            <span className="font-semibold text-primary">Replying to {replyTo.profile?.display_name || "message"}</span>
            <span className="text-muted-foreground ml-1">{replyTo.content?.slice(0, 50)}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyTo(null)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-card border-t border-border rounded-b-xl">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Paperclip className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`shrink-0 ${isRecording ? "text-destructive animate-pulse" : ""}`}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 h-9 text-[13px] bg-muted/50 border-none"
          disabled={uploading}
        />
        <Button size="icon" className="shrink-0 h-9 w-9" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CourseChatsPanel;
