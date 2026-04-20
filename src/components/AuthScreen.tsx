import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthScreenProps {
  onLogin: () => void;
}

interface Faculty { id: string; name: string; }
interface Department { id: string; name: string; faculty_id: string; }

const AuthScreen = ({ onLogin }: AuthScreenProps) => {
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    supabase.from("faculties").select("*").order("name").then(({ data }) => setFaculties(data || []));
    supabase.from("departments").select("*").order("name").then(({ data }) => setDepartments(data || []));
  }, []);

  const filteredDepts = faculty ? departments.filter(d => d.faculty_id === faculty) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "register") {
        const deptName = departments.find(d => d.id === department)?.name || "";
        const facName = faculties.find(f => f.id === faculty)?.name || "";
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { display_name: fullName, faculty: facName, department: deptName, level, matric_number: matricNumber },
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="bg-card border border-border rounded-xl p-8 w-full max-w-[420px] shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">A</div>
          <span className="text-lg font-semibold tracking-tight">AcadLink</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Sokoto State University — Student Platform</p>

        <h1 className="text-xl font-semibold mb-1">
          {tab === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {tab === "signin" ? "Sign in to access your dashboard" : "Get started with AcadLink"}
        </p>

        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
          {(["signin", "register"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-center rounded-md text-sm font-medium transition-all border-none cursor-pointer ${
                tab === t ? "bg-card text-foreground shadow-sm" : "bg-transparent text-muted-foreground"
              }`}>
              {t === "signin" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input type="text" placeholder="e.g. Kabir Aminu" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Matric Number</label>
                <input type="text" placeholder="e.g. SSU/CSC/20/1042" value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} required
                  className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Faculty</label>
                  <select value={faculty} onChange={(e) => { setFaculty(e.target.value); setDepartment(""); }} required
                    className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50">
                    <option value="">Select</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} required disabled={!faculty}
                    className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-50">
                    <option value="">Select</option>
                    {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} required
                  className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50">
                  <option value="">Select Level</option>
                  {["100", "200", "300", "400", "500"].map(l => <option key={l} value={l}>{l} Level</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input type="email" placeholder="you@student.ssu.edu.ng" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full h-9 px-3 pr-16 rounded-md border border-input bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs bg-transparent border-none cursor-pointer hover:text-foreground">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed border-none">
            {loading ? "Please wait..." : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setTab(tab === "signin" ? "register" : "signin")} className="text-primary font-medium hover:underline bg-transparent border-none cursor-pointer">
            {tab === "signin" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
