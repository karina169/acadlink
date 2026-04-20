import { useState, useEffect } from "react";
import { Shield, Users, FileText, BarChart3, GraduationCap, Building2, BookOpen, Trash2, Plus, ChevronDown, Newspaper, UserCog, Pin, PinOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Tab = "overview" | "users" | "content" | "faculties" | "roles" | "news";

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

export default AdminDashboard;
