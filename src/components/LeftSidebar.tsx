import { useState, useEffect } from "react";
import { LayoutDashboard, BookOpen, Calendar, GraduationCap, Building2, Users, Bell, Settings, HelpCircle, Newspaper, Shield, MessageCircle, BarChart3, FileType2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  icon: React.ElementType;
  label: string;
  key: string;
}

// Keys considered "student-only" — auto-hidden for non-student account types
const STUDENT_ONLY_KEYS = new Set(["past-questions", "handouts", "timetable", "results"]);

const mainNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Feed", key: "feed" },
  { icon: BookOpen, label: "Past Questions", key: "past-questions" },
];

const academicsNav: NavItem[] = [
  { icon: GraduationCap, label: "My Courses", key: "courses" },
  { icon: Building2, label: "Departments", key: "departments" },
  { icon: FileType2, label: "Handouts", key: "handouts" },
  { icon: Calendar, label: "Timetable", key: "timetable" },
  { icon: BarChart3, label: "Results", key: "results" },
];

const communityNav: NavItem[] = [
  { icon: MessageCircle, label: "Course Chats", key: "course-chats" },
  { icon: Users, label: "Study Groups", key: "study-groups" },
  { icon: Calendar, label: "Events", key: "events" },
  { icon: Newspaper, label: "Campus News", key: "campus-news" },
  { icon: Bell, label: "Notifications", key: "notifications" },
];

const supportNav: NavItem[] = [
  { icon: HelpCircle, label: "Help Centre", key: "help" },
  { icon: Settings, label: "Settings", key: "settings" },
];

interface LeftSidebarProps {
  activePanel: string;
  onNavigate: (key: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SidebarSection = ({ label, items, activePanel, onNavigate, notifCount }: {
  label: string; items: NavItem[]; activePanel: string; onNavigate: (key: string) => void; notifCount?: number;
}) => {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">{label}</div>
      {items.map((item) => (
        <button key={item.key} onClick={() => onNavigate(item.key)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors border-none text-left cursor-pointer ${
            activePanel === item.key
              ? "bg-primary/10 text-primary font-semibold"
              : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}>
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{item.label}</span>
          {item.key === "notifications" && notifCount && notifCount > 0 ? (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground">{notifCount}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
};

const LeftSidebar = ({ activePanel, onNavigate, isOpen, onClose }: LeftSidebarProps) => {
  const [profile, setProfile] = useState<{
    display_name: string | null; department: string | null; avatar_url: string | null;
    account_type?: string | null; title?: string | null;
    feature_overrides?: Record<string, boolean> | null;
  } | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles")
        .select("display_name, department, avatar_url, account_type, title, feature_overrides")
        .eq("user_id", user.id).single();
      setProfile(data as any);
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
      setNotifCount(count || 0);
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      setIsAdmin(roles?.some((r: any) => r.role === "admin") || false);
    };
    load();
  }, []);

  const initials = profile?.display_name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
  const accountType = profile?.account_type || "student";
  const overrides = (profile?.feature_overrides || {}) as Record<string, boolean>;

  // Visibility rule:
  // - explicit override (true/false) wins
  // - else, student-only keys hidden for non-student accounts
  const isVisible = (key: string) => {
    if (key in overrides) return overrides[key] !== false;
    if (STUDENT_ONLY_KEYS.has(key) && accountType !== "student") return false;
    return true;
  };

  const filterItems = (items: NavItem[]) => items.filter(i => isVisible(i.key));
  const subtitle = profile?.title?.trim()
    || (accountType !== "student" ? (accountType === "lecturer" ? "Lecturer" : accountType === "alumni" ? "Alumnus" : "Member") : null)
    || profile?.department
    || "SSU";

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-14 left-0 bottom-0 w-[240px] bg-card border-r border-border z-50 overflow-y-auto transition-transform duration-200 lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:translate-x-0 lg:z-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-3">
          {/* Profile card */}
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{profile?.display_name || "Student"}</div>
                <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>
              </div>
            </div>
          </div>

          <SidebarSection label="Main" items={filterItems(mainNav)} activePanel={activePanel} onNavigate={onNavigate} />
          <SidebarSection label="Academics" items={filterItems(academicsNav)} activePanel={activePanel} onNavigate={onNavigate} />
          <SidebarSection label="Community" items={filterItems(communityNav)} activePanel={activePanel} onNavigate={onNavigate} notifCount={notifCount} />
          <SidebarSection label="Support" items={filterItems(supportNav)} activePanel={activePanel} onNavigate={onNavigate} />
          {isAdmin && (
            <SidebarSection label="Admin" items={[{ icon: Shield, label: "Admin Dashboard", key: "admin" }]} activePanel={activePanel} onNavigate={onNavigate} />
          )}
        </div>
      </aside>
    </>
  );
};

export default LeftSidebar;
