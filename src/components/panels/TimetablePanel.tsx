import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Entry {
  id: string;
  semester: string;
  course_code: string | null;
  course_title: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  venue: string | null;
  lecturer: string | null;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TimetablePanel = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState<"1st" | "2nd">("1st");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("department, level")
        .eq("user_id", user.id)
        .single();

      let deptId: string | null = null;
      if (profile?.department) {
        const { data: dept } = await supabase.from("departments").select("id").eq("name", profile.department).maybeSingle();
        deptId = dept?.id ?? null;
      }

      let query = supabase
        .from("timetable_entries")
        .select("id, semester, course_code, course_title, day_of_week, start_time, end_time, venue, lecturer")
        .eq("semester", semester);

      if (deptId) query = query.or(`department_id.eq.${deptId},department_id.is.null`);
      if (profile?.level) query = query.or(`level.eq.${profile.level},level.is.null`);

      const { data } = await query;
      setEntries((data as Entry[]) || []);
      setLoading(false);
    };
    load();
  }, [semester]);

  const grouped = DAY_ORDER.map((day) => ({
    day,
    items: entries
      .filter((e) => e.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="mb-5">
        <h2 className="page-header">Timetable</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your weekly class schedule</p>
      </div>

      <div className="flex gap-1.5 mb-4">
        {(["1st", "2nd"] as const).map((s) => (
          <button key={s} onClick={() => setSemester(s)}
            className={`filter-pill ${semester === s ? "filter-pill-active" : ""}`}>
            {s} Semester
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : grouped.length === 0 ? (
        <div className="content-card flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No timetable yet</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Your class timetable will appear here once your admin sets it up for your department & level.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ day, items }) => (
            <div key={day}>
              <h3 className="text-sm font-semibold mb-2">{day}</h3>
              <div className="space-y-2">
                {items.map((e) => (
                  <div key={e.id} className="content-card flex items-start gap-3">
                    <div className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded w-[88px] text-center flex-shrink-0">
                      {e.start_time}<br />— {e.end_time}
                    </div>
                    <div className="flex-1 min-w-0">
                      {e.course_code && <div className="text-[11px] font-semibold text-primary">{e.course_code}</div>}
                      <div className="text-sm font-semibold truncate">{e.course_title || "Class"}</div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-1">
                        {e.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.venue}</span>}
                        {e.lecturer && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.lecturer}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimetablePanel;
