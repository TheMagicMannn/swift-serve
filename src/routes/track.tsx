import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Phone, MessageSquare, Star, Shield, Clock } from "lucide-react";

export const Route = createFileRoute("/track")({ component: Track });

function Track() {
  const stages = [
    { label: "Dispatched", done: true },
    { label: "Accepted", done: true },
    { label: "En route", done: true, active: true },
    { label: "Arrived", done: false },
    { label: "In progress", done: false },
    { label: "Completed", done: false },
  ];

  return (
    <MobileShell>
      {/* Map */}
      <div className="relative h-[55vh] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 30% 40%, oklch(0.30 0.10 275 / 0.6), transparent 50%), radial-gradient(circle at 70% 70%, oklch(0.25 0.08 290 / 0.4), transparent 50%), oklch(0.10 0.04 270)",
        }}>
          {/* Faux road grid */}
          <svg className="w-full h-full opacity-30" viewBox="0 0 400 400">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.5 0.1 275)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
            <path d="M 0 200 Q 150 180 200 220 T 400 200" stroke="oklch(0.62 0.22 275)" strokeWidth="3" fill="none" strokeDasharray="8 4"/>
          </svg>
          {/* Provider pin */}
          <div className="absolute top-[35%] left-[28%]">
            <div className="relative">
              <div className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-xs font-bold text-primary-foreground shadow-glow border-2 border-white">MT</div>
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping"/>
            </div>
          </div>
          {/* Destination */}
          <div className="absolute bottom-[25%] right-[25%]">
            <div className="w-10 h-10 rounded-full gradient-success grid place-items-center text-lg shadow-glow border-2 border-white">🏠</div>
          </div>
        </div>
        <div className="absolute top-12 left-5 right-5 flex justify-between">
          <Link to="/" className="w-10 h-10 glass-strong rounded-full grid place-items-center">←</Link>
          <div className="glass-strong rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold"><Clock className="w-4 h-4 text-primary"/>12 min away</div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="-mt-8 relative bg-background rounded-t-3xl border-t border-white/5 px-5 pt-5 pb-6">
        <div className="w-12 h-1 rounded-full bg-white/15 mx-auto mb-5"/>

        {/* Provider */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full gradient-primary grid place-items-center font-semibold text-primary-foreground shadow-glow">MT</div>
          <div className="flex-1">
            <div className="font-semibold">Marcus T.</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-warning text-warning"/>4.96 · 312 jobs
              <span className="flex items-center gap-0.5 text-success"><Shield className="w-3 h-3"/>Verified Pro</span>
            </div>
          </div>
          <Link to="/chat" className="w-10 h-10 rounded-full bg-secondary grid place-items-center"><MessageSquare className="w-4 h-4"/></Link>
          <button className="w-10 h-10 rounded-full bg-secondary grid place-items-center"><Phone className="w-4 h-4"/></button>
        </div>

        {/* Stages */}
        <div className="mt-5 glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-[10px] font-medium">
            {stages.map((s, i) => (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-1.5 relative">
                {i > 0 && <div className={`absolute right-1/2 top-2 w-full h-0.5 ${s.done ? "bg-primary" : "bg-white/10"}`}/>}
                <div className={`relative w-4 h-4 rounded-full ${s.done ? "gradient-primary shadow-glow" : "bg-white/15"} ${s.active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}/>
                <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Job summary */}
        <div className="mt-4 gradient-card rounded-2xl p-4 border border-white/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Job</div>
          <div className="font-semibold mt-1">65" TV mount on drywall</div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-muted-foreground">Fixed price</span>
            <span className="font-bold">$135</span>
          </div>
        </div>

        <button className="mt-3 w-full text-sm text-destructive py-3">Cancel job</button>
      </div>
    </MobileShell>
  );
}
