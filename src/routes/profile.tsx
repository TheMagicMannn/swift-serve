import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { RoleSwitch } from "@/components/RoleSwitch";
import { ChevronRight, MapPin, CreditCard, Bell, Shield, HelpCircle, Star, Settings, LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: Profile });

const items = [
  { icon: MapPin, label: "Saved addresses", sub: "3 places" },
  { icon: CreditCard, label: "Payment methods", sub: "Visa ••4242" },
  { icon: Bell, label: "Notifications" },
  { icon: Shield, label: "Privacy & safety" },
  { icon: Settings, label: "Preferences" },
  { icon: HelpCircle, label: "Help & support" },
];

function Profile() {
  return (
    <MobileShell>
      <StatusBar title="Profile" action={<RoleSwitch/>} />
      <div className="px-5 pt-4">
        <div className="glass-strong rounded-3xl p-5 flex items-center gap-4 shadow-card">
          <div className="w-16 h-16 rounded-full gradient-primary grid place-items-center text-xl font-semibold text-primary-foreground shadow-glow">A</div>
          <div className="flex-1">
            <div className="font-semibold text-lg">Alex Morgan</div>
            <div className="text-xs text-muted-foreground">alex@morgan.co · 12 jobs</div>
            <div className="flex items-center gap-1 text-xs mt-1"><Star className="w-3 h-3 fill-warning text-warning"/>4.9 customer rating</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[{l:"Jobs",v:12},{l:"Saved Pros",v:4},{l:"Subs",v:1}].map(s => (
            <div key={s.l} className="glass rounded-2xl p-3 text-center">
              <div className="text-xl font-bold">{s.v}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 glass rounded-2xl divide-y divide-white/5">
          {items.map((it) => {
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

        <button className="mt-5 w-full glass rounded-2xl py-3.5 flex items-center justify-center gap-2 text-destructive text-sm font-medium">
          <LogOut className="w-4 h-4"/>Sign out
        </button>
      </div>
    </MobileShell>
  );
}
