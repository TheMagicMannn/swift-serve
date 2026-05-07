import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";

export const Route = createFileRoute("/provider/schedule")({ component: Schedule });

const days = ["M","T","W","T","F","S","S"];
const slots = [
  { time: "9:00", title: "TV mount · Pacific Heights", price: 135, color: "primary" },
  { time: "11:30", title: "Garbage disposal · Mission", price: 180, color: "primary" },
  { time: "2:00", title: "Emergency · Burst pipe", price: 320, color: "emergency" },
  { time: "5:00", title: "Furniture assembly · SOMA", price: 110, color: "primary" },
];

function Schedule() {
  return (
    <MobileShell>
      <StatusBar title="Schedule" />
      <div className="px-5 pt-4">
        <div className="glass-strong rounded-3xl p-4 flex justify-between">
          {days.map((d, i) => (
            <button key={i} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl ${i === 2 ? "gradient-primary text-primary-foreground shadow-glow" : ""}`}>
              <span className="text-[10px] uppercase opacity-70">{d}</span>
              <span className="text-base font-bold">{12 + i}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today · 4 jobs · $745</div>

        <div className="space-y-3">
          {slots.map((s, i) => (
            <div key={i} className="flex gap-3 fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="text-xs text-muted-foreground font-mono w-12 pt-3">{s.time}</div>
              <div className={`flex-1 rounded-2xl p-4 border border-white/5 ${s.color === "emergency" ? "gradient-emergency text-white" : "glass-strong"}`}>
                <div className="font-medium text-sm">{s.title}</div>
                <div className={`text-xs mt-1 ${s.color === "emergency" ? "text-white/80" : "text-muted-foreground"}`}>${s.price} payout</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
