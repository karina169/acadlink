import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login — AcadLink" },
      { name: "description", content: "Restricted admin sign-in for AcadLink administrators." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Sign-in failed");

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const isAdmin = roles?.some((r: any) => r.role === "admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account does not have admin access.");
      }
      toast.success("Welcome, admin");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-destructive/5 px-4 py-8">
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-[420px] shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-destructive flex items-center justify-center text-destructive-foreground mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold">AcadLink Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">Restricted area — admin credentials only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Admin Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full h-10 bg-destructive text-destructive-foreground rounded-md text-sm font-semibold cursor-pointer transition hover:bg-destructive/90 disabled:opacity-50 border-none">
            {loading ? "Verifying..." : "Sign In as Admin"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Not an admin? <Link to="/" className="text-primary hover:underline">Go to student sign-in</Link>
        </p>
      </div>
    </div>
  );
}
