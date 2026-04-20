import { useState } from "react";
import { ChevronDown, ChevronUp, Mail, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FAQ { q: string; a: string; }

const faqs: FAQ[] = [
  { q: "How do I register for courses?", a: "Navigate to 'My Courses' from the sidebar, then click 'Register Courses'. Select your courses for the current semester and submit. Registration must be done before the deadline shown in Events." },
  { q: "Where can I find my results?", a: "Go to 'Results' in the sidebar. Your semester results will appear once grades are published by the examination committee." },
  { q: "How do I join a study group?", a: "Visit 'Study Groups' from the sidebar. Browse available groups or search by course code. Click 'Join Group' to become a member." },
  { q: "How do I download handouts?", a: "Go to 'Handouts' in the sidebar. Filter by course or department, then click the download button on any handout card." },
  { q: "What should I do if I forget my password?", a: "On the login screen, click 'Forgot Password'. Enter your registered email address and follow the reset link sent to your inbox." },
  { q: "How do I update my profile information?", a: "Go to 'Settings' from the sidebar. Under 'Profile', you can update your display name, bio, and profile picture." },
];

const contacts = [
  { icon: Mail, label: "Email Support", value: "support@acadlink.edu.ng", action: "mailto:support@acadlink.edu.ng" },
  { icon: Phone, label: "Helpline", value: "+234 803 123 4567", action: "tel:+2348031234567" },
  { icon: MessageCircle, label: "Live Chat", value: "Available 8AM–6PM WAT", action: "#" },
];

const HelpPanel = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const filtered = faqs.filter((f) => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-5">
        <h2 className="page-header">Help Centre</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Find answers and get support</p>
      </div>

      <Input placeholder="Search FAQs..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-5 h-9 text-sm" />

      <div className="mb-6">
        <h3 className="section-label mb-3">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {filtered.map((faq, idx) => {
            const open = openIdx === idx;
            return (
              <div key={idx} className="content-card !p-0 overflow-hidden">
                <button onClick={() => setOpenIdx(open ? null : idx)} className="w-full flex items-center justify-between p-3.5 text-left bg-transparent border-none cursor-pointer">
                  <span className="font-medium text-sm pr-2">{faq.q}</span>
                  {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {open && <div className="px-3.5 pb-3.5 text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{faq.a}</div>}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No results found.</p>}
        </div>
      </div>

      <h3 className="section-label mb-3">Contact Support</h3>
      <div className="space-y-2 mb-6">
        {contacts.map((c, i) => (
          <a key={i} href={c.action} className="content-card flex items-center gap-3 no-underline text-foreground">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><c.icon className="w-4 h-4 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{c.label}</div>
              <div className="text-xs text-muted-foreground">{c.value}</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        ))}
      </div>

      <div className="content-card">
        <h3 className="font-medium text-sm mb-1">Submit a Ticket</h3>
        <p className="text-xs text-muted-foreground mb-3">Can't find what you're looking for? Submit a support ticket.</p>
        <Button size="sm" className="w-full text-xs">Open Support Ticket</Button>
      </div>
    </div>
  );
};

export default HelpPanel;
