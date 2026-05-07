import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { recentJobs } from "@/lib/mock";
import { Star } from "lucide-react";

export const Route = createFileRoute("/jobs")({ component: Jobs });

const statusColor: Record<string, string> = {
  matched: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  in_progress: "bg-warning/20 text-warning",
};

function Jobs() {
  return (
    <MobileShell>
      <StatusBar title="Your jobs" />
      <div className="px-5 pt-4">
        <div className="flex gap-2 mb-4">
          {["All", "Active", "Completed", "Drafts"].map((t, i) => (
            <button key={t} className={`px-4 py-1.5 rounded-full text-sm font-medium ${i === 0 ? "gradient-primary text-primary-foreground shadow-glow" : "glass text-muted-foreground"}`}>{t}</button>
          ))}
        </div>

        <div className="space-y-3">
          {recentJobs.map((j) => (
            <Link to="/track" key={j.id} className="block glass-strong rounded-2xl p-4 fade-up">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor[j.status] || "bg-secondary"}`}>{j.status.replace("_"," ")}</span>
                <span className="text-sm font-bold">${j.fixedPrice}</span>
              </div>
              <div className="font-semibold mt-2">{j.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{j.address} · {j.duration}</div>
              {j.provider && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full gradient-primary grid place-items-center text-[10px] font-semibold text-primary-foreground">{j.provider.avatar}</div>
                  <span className="text-sm">{j.provider.name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-auto"><Star className="w-3 h-3 fill-warning text-warning"/>{j.provider.rating}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
