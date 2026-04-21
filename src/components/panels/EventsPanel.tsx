import { useState } from "react";
import { Calendar, MapPin, Clock, Users, Bookmark, BookmarkCheck, CalendarDays } from "lucide-react";

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

const EventsPanel = () => {
  // Real events will be added by admins. Until then, show an empty state.
  const [events, setEvents] = useState<Event[]>([]);
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

      {events.length === 0 ? (
        <div className="content-card flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <CalendarDays className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No events yet</h3>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Campus events and deadlines will appear here once your admin posts them.
          </p>
        </div>
      ) : (
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
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No events match this filter.</p>}
        </div>
      )}
    </div>
  );
};

export default EventsPanel;
