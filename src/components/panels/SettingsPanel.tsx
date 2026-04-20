import { useState, useEffect, useRef } from "react";
import { Settings, User, Bell, Shield, LogOut, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SettingsPanel = () => {
  const [profile, setProfile] = useState({ name: "", email: "", bio: "", avatar_url: "" });
  const [notifSettings, setNotifSettings] = useState({ email: true, push: true, handouts: true, grades: true, events: false, groups: true });
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("display_name, bio, avatar_url").eq("user_id", user.id).single();
      setProfile({ name: p?.display_name || "", email: user.email || "", bio: p?.bio || "", avatar_url: p?.avatar_url || "" });
    };
    load();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5MB)"); return; }
    setUploadingAvatar(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
    setProfile(p => ({ ...p, avatar_url: avatarUrl }));
    setUploadingAvatar(false);
    toast.success("Avatar updated!");
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ display_name: profile.name, bio: profile.bio }).eq("user_id", user.id);
      toast.success("Profile updated!");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
  };

  const initials = profile.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <div>
      <div className="mb-5">
        <h2 className="page-header">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      <section className="mb-6">
        <h3 className="section-label mb-3">Profile</h3>
        <div className="content-card space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              <Avatar className="w-16 h-16">
                {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="Avatar" /> : null}
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-foreground/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-background" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-foreground/50 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium">Profile Picture</div>
              <div className="text-[11px] text-muted-foreground">Click to upload (max 5MB)</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <Label className="text-xs font-medium">Display Name</Label>
            <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="h-9 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium">Email</Label>
            <Input value={profile.email} disabled className="h-9 text-sm mt-1 opacity-60" />
          </div>
          <div>
            <Label className="text-xs font-medium">Bio</Label>
            <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="section-label mb-3">Notifications</h3>
        <div className="content-card space-y-3">
          {([
            { key: "email" as const, label: "Email Notifications", desc: "Receive updates via email" },
            { key: "handouts" as const, label: "New Handouts", desc: "When lecturers upload materials" },
            { key: "grades" as const, label: "Grade Updates", desc: "When results are published" },
            { key: "groups" as const, label: "Study Group Activity", desc: "Messages in your groups" },
          ]).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">{item.desc}</div>
              </div>
              <Switch checked={notifSettings[item.key]} onCheckedChange={(v) => setNotifSettings({ ...notifSettings, [item.key]: v })} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="section-label mb-3">Security</h3>
        <div className="content-card">
          <Button variant="outline" size="sm" className="w-full text-xs">Change Password</Button>
        </div>
      </section>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1 text-xs">{saving ? "Saving..." : "Save Changes"}</Button>
        <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout} disabled={loggingOut}>
          <LogOut className="w-3.5 h-3.5" /> {loggingOut ? "..." : "Log Out"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
