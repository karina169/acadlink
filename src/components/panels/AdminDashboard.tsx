import { useState, useEffect } from "react";
import { Shield, Users, FileText, BarChart3, GraduationCap, Building2, BookOpen, Trash2, Plus, ChevronDown, Newspaper, UserCog, Pin, PinOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Tab = "overview" | "users" | "content" | "faculties" | "roles" | "news" | "uploads";

const AdminDashboard = () => {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div>
      <div className="mb-5">
        <h2 className="page-header">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your platform</p>
      </div>

      <div className="flex gap-1 mb-5 border-b border-border overflow-x-auto">
        {([
          { key: "overview", label: "Overview", icon: BarChart3 },
          { key: "users", label: "Users", icon: Users },
          { key: "roles", label: "Roles", icon: UserCog },
          { key: "content", label: "Content", icon: FileText },
          { key: "news", label: "News", icon: Newspaper },
          { key: "uploads", label: "Uploads", icon: BookOpen },
          { key: "faculties", label: "Academics", icon: GraduationCap },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors border-b-2 -mb-px bg-transparent border-x-0 border-t-0 cursor-pointer whitespace-nowrap ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "roles" && <RolesTab />}
      {tab === "content" && <ContentTab />}
      {tab === "news" && <NewsTab />}
      {tab === "uploads" && <UploadsTab />}
      {tab === "faculties" && <FacultiesTab />}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const OverviewTab = () => {
  const [stats, setStats] = useState({ users: 0, posts: 0, faculties: 0, departments: 0, courses: 0, news: 0 });

  useEffect(() => {
    const load = async () => {
      const [u, p, f, d, c, n] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("faculties").select("id", { count: "exact", head: true }),
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("campus_news").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count || 0, posts: p.count || 0, faculties: f.count || 0, departments: d.count || 0, courses: c.count || 0, news: n.count || 0 });
    };
    load();
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <StatCard label="Total Users" value={stats.users} icon={Users} />
      <StatCard label="Total Posts" value={stats.posts} icon={FileText} />
      <StatCard label="Faculties" value={stats.faculties} icon={Building2} />
      <StatCard label="Departments" value={stats.departments} icon={Building2} />
      <StatCard label="Courses" value={stats.courses} icon={BookOpen} />
      <StatCard label="News Published" value={stats.news} icon={FileText} />
    </div>
  );
};

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => {
      setUsers(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="content-card !p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Department</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Level</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">Matric No.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                  {(u.display_name || "?").slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium truncate">{u.display_name || "No name"}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.department || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.level || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{u.matric_number || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No users yet.</p>}
    </div>
  );
};

const ContentTab = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(30).then(({ data }) => {
      setPosts(data || []);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setPosts((p) => p.filter((x) => x.id !== id)); toast.success("Post deleted"); }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <div key={p.id} className="content-card flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm line-clamp-2">{p.content}</p>
            <div className="text-[11px] text-muted-foreground mt-1">
              {new Date(p.created_at).toLocaleDateString()} · {p.tag}
            </div>
          </div>
          <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 bg-transparent border-none cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {posts.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No posts yet.</p>}
    </div>
  );
};

const FacultiesTab = () => {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFaculty, setNewFaculty] = useState("");
  const [newDept, setNewDept] = useState({ name: "", faculty_id: "" });
  const [newCourse, setNewCourse] = useState({ code: "", title: "", department_id: "", level: "100", semester: "1st", units: 3 });
  const [expandedFac, setExpandedFac] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [f, d, c] = await Promise.all([
      supabase.from("faculties").select("*").order("name"),
      supabase.from("departments").select("*").order("name"),
      supabase.from("courses").select("*").order("code"),
    ]);
    setFaculties(f.data || []); setDepartments(d.data || []); setCourses(c.data || []);
    setLoading(false);
  };

  const addFaculty = async () => {
    if (!newFaculty.trim()) return;
    const { error } = await supabase.from("faculties").insert({ name: newFaculty.trim() });
    if (error) toast.error(error.message); else { toast.success("Faculty added"); setNewFaculty(""); loadAll(); }
  };

  const addDept = async () => {
    if (!newDept.name.trim() || !newDept.faculty_id) return;
    const { error } = await supabase.from("departments").insert({ name: newDept.name.trim(), faculty_id: newDept.faculty_id });
    if (error) toast.error(error.message); else { toast.success("Department added"); setNewDept({ name: "", faculty_id: "" }); loadAll(); }
  };

  const addCourse = async () => {
    if (!newCourse.code.trim() || !newCourse.title.trim() || !newCourse.department_id) return;
    const { error } = await supabase.from("courses").insert({
      code: newCourse.code.trim(), title: newCourse.title.trim(),
      department_id: newCourse.department_id, level: newCourse.level,
      semester: newCourse.semester, units: newCourse.units,
    });
    if (error) toast.error(error.message); else {
      toast.success("Course added");
      setNewCourse({ code: "", title: "", department_id: "", level: "100", semester: "1st", units: 3 });
      loadAll();
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="content-card">
        <h3 className="section-label mb-3">Add Faculty</h3>
        <div className="flex gap-2">
          <Input placeholder="Faculty name" value={newFaculty} onChange={(e) => setNewFaculty(e.target.value)} className="h-9 text-sm flex-1" />
          <Button size="sm" onClick={addFaculty} className="gap-1"><Plus className="w-3 h-3" />Add</Button>
        </div>
      </div>

      <div className="content-card">
        <h3 className="section-label mb-3">Add Department</h3>
        <div className="space-y-2">
          <select value={newDept.faculty_id} onChange={(e) => setNewDept({ ...newDept, faculty_id: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Select Faculty</option>
            {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div className="flex gap-2">
            <Input placeholder="Department name" value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} className="h-9 text-sm flex-1" />
            <Button size="sm" onClick={addDept} className="gap-1"><Plus className="w-3 h-3" />Add</Button>
          </div>
        </div>
      </div>

      <div className="content-card">
        <h3 className="section-label mb-3">Add Course</h3>
        <div className="space-y-2">
          <select value={newCourse.department_id} onChange={(e) => setNewCourse({ ...newCourse, department_id: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Select Department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Code (e.g. BCH201)" value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} className="h-9 text-sm" />
            <Input placeholder="Title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select value={newCourse.level} onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {["100", "200", "300", "400", "500"].map((l) => <option key={l} value={l}>{l}L</option>)}
            </select>
            <select value={newCourse.semester} onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="1st">1st Sem</option>
              <option value="2nd">2nd Sem</option>
            </select>
            <Input type="number" placeholder="Units" value={newCourse.units} onChange={(e) => setNewCourse({ ...newCourse, units: parseInt(e.target.value) || 3 })} className="h-9 text-sm" />
          </div>
          <Button size="sm" onClick={addCourse} className="w-full gap-1"><Plus className="w-3 h-3" />Add Course</Button>
        </div>
      </div>

      <div>
        <h3 className="section-label mb-3">Existing Structure</h3>
        {faculties.map((fac) => {
          const facDepts = departments.filter((d) => d.faculty_id === fac.id);
          return (
            <div key={fac.id} className="mb-2">
              <button onClick={() => setExpandedFac(expandedFac === fac.id ? null : fac.id)}
                className="w-full content-card flex items-center justify-between text-left !mb-0">
                <span className="text-sm font-semibold">{fac.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{facDepts.length} depts</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedFac === fac.id ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expandedFac === fac.id && (
                <div className="ml-4 mt-1 space-y-1">
                  {facDepts.map((dept) => {
                    const deptCourses = courses.filter((c) => c.department_id === dept.id);
                    return (
                      <div key={dept.id} className="bg-muted/50 rounded-lg p-2.5">
                        <div className="text-xs font-semibold mb-1">{dept.name}</div>
                        {deptCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {deptCourses.map((c) => (
                              <span key={c.id} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{c.code}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No courses yet</span>
                        )}
                      </div>
                    );
                  })}
                  {facDepts.length === 0 && <p className="text-[11px] text-muted-foreground p-2">No departments</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RolesTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [u, r] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, matric_number, department").order("created_at", { ascending: false }).limit(100),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setUsers(u.data || []);
    const map: Record<string, string[]> = {};
    (r.data || []).forEach((row: any) => {
      if (!map[row.user_id]) map[row.user_id] = [];
      map[row.user_id].push(row.role);
    });
    setRoles(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: "admin" | "group_admin" | "moderator") => {
    const has = roles[userId]?.includes(role);
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
      toast.success(`Removed ${role}`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
      toast.success(`Granted ${role}`);
    }
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">Grant admin or group-admin powers to users. Group admins can create course chat groups.</p>
      {users.map(u => (
        <div key={u.user_id} className="content-card flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{u.display_name || "No name"}</div>
            <div className="text-[11px] text-muted-foreground truncate">{u.matric_number || "—"} · {u.department || "—"}</div>
          </div>
          <div className="flex gap-1.5">
            {(["admin", "group_admin", "moderator"] as const).map(r => {
              const active = roles[u.user_id]?.includes(r);
              return (
                <button key={r} onClick={() => toggleRole(u.user_id, r)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium border cursor-pointer transition ${
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                  }`}>
                  {r.replace("_", " ")}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {users.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No users yet.</p>}
    </div>
  );
};

const NewsTab = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "", category: "general", pinned: false });

  const load = async () => {
    const { data } = await supabase.from("campus_news").select("*").order("created_at", { ascending: false });
    setNews(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const publish = async () => {
    if (!form.title.trim() || !form.body.trim()) return toast.error("Title and body required");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("campus_news").insert({ ...form, published_by: user.id });
    if (error) return toast.error(error.message);
    toast.success("News published");
    setForm({ title: "", body: "", category: "general", pinned: false });
    load();
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from("campus_news").update({ pinned: !pinned }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("campus_news").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="content-card space-y-2">
        <h3 className="section-label">Publish News</h3>
        <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-9 text-sm" />
        <textarea placeholder="Body" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3}
          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="grid grid-cols-2 gap-2">
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="general">General</option>
            <option value="academic">Academic</option>
            <option value="event">Event</option>
            <option value="urgent">Urgent</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} />
            Pin to top
          </label>
        </div>
        <Button size="sm" onClick={publish} className="w-full gap-1"><Plus className="w-3 h-3" /> Publish</Button>
      </div>

      <div className="space-y-2">
        {news.map(n => (
          <div key={n.id} className="content-card flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold flex items-center gap-2">
                {n.pinned && <Pin className="w-3 h-3 text-primary" />}
                {n.title}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
              <div className="text-[10px] text-muted-foreground mt-1 uppercase">{n.category} · {new Date(n.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => togglePin(n.id, n.pinned)} className="text-muted-foreground hover:text-primary bg-transparent border-none cursor-pointer">
                {n.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
              <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {news.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No news yet.</p>}
      </div>
    </div>
  );
};

// =================== UPLOADS TAB ===================
type UploadKind = "handouts" | "past_questions" | "timetable" | "results";

const UploadsTab = () => {
  const [kind, setKind] = useState<UploadKind>("handouts");
  return (
    <div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {([
          { k: "handouts", label: "Handouts" },
          { k: "past_questions", label: "Past Questions" },
          { k: "timetable", label: "Timetable" },
          { k: "results", label: "Results" },
        ] as const).map(({ k, label }) => (
          <button key={k} onClick={() => setKind(k)}
            className={`filter-pill ${kind === k ? "filter-pill-active" : ""}`}>
            {label}
          </button>
        ))}
      </div>
      {kind === "handouts" && <HandoutsAdmin />}
      {kind === "past_questions" && <PastQuestionsAdmin />}
      {kind === "timetable" && <TimetableAdmin />}
      {kind === "results" && <ResultsAdmin />}
    </div>
  );
};

const useScopeOptions = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("departments").select("id, name").order("name").then(({ data }) => setDepartments(data || []));
    supabase.from("courses").select("id, code, title, department_id").order("code").then(({ data }) => setCourses(data || []));
  }, []);
  return { departments, courses };
};

const uploadFile = async (file: File, folder: string): Promise<{ url: string; size: string } | null> => {
  const path = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from("academic-files").upload(path, file);
  if (error) { toast.error(error.message); return null; }
  const { data } = supabase.storage.from("academic-files").getPublicUrl(path);
  const sizeKB = file.size / 1024;
  const size = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
  return { url: data.publicUrl, size };
};

const LEVELS = ["100", "200", "300", "400", "500"];

const HandoutsAdmin = () => {
  const { departments, courses } = useScopeOptions();
  const [form, setForm] = useState({ title: "", description: "", department_id: "", level: "", course_id: "" });
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("handouts").select("id, title, level, created_at, departments(name), courses(code)").order("created_at", { ascending: false }).limit(50);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !file) return toast.error("Title and file required");
    setBusy(true);
    const up = await uploadFile(file, "handouts");
    if (!up) { setBusy(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("handouts").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      department_id: form.department_id || null,
      level: form.level || null,
      course_id: form.course_id || null,
      file_url: up.url, file_name: file.name, file_size: up.size, file_type: file.type,
      uploaded_by: user!.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Handout uploaded");
    setForm({ title: "", description: "", department_id: "", level: "", course_id: "" });
    setFile(null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("handouts").delete().eq("id", id);
    load();
  };

  const filteredCourses = form.department_id ? courses.filter((c) => c.department_id === form.department_id) : courses;

  return (
    <div className="space-y-3">
      <div className="content-card space-y-2">
        <h3 className="section-label">Upload Handout</h3>
        <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-9 text-sm" />
        <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value, course_id: "" })}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">All levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
          </select>
        </div>
        <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">No specific course</option>
          {filteredCourses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
        </select>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-xs" />
        <Button size="sm" onClick={submit} disabled={busy} className="w-full gap-1"><Plus className="w-3 h-3" /> {busy ? "Uploading..." : "Upload"}</Button>
      </div>

      <div className="space-y-2">
        {items.map((h) => (
          <div key={h.id} className="content-card flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{h.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {[h.courses?.code, h.departments?.name, h.level && `${h.level}L`].filter(Boolean).join(" · ") || "All scopes"}
              </div>
            </div>
            <button onClick={() => remove(h.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No handouts uploaded.</p>}
      </div>
    </div>
  );
};

const PastQuestionsAdmin = () => {
  const { departments, courses } = useScopeOptions();
  const [form, setForm] = useState({ title: "", session: "", semester: "1st", pages: "", department_id: "", level: "", course_id: "" });
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("past_questions").select("id, title, session, semester, level, departments(name), courses(code)").order("created_at", { ascending: false }).limit(50);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !file) return toast.error("Title and file required");
    setBusy(true);
    const up = await uploadFile(file, "past_questions");
    if (!up) { setBusy(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("past_questions").insert({
      title: form.title.trim(),
      session: form.session.trim() || null,
      semester: form.semester || null,
      pages: form.pages ? parseInt(form.pages) : null,
      department_id: form.department_id || null,
      level: form.level || null,
      course_id: form.course_id || null,
      file_url: up.url, file_name: file.name,
      uploaded_by: user!.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Past question uploaded");
    setForm({ title: "", session: "", semester: "1st", pages: "", department_id: "", level: "", course_id: "" });
    setFile(null);
    load();
  };

  const remove = async (id: string) => { await supabase.from("past_questions").delete().eq("id", id); load(); };

  const filteredCourses = form.department_id ? courses.filter((c) => c.department_id === form.department_id) : courses;

  return (
    <div className="space-y-3">
      <div className="content-card space-y-2">
        <h3 className="section-label">Upload Past Question</h3>
        <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-9 text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Session (2024/25)" value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} className="h-9 text-sm" />
          <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="1st">1st Sem</option><option value="2nd">2nd Sem</option>
          </select>
          <Input type="number" placeholder="Pages" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} className="h-9 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value, course_id: "" })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">All levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
          </select>
        </div>
        <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">No specific course</option>
          {filteredCourses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
        </select>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-xs" />
        <Button size="sm" onClick={submit} disabled={busy} className="w-full gap-1"><Plus className="w-3 h-3" /> {busy ? "Uploading..." : "Upload"}</Button>
      </div>

      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="content-card flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{p.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {[p.courses?.code, p.departments?.name, p.level && `${p.level}L`, p.session, p.semester].filter(Boolean).join(" · ")}
              </div>
            </div>
            <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No past questions uploaded.</p>}
      </div>
    </div>
  );
};

const TimetableAdmin = () => {
  const { departments, courses } = useScopeOptions();
  const [form, setForm] = useState({
    department_id: "", level: "", semester: "1st", course_id: "",
    course_code: "", course_title: "", day_of_week: "Monday",
    start_time: "08:00", end_time: "10:00", venue: "", lecturer: "",
  });
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("timetable_entries")
      .select("id, semester, day_of_week, start_time, end_time, venue, course_code, level, departments(name)")
      .order("created_at", { ascending: false }).limit(100);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.day_of_week || !form.start_time || !form.end_time) return toast.error("Day & times required");
    const { data: { user } } = await supabase.auth.getUser();
    const linkedCourse = courses.find((c) => c.id === form.course_id);
    const { error } = await supabase.from("timetable_entries").insert({
      department_id: form.department_id || null,
      level: form.level || null,
      semester: form.semester,
      course_id: form.course_id || null,
      course_code: linkedCourse?.code || form.course_code || null,
      course_title: linkedCourse?.title || form.course_title || null,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      venue: form.venue.trim() || null,
      lecturer: form.lecturer.trim() || null,
      created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Timetable entry added");
    setForm({ ...form, course_id: "", course_code: "", course_title: "", venue: "", lecturer: "" });
    load();
  };

  const remove = async (id: string) => { await supabase.from("timetable_entries").delete().eq("id", id); load(); };
  const filteredCourses = form.department_id ? courses.filter((c) => c.department_id === form.department_id) : courses;

  return (
    <div className="space-y-3">
      <div className="content-card space-y-2">
        <h3 className="section-label">Add Timetable Entry</h3>
        <div className="grid grid-cols-2 gap-2">
          <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value, course_id: "" })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">All levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="1st">1st Sem</option><option value="2nd">2nd Sem</option>
          </select>
          <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">— Free text course below —</option>
          {filteredCourses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
        </select>
        {!form.course_id && (
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Course code" value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} className="h-9 text-sm" />
            <Input placeholder="Course title" value={form.course_title} onChange={e => setForm({ ...form, course_title: e.target.value })} className="h-9 text-sm" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="h-9 text-sm" />
          <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="h-9 text-sm" />
        </div>
        <Input placeholder="Venue" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="h-9 text-sm" />
        <Input placeholder="Lecturer" value={form.lecturer} onChange={e => setForm({ ...form, lecturer: e.target.value })} className="h-9 text-sm" />
        <Button size="sm" onClick={submit} className="w-full gap-1"><Plus className="w-3 h-3" /> Add Entry</Button>
      </div>

      <div className="space-y-2">
        {items.map((e) => (
          <div key={e.id} className="content-card flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{e.course_code || "Class"} — {e.day_of_week}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {e.start_time}–{e.end_time} · {e.venue || "—"} · {[e.departments?.name, e.level && `${e.level}L`, `${e.semester} sem`].filter(Boolean).join(" · ")}
              </div>
            </div>
            <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No timetable entries yet.</p>}
      </div>
    </div>
  );
};

const ResultsAdmin = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ student_id: "", session: "", semester: "1st", course_code: "", course_title: "", units: "3", score: "", grade: "A" });
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("user_id, display_name, matric_number").order("display_name").then(({ data }) => setStudents(data || []));
  }, []);

  const load = async () => {
    const { data } = await supabase.from("student_results").select("id, session, semester, course_code, grade, score, student_id").order("created_at", { ascending: false }).limit(100);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.student_id || !form.session.trim() || !form.course_code.trim() || !form.grade.trim()) return toast.error("Student, session, course & grade required");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("student_results").insert({
      student_id: form.student_id,
      session: form.session.trim(),
      semester: form.semester,
      course_code: form.course_code.trim().toUpperCase(),
      course_title: form.course_title.trim() || null,
      units: parseInt(form.units) || 3,
      score: form.score ? parseFloat(form.score) : null,
      grade: form.grade.trim().toUpperCase(),
      uploaded_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Result added");
    setForm({ ...form, course_code: "", course_title: "", score: "" });
    load();
  };

  const remove = async (id: string) => { await supabase.from("student_results").delete().eq("id", id); load(); };

  const studentLabel = (id: string) => {
    const s = students.find((x) => x.user_id === id);
    return s ? `${s.display_name || "?"}${s.matric_number ? ` (${s.matric_number})` : ""}` : id.slice(0, 8);
  };

  return (
    <div className="space-y-3">
      <div className="content-card space-y-2">
        <h3 className="section-label">Add Result</h3>
        <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">Select student</option>
          {students.map((s) => <option key={s.user_id} value={s.user_id}>{s.display_name || "No name"} {s.matric_number ? `· ${s.matric_number}` : ""}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Session (2024/2025)" value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} className="h-9 text-sm" />
          <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="1st">1st Sem</option><option value="2nd">2nd Sem</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Course code" value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} className="h-9 text-sm" />
          <Input placeholder="Course title" value={form.course_title} onChange={e => setForm({ ...form, course_title: e.target.value })} className="h-9 text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" placeholder="Units" value={form.units} onChange={e => setForm({ ...form, units: e.target.value })} className="h-9 text-sm" />
          <Input type="number" placeholder="Score" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} className="h-9 text-sm" />
          <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            {["A","B","C","D","E","F"].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={submit} className="w-full gap-1"><Plus className="w-3 h-3" /> Add Result</Button>
      </div>

      <div className="space-y-2">
        {items.map((r) => (
          <div key={r.id} className="content-card flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{studentLabel(r.student_id)}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{r.course_code} · {r.session} {r.semester} · Grade {r.grade}{r.score != null ? ` (${r.score})` : ""}</div>
            </div>
            <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No results uploaded.</p>}
      </div>
    </div>
  );
};

export default AdminDashboard;
