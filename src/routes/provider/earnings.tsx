import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/provider/earnings")({ component: Earnings });

type CompletedJob = {
  id: string;
  scope_title: string | null;
  labor_cents: number | null;
  price_cents: number | null;
  updated_at: string;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function Earnings() {
  const { user } = useApp();
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("jobs")
      .select("id, scope_title, labor_cents, price_cents, updated_at")
      .eq("provider_id", user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setJobs((data ?? []) as CompletedJob[]);
        setLoading(false);
      });
  }, [user]);

  const now = new Date();
  const weekStart = startOfDay(new Date(now.getTime() - 6 * 86400000));
  const weekJobs = jobs.filter((j) => new Date(j.updated_at) >= weekStart);
  const weekCents = weekJobs.reduce((s, j) => s + (j.labor_cents ?? j.price_cents ?? 0), 0);

  // Build per-day totals for last 7 days
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000);
    const day = startOfDay(d).getTime();
    const cents = weekJobs
      .filter((j) => startOfDay(new Date(j.updated_at)).getTime() === day)
      .reduce((s, j) => s + (j.labor_cents ?? j.price_cents ?? 0), 0);
    return { d: DAY_LABELS[d.getDay()], v: cents };
  });
  const max = Math.max(1, ...week.map((w) => w.v));

  const fmt = (c: number) => `$${(c / 100).toFixed(0)}`;

  return (
    <MobileShell>
      <StatusBar title="Earnings" />
      <div className="px-5 pt-4 space-y-5 pb-8">
        <div className="gradient-card rounded-3xl p-6 border border-white/5 shadow-card fade-up">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">This week</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold">{fmt(weekCents)}</span>
            <span className="text-success text-xs font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/>{weekJobs.length} jobs</span>
          </div>

          <div className="mt-6 flex items-end gap-2 h-32">
            {week.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg gradient-primary shadow-glow transition-all"
                  style={{ height: `${Math.max(2, (w.v / max) * 100)}%` }}
                />
                <div className="text-[10px] text-muted-foreground">{w.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent payouts</h2>
          {loading ? (
            <div className="py-10 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
          ) : jobs.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No completed jobs yet.</div>
          ) : (
            <div className="space-y-2">
              {jobs.slice(0, 10).map((j) => (
                <div key={j.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{j.scope_title ?? "Job"}</div>
                    <div className="text-xs text-muted-foreground">{new Date(j.updated_at).toLocaleDateString()}</div>
                  </div>
                  <div className="font-semibold text-success">+{fmt(j.labor_cents ?? j.price_cents ?? 0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
