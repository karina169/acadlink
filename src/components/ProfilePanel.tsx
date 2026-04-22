import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "./VerifiedBadge";

const ProfilePanel = () => {
  const [profile, setProfile] = useState<{
    display_name: string | null;
    department: string | null;
    level: string | null;
    matric_number: string | null;
    bio: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  } | null>(null);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("display_name, department, level, matric_number, bio, avatar_url, verified").eq("user_id", user.id).single();
      setProfile(data);
      const { count } = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      setPostCount(count || 0);
    };
    load();
  }, []);

  const initials = profile?.display_name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <div className="space-y-3">
      <div className="content-card !p-0 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-primary/10 to-primary/5" />
        <div className="px-4 pb-4">
          <div className="w-14 h-14 rounded-full border-4 border-card -mt-7 mb-2 bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <h2 className="text-base font-semibold flex items-center gap-1">{profile?.display_name || "Student"}<VerifiedBadge verified={profile?.verified} className="w-4 h-4" /></h2>
          {profile?.matric_number && <p className="text-xs text-muted-foreground">{profile.matric_number}</p>}
          <div className="flex gap-1.5 flex-wrap mt-2">
            {profile?.department && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{profile.department}</span>
            )}
            {profile?.level && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{profile.level} Level</span>
            )}
          </div>
          {profile?.bio && <p className="text-xs text-muted-foreground mt-2">{profile.bio}</p>}

          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{postCount}</span> posts
            </div>
          </div>
        </div>
      </div>

      <div className="content-card">
        <h3 className="section-label mb-2.5">Quick Access</h3>
        <div className="space-y-1">
          {[
            { label: "My Handouts", icon: "📄" },
            { label: "Past Questions", icon: "📋" },
            { label: "Timetable", icon: "📅" },
            { label: "My Courses", icon: "🎓" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors py-1.5 px-2 rounded-md hover:bg-muted">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;
