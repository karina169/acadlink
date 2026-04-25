import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/acadlink-logo.png";
import { BadgeCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/join/$token")({
  head: () => ({
    meta: [
      { title: "Professional Sign Up — AcadLink" },
      { name: "description", content: "Join AcadLink as a lecturer or alumnus via invite." },
    ],
  }),
  component: JoinPage,
});

interface Invite {
  id: string;
  token: string;
  account_type: string;
  label: string | null;
  single_use: boolean;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  active: boolean;
}

interface Department { id: string; name: string; }

function JoinPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [checking, setChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [fullName, setFullName] = useState("");
  const [titleField, setTitleField] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("signup_invites" as any)
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) {
        setErrorMsg("This invite link is invalid or has been revoked.");
        setChecking(false);
        return;
      }
      const inv = data as unknown as Invite;
      if (!inv.active) { setErrorMsg("This invite has already been used or revoked."); setChecking(false); return; }
      if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
        setErrorMsg("This invite has expired."); setChecking(false); return;
      }
      if (inv.max_uses && inv.uses >= inv.max_uses) {
        setErrorMsg("This invite has reached its maximum number of uses."); setChecking(false); return;
      }
      setInvite(inv);
      setChecking(false);
    };
    load();
    supabase.from("departments").select("id, name").order("name").then(({ data }) => setDepartments(data || []));
  }, [token]);

  const accountTypeLabel = (t: string) => t === "lecturer" ? "Lecturer" : t === "alumni" ? "Alumnus / Alumna" : t === "staff" ? "Staff" : "Professional";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);
    try {
      const deptName = departments.find(d => d.id === departmentId)?.name || null;
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: fullName,
            account_type: invite.account_type,
            title: titleField || null,
            department: deptName,
            bio: bio || null,
            invite_token: invite.token,
          },
        },
      });
      if (error) throw error;
      toast.success("Account created! Check your email to verify, then sign in.");
      setTimeout(() => navigate({ to: "/" }), 1500);
    } catch (err: any) {
      toast.error(err.message || "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3 text-2xl">!</div>
          <h1 className="text-lg font-semibold mb-2">Invite unavailable</h1>
          <p className="text-sm text-muted-foreground mb-4">{errorMsg}</p>
          <Link to="/" className="text-sm text-primary font-medium hover:underline">Back to AcadLink</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 px-4 py-8">
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-[460px] shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="AcadLink" className="w-16 h-16 object-contain mb-2" />
          <div className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">AcadLink</div>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            <BadgeCheck className="w-3.5 h-3.5" />
            {accountTypeLabel(invite.account_type)} Invite
          </div>
          {invite.label && <p className="text-xs text-muted-foreground mt-2">{invite.label}</p>}
        </div>

        <h1 className="text-xl font-semibold mb-1">Create your professional account</h1>
        <p className="text-sm text-muted-foreground mb-5">No academic level or matric number required.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Dr. Aisha Bello"
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Title / Role <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input value={titleField} onChange={e => setTitleField(e.target.value)} placeholder="e.g. Senior Lecturer, Dr., Alumnus"
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Department <span className="text-muted-foreground font-normal">(optional)</span></label>
            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50">
              <option value="">— None —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Short bio <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={160} rows={2} placeholder="One line about you"
              className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full h-9 px-3 pr-16 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs bg-transparent border-none cursor-pointer hover:text-foreground">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary/90 disabled:opacity-50 border-none">
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account? <Link to="/" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
