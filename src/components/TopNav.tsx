import { useState, useEffect } from "react";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/acadlink-logo.png";

interface TopNavProps {
  userInitials: string;
  onMenuToggle?: () => void;
}

const TopNav = ({ userInitials, onMenuToggle }: TopNavProps) => {
  const [notifCount, setNotifCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [siteName, setSiteName] = useState("AcadLink");
  const [tagline, setTagline] = useState("Sokoto State University");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
      setNotifCount(count || 0);
    };
    load();

    const loadSettings = async () => {
      const { data } = await supabase.from("system_settings" as any).select("site_name, tagline").eq("id", true).maybeSingle();
      if (data) {
        const s = data as any;
        if (s.site_name) setSiteName(s.site_name);
        if (s.tagline) setTagline(s.tagline);
      }
    };
    loadSettings();

    const channel = supabase
      .channel("system_settings_topnav")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, () => loadSettings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border h-14 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt={siteName} className="w-9 h-9 object-contain rounded-lg" />
          <div className="leading-tight hidden sm:block">
            <div className="text-base font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{siteName}</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5 hidden md:block">{tagline}</div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses, handouts, students..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors md:hidden">
          <Search className="w-4 h-4" />
        </button>

        <button onClick={() => window.dispatchEvent(new CustomEvent("acadlink:navigate", { detail: "notifications" }))} className="relative p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors bg-transparent border-none cursor-pointer">
          <Bell className="w-4 h-4" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        <button onClick={handleLogout} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors" title="Log out">
          <LogOut className="w-4 h-4" />
        </button>

        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold ml-1">
          {userInitials}
        </div>
      </div>

      {showSearch && (
        <div className="absolute top-14 left-0 right-0 bg-card border-b border-border p-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search..." className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNav;
