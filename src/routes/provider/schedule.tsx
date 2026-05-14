import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { Loader2, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/provider/schedule")({ component: Schedule });

type ScheduleJob = {
  id: string;
  status: string;
  scope_title: string | null;
  address: string;
  price_cents: number | null;
  urgency: string;
  updated_at: string;
};

const ACTIVE = ["assigned", "en_route", "arrived", "in_progress"];

function Schedule() {
  const { user } = useApp();
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("jobs")
      .select("id, status, scope_title, address, price_cents, urgency, updated_at")
      .eq("provider_id", user.id)
      .in("status", ACTIVE)
      .order("updated_at", { ascending: true })
      .then(({ data }) => {
        setJobs((data ?? []) as ScheduleJob[]);
        setLoading(false);
      });
  }, [user]);

  const total = jobs.reduce((s, j) => s + (j.price_cents ?? 0), 0);

  return (
    <MobileShell>
      <StatusBar title="Schedule" />
      <div className="px-5 pt-4 pb-8">
        <div className="glass-strong rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center shadow-glow">
            <Calendar className="w-5 h-5 text-primary-foreground"/>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Today</div>
            <div className="font-semibold">{jobs.length} active · ${(total/100).toFixed(0)}</div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
        ) : jobs.length === 0 ? (
          <div className="mt-6 glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No assigned jobs. Go online from the dashboard to receive offers.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {jobs.map((j) => {
              const emergency = j.urgency === "emergency";
              return (
                <Link
                  key={j.id}
                  to="/track"
                  search={{ id: j.id } as never}
                  className={`block rounded-2xl p-4 border border-white/5 fade-up ${emergency ? "gradient-emergency text-white" : "glass-strong"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${emergency ? "" : "text-muted-foreground"}`}>{j.status.replace("_", " ")}</span>
                    <span className="text-sm font-bold">${((j.price_cents ?? 0)/100).toFixed(0)}</span>
                  </div>
                  <div className="font-medium text-sm mt-1.5 truncate">{j.scope_title ?? "Job"}</div>
                  <div className={`text-xs mt-0.5 truncate ${emergency ? "text-white/80" : "text-muted-foreground"}`}>{j.address}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
