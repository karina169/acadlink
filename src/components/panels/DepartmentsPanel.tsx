import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

interface Faculty { id: string; name: string; }
interface Department { id: string; name: string; faculty_id: string; }

const DepartmentsPanel = () => {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeFaculty, setActiveFaculty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [fRes, dRes] = await Promise.all([
        supabase.from("faculties").select("*").order("name"),
        supabase.from("departments").select("*").order("name"),
      ]);
      setFaculties(fRes.data || []);
      setDepartments(dRes.data || []);
      if (fRes.data?.[0]) setActiveFaculty(fRes.data[0].id);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = activeFaculty ? departments.filter(d => d.faculty_id === activeFaculty) : departments;
  const activeFacultyName = faculties.find(f => f.id === activeFaculty)?.name || "";

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">Departments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{departments.length} departments across {faculties.length} faculties</p>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {faculties.map(f => (
          <button key={f.id} onClick={() => setActiveFaculty(f.id)}
            className={`filter-pill ${activeFaculty === f.id ? "filter-pill-active" : ""}`}>
            {f.name.replace("Faculty of ", "")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((d) => (
          <div key={d.id} className="content-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
              {d.name.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold">{d.name}</div>
              <div className="text-[11px] text-muted-foreground">{activeFacultyName}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsPanel;
