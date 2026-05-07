import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { RoleSwitch } from "@/components/RoleSwitch";
import { earnings } from "@/lib/mock";
import { ChevronRight, Star, Shield, Wrench, FileText, BadgeCheck, Clock, LogOut } from "lucide-react";

export const Route = createFileRoute("/provider/profile")({ component: ProviderProfile });

function ProviderProfile() {
  return (
    <MobileShell>
      <StatusBar title="Profile" action={<RoleSwitch/>} />
      <div className="px-5 pt-4 space-y-5">
        <div className="glass-strong rounded-3xl p-5 fade-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary grid place-items-center text-xl font-bold text-primary-foreground shadow-glow">MT</div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-lg">Marcus T.</span>
                <BadgeCheck className="w-4 h-4 text-primary"/>
              </div>
              <div className="text-xs text-muted-foreground">Verified Pro · since 2023</div>
              <div className="flex items-center gap-1 text-xs mt-1"><Star className="w-3 h-3 fill-warning text-warning"/>{earnings.rating} · 312 jobs</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center"><div className="text-lg font-bold">{earnings.acceptance}%</div><div className="text-[10px] text-muted-foreground uppercase">Accept</div></div>
            <div className="text-center"><div className="text-lg font-bold">98%</div><div className="text-[10px] text-muted-foreground uppercase">On-time</div></div>
            <div className="text-center"><div className="text-lg font-bold">2m</div><div className="text-[10px] text-muted-foreground uppercase">Response</div></div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 fade-up" style={{ animationDelay: "60ms" }}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Skills</div>
          <div className="flex flex-wrap gap-2">
            {["TV mounting","Drywall","Electrical","Furniture","Smart home","Plumbing basics"].map(s => (
              <span key={s} className="text-xs glass-strong px-3 py-1.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl divide-y divide-white/5">
          {[
            { icon: Wrench, label: "Service categories", sub: "6 active" },
            { icon: Clock, label: "Availability", sub: "Mon–Sat · 8am–8pm" },
            { icon: Shield, label: "Verifications", sub: "ID, BG check, Insurance" },
            { icon: FileText, label: "Tax & payout" },
          ].map(it => {
            const Icon = it.icon;
            return (
              <button key={it.label} className="w-full flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-secondary grid place-items-center"><Icon className="w-4 h-4 text-primary"/></div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{it.label}</div>
                  {it.sub && <div className="text-xs text-muted-foreground">{it.sub}</div>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground"/>
              </button>
            );
          })}
        </div>

        <button className="w-full glass rounded-2xl py-3.5 flex items-center justify-center gap-2 text-destructive text-sm font-medium">
          <LogOut className="w-4 h-4"/>Sign out
        </button>
      </div>
    </MobileShell>
  );
}
