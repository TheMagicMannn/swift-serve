import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { useState } from "react";
import { ArrowLeft, Camera, Mic, MapPin, Zap, Image as ImageIcon, Sparkles, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({ component: Create });

function Create() {
  const nav = useNavigate();
  const [desc, setDesc] = useState("Need a 65 inch TV mounted above the fireplace, drywall");
  const [urgency, setUrgency] = useState<"standard" | "same_day" | "urgent" | "emergency">("standard");
  const photos = ["📺", "📐", "🛋️"];

  return (
    <MobileShell hideNav>
      <StatusBar
        title="New job"
        back={<Link to="/" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}
      />

      <div className="px-5 pt-5 space-y-6">
        {/* Description */}
        <div className="fade-up">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Describe the task</label>
          <div className="mt-2 glass-strong rounded-3xl p-4">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What do you need help with?"
              rows={3}
              className="w-full bg-transparent resize-none outline-none text-base placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mic className="w-4 h-4" /> Voice</button>
              <button className="text-xs text-primary flex items-center gap-1"><Sparkles className="w-3.5 h-3.5"/>AI improve</button>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="fade-up" style={{ animationDelay: "60ms" }}>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Photos & video</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="aspect-square rounded-2xl gradient-card border border-white/5 grid place-items-center text-3xl shadow-card">
                {p}
              </div>
            ))}
            <button className="aspect-square rounded-2xl border-2 border-dashed border-white/15 grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="flex-1 glass rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm"><Camera className="w-4 h-4"/>Camera</button>
            <button className="flex-1 glass rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm"><ImageIcon className="w-4 h-4"/>Library</button>
          </div>
        </div>

        {/* Address */}
        <div className="fade-up" style={{ animationDelay: "120ms" }}>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Service address</label>
          <button className="mt-2 w-full glass-strong rounded-2xl p-4 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-primary/15 grid place-items-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">1284 Mission St</div>
              <div className="text-xs text-muted-foreground">Apt 3F · San Francisco, CA</div>
            </div>
            <span className="text-xs text-primary">Change</span>
          </button>
        </div>

        {/* Urgency */}
        <div className="fade-up" style={{ animationDelay: "180ms" }}>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">When</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              { v: "standard", label: "Standard", sub: "Within 3 days", emergency: false },
              { v: "same_day", label: "Same day", sub: "Today", emergency: false },
              { v: "urgent", label: "Urgent", sub: "< 4 hours", emergency: false },
              { v: "emergency", label: "Emergency", sub: "Now · +$45", emergency: true },
            ] as const).map((o) => (
              <button
                key={o.v}
                onClick={() => setUrgency(o.v)}
                className={cn(
                  "rounded-2xl p-3 text-left border transition-all",
                  urgency === o.v
                    ? o.emergency
                      ? "gradient-emergency border-transparent shadow-glow text-white"
                      : "gradient-primary border-transparent shadow-glow text-primary-foreground"
                    : "glass border-white/5"
                )}
              >
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  {o.emergency && <Zap className="w-3.5 h-3.5"/>}
                  {o.label}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">{o.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => nav({ to: "/scope" })}
          className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow flex items-center justify-center gap-2 fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <Sparkles className="w-5 h-5"/> Analyze with AI
        </button>
      </div>
    </MobileShell>
  );
}
