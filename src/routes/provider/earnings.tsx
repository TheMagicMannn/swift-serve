import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { earnings } from "@/lib/mock";
import { TrendingUp, Zap } from "lucide-react";

export const Route = createFileRoute("/provider/earnings")({ component: Earnings });

const week = [
  { d: "M", v: 320 }, { d: "T", v: 480 }, { d: "W", v: 290 },
  { d: "T", v: 540 }, { d: "F", v: 720 }, { d: "S", v: 490 }, { d: "S", v: 412 },
];
const max = Math.max(...week.map(w => w.v));

function Earnings() {
  return (
    <MobileShell>
      <StatusBar title="Earnings" />
      <div className="px-5 pt-4 space-y-5">
        <div className="gradient-card rounded-3xl p-6 border border-white/5 shadow-card fade-up">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">This week</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold">${earnings.week.toLocaleString()}</span>
            <span className="text-success text-xs font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/>+18%</span>
          </div>

          {/* Bar chart */}
          <div className="mt-6 flex items-end gap-2 h-32">
            {week.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-lg gradient-primary shadow-glow" style={{ height: `${(w.v/max) * 100}%` }}/>
                <div className="text-[10px] text-muted-foreground">{w.d}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow flex items-center justify-center gap-2">
          <Zap className="w-5 h-5"/>Cash out ${earnings.pending}
        </button>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent payouts</h2>
          <div className="space-y-2">
            {[
              { t: "TV mount · Marcus", v: 110, d: "Today" },
              { t: "Sink repair · Diane", v: 165, d: "Today" },
              { t: "Wardrobe assembly", v: 95, d: "Yesterday" },
              { t: "Cabinet install", v: 280, d: "Mon" },
            ].map((x, i) => (
              <div key={i} className="glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{x.t}</div>
                  <div className="text-xs text-muted-foreground">{x.d}</div>
                </div>
                <div className="font-semibold text-success">+${x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
