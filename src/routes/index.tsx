import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AuthScreen from "@/components/AuthScreen";
import TopNav from "@/components/TopNav";
import PostComposer from "@/components/PostComposer";
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    </div>
  );
}
