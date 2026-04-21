import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AuthScreen from "@/components/AuthScreen";
import TopNav from "@/components/TopNav";
import PostComposer from "@/components/PostComposer";
import PostComposerTrigger from "@/components/PostComposerTrigger";
import PostScreen from "@/components/PostScreen";
import FeedList from "@/components/FeedList";
import ProfilePanel from "@/components/ProfilePanel";
import LeftSidebar from "@/components/LeftSidebar";
import PastQuestionsPanel from "@/components/panels/PastQuestionsPanel";
import CoursesPanel from "@/components/panels/CoursesPanel";
import DepartmentsPanel from "@/components/panels/DepartmentsPanel";
import StudyGroupsPanel from "@/components/panels/StudyGroupsPanel";
import EventsPanel from "@/components/panels/EventsPanel";
import NotificationsPanel from "@/components/panels/NotificationsPanel";
import ResultsPanel from "@/components/panels/ResultsPanel";
import HelpPanel from "@/components/panels/HelpPanel";
import SettingsPanel from "@/components/panels/SettingsPanel";
import CampusNewsPanel from "@/components/panels/CampusNewsPanel";
import AdminDashboard from "@/components/panels/AdminDashboard";
import CourseChatsPanel from "@/components/panels/CourseChatsPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AcadLink SSU — Sokoto State University Student Platform" },
      { name: "description", content: "Past Questions, Courses, Departments, Course Chats, Student Feed — all in one place for SSU students." },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [mounted]);

  useEffect(() => {
    if (!session?.user) return;
    supabase.from("profiles").select("display_name").eq("user_id", session.user.id).single()
      .then(({ data }) => {
        const name = data?.display_name || session.user.email || "U";
        const parts = name.trim().split(/\s+/);
        const initials = (parts[0]?.[0] || "U") + (parts[1]?.[0] || "");
        setUserInitials(initials.toUpperCase());
      });
  }, [session]);

  // Mobile swipe gesture: swipe left from the right edge to open chat drawer (only on feed)
  useEffect(() => {
    if (!session || activePanel !== "feed") return;
    let startX = 0; let startY = 0; let tracking = false;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      // Only trigger if swipe starts within 30px of the right edge
      if (t.clientX > window.innerWidth - 30) {
        startX = t.clientX; startY = t.clientY; tracking = true;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      const dx = startX - t.clientX;
      const dy = Math.abs(startY - t.clientY);
      if (dx > 60 && dy < 40) {
        setChatDrawerOpen(true);
        tracking = false;
      }
    };
    const onEnd = () => { tracking = false; };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [session, activePanel]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onLogin={() => {}} />;
  }

  const handleNavigate = (key: string) => {
    setActivePanel(key);
    setSidebarOpen(false);
  };

  const renderPanel = () => {
    switch (activePanel) {
      case "feed":
        return (
          <>
            <PostComposer userInitials={userInitials} onPostCreated={() => setFeedKey(k => k + 1)} />
            <div className="mt-4">
              <FeedList refreshKey={feedKey} />
            </div>
          </>
        );
      case "past-questions": return <PastQuestionsPanel />;
      case "courses": return <CoursesPanel />;
      case "departments": return <DepartmentsPanel />;
      case "results": return <ResultsPanel />;
      case "study-groups": return <StudyGroupsPanel />;
      case "events": return <EventsPanel />;
      case "course-chats": return <CourseChatsPanel />;
      case "campus-news": return <CampusNewsPanel />;
      case "notifications": return <NotificationsPanel />;
      case "help": return <HelpPanel />;
      case "admin": return <AdminDashboard />;
      case "settings": return <SettingsPanel />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <TopNav userInitials={userInitials} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <LeftSidebar activePanel={activePanel} onNavigate={handleNavigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 min-w-0 w-full px-2 sm:px-4 py-6 flex gap-6">
          <div className="flex-1 min-w-0">{renderPanel()}</div>
          {activePanel === "feed" && (
            <div className="hidden xl:block w-[280px] shrink-0">
              <div className="sticky top-[80px]"><ProfilePanel /></div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile swipe-in chat drawer (feed only) */}
      {activePanel === "feed" && (
        <>
          {chatDrawerOpen && (
            <div className="fixed inset-0 bg-foreground/40 z-[60] lg:hidden" onClick={() => setChatDrawerOpen(false)} />
          )}
          <aside className={`lg:hidden fixed top-0 right-0 bottom-0 w-[92%] max-w-[420px] bg-background z-[70] shadow-2xl transition-transform duration-300 overflow-y-auto ${chatDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="sticky top-0 bg-card border-b border-border px-3 py-2.5 flex items-center justify-between z-10">
              <span className="text-sm font-semibold">Course Chats</span>
              <button onClick={() => setChatDrawerOpen(false)} className="text-xs text-muted-foreground bg-transparent border-none cursor-pointer px-2">Close</button>
            </div>
            <div className="p-3"><CourseChatsPanel /></div>
          </aside>
          {/* Tiny visual hint at right edge */}
          {!chatDrawerOpen && (
            <button onClick={() => setChatDrawerOpen(true)}
              className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-3 rounded-l-md shadow-lg border-none cursor-pointer writing-mode-vertical">
              💬
            </button>
          )}
        </>
      )}
    </div>
  );
}
