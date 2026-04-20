import { useState } from "react";
import { Users, Plus, MessageCircle, Clock, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StudyGroup {
  id: string;
  name: string;
  course: string;
  members: number;
  maxMembers: number;
  lastActive: string;
  description: string;
  isJoined: boolean;
  avatar: string;
}

const initialGroups: StudyGroup[] = [
  { id: "1", name: "CSC 301 Study Circle", course: "CSC 301", members: 12, maxMembers: 20, lastActive: "2 min ago", description: "Data Structures & Algorithms prep group", isJoined: true, avatar: "💻" },
  { id: "2", name: "MTH 201 Problem Solvers", course: "MTH 201", members: 8, maxMembers: 15, lastActive: "15 min ago", description: "Mathematical Methods practice sessions", isJoined: true, avatar: "📐" },
  { id: "3", name: "PHY 101 Lab Partners", course: "PHY 101", members: 18, maxMembers: 25, lastActive: "1 hr ago", description: "Physics practical prep and report writing", isJoined: false, avatar: "⚡" },
  { id: "4", name: "GST 111 Discussion", course: "GST 111", members: 30, maxMembers: 50, lastActive: "3 hrs ago", description: "Use of English essays and comprehension", isJoined: false, avatar: "📝" },
  { id: "5", name: "CSC 305 Project Team", course: "CSC 305", members: 5, maxMembers: 6, lastActive: "30 min ago", description: "Operating Systems project collaboration", isJoined: true, avatar: "🖥️" },
  { id: "6", name: "STA 201 Exam Prep", course: "STA 201", members: 14, maxMembers: 20, lastActive: "5 hrs ago", description: "Statistics revision and past question solving", isJoined: false, avatar: "📊" },
];

const StudyGroupsPanel = () => {
  const [groups, setGroups] = useState(initialGroups);
  const [filter, setFilter] = useState<"all" | "joined">("all");
  const [search, setSearch] = useState("");

  const filtered = groups.filter((g) => {
    if (filter === "joined" && !g.isJoined) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.course.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleJoin = (id: string) => {
    setGroups((prev) => prev.map((g) => g.id === id ? { ...g, isJoined: !g.isJoined, members: g.isJoined ? g.members - 1 : g.members + 1 } : g));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-header">Study Groups</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{groups.length} groups available</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Create Group</Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
        <div className="flex gap-1">
          {(["all", "joined"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`filter-pill ${filter === f ? "filter-pill-active" : ""}`}>
              {f === "all" ? "All" : "My Groups"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((group) => (
          <div key={group.id} className="content-card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">{group.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">{group.course}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.members}/{group.maxMembers}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{group.lastActive}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              {group.isJoined ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1 text-xs gap-1"><MessageCircle className="w-3.5 h-3.5" />Chat</Button>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => toggleJoin(group.id)}>Leave</Button>
                </>
              ) : (
                <Button size="sm" className="flex-1 text-xs gap-1" onClick={() => toggleJoin(group.id)} disabled={group.members >= group.maxMembers}>
                  <UserPlus className="w-3.5 h-3.5" />{group.members >= group.maxMembers ? "Full" : "Join Group"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyGroupsPanel;
