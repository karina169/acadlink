import { useState } from "react";
import { Calendar, MapPin, Clock, Users, Bookmark, BookmarkCheck } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "workshop" | "seminar" | "social" | "exam" | "deadline";
  description: string;
  attendees: number;
  saved: boolean;
}

const typeColors: Record<string, string> = {
  workshop: "bg-emerald-50 text-emerald-700",
  seminar: "bg-blue-50 text-blue-700",
  social: "bg-amber-50 text-amber-700",
  exam: "bg-red-50 text-red-700",
  deadline: "bg-orange-50 text-orange-700",
};

const initialEvents: Event[] = [
  { id: "1", title: "CSC 301 Mid-Semester Test", date: "Apr 14, 2026", time: "10:00 AM", location: "CBT Centre Hall A", type: "exam", description: "Covers Chapters 1–5: Trees, Sorting, Graphs", attendees: 120, saved: true },
  { id: "2", title: "AI & Machine Learning Workshop", date: "Apr 16, 2026", time: "2:00 PM", location: "ICT Lab 2", type: "workshop", description: "Hands-on intro to ML with Python and scikit-learn", attendees: 45, saved: false },
  { id: "3", title: "Research Methodology Seminar", date: "Apr 18, 2026", time: "11:00 AM", location: "Senate Building Auditorium", type: "seminar", description: "Writing effective research proposals for final year projects", attendees: 80, saved: false },
  { id: "4", title: "Course Registration Deadline", date: "Apr 20, 2026", time: "11:59 PM", location: "Online Portal", type: "deadline", description: "Last day to add/drop courses for 2025/2026 session", attendees: 0, saved: true },
  { id: "5", title: "Inter-Faculty Sports Day", date: "Apr 22, 2026", time: "8:00 AM", location: "University Sports Complex", type: "social", description: "Football, volleyball, athletics — represent your faculty!", attendees: 200, saved: false },
];

const EventsPanel = () => {
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState("all");

  const toggleSave = (id: string) => setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, saved: !e.saved } : e)));
  const filtered = filter === "all" ? events : filter === "saved" ? events.filter((e) => e.saved) : events.filter((e) => e.type === filter);

  return (
    <div>
      <div className="mb-5">
        <h2 className="page-header">Events</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Upcoming campus events and deadlines</p>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {["all", "saved", "exam", "workshop", "seminar", "social", "deadline"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`filter-pill capitalize ${filter === f ? "filter-pill-active" : ""}`}>
            {f === "saved" ? "★ Saved" : f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((event) => (
          <div key={event.id} className="content-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase inline-block mb-1.5 ${typeColors[event.type]}`}>{event.type}</span>
                <h3 className="font-semibold text-sm">{event.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
              </div>
              <button onClick={() => toggleSave(event.id)} className="text-muted-foreground hover:text-primary transition-colors shrink-0 bg-transparent border-none cursor-pointer">
                {event.saved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
              {event.attendees > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.attendees}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No events found.</p>}
      </div>
    </div>
  );
};

export default EventsPanel;
