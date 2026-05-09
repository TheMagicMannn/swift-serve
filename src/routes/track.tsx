import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Phone, MessageSquare, Star, Shield, Clock, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";
import { useServerFn } from "@tanstack/react-start";
import { updateJobStatus } from "@/lib/dispatch.functions";
import { toast } from "sonner";

const Search = z.object({ id: z.string().uuid().optional() });
export const Route = createFileRoute("/track")({
  component: Track,
  validateSearch: (s) => Search.parse(s),
});

type Job = {
  id: string;
  status: string;
  customer_id: string;
  provider_id: string | null;
  scope_title: string | null;
  price_cents: number | null;
  address: string;
};

const STAGES: { key: string; label: string }[] = [
  { key: "dispatching", label: "Dispatched" },
  { key: "assigned", label: "Accepted" },
  { key: "en_route", label: "En route" },
  { key: "arrived", label: "Arrived" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

function Track() {
  const { id } = Route.useSearch();
  const { user } = useApp();
  const nav = useNavigate();
  const updateStatus = useServerFn(updateJobStatus);
  const [job, setJob] = useState<Job | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
    setJob(data as Job | null);
    if (data?.provider_id) {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.provider_id).maybeSingle();
      setProviderName(p?.full_name ?? null);
    }
  }, [id]);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    load().finally(() => setLoading(false));
    const ch = supabase
      .channel(`track_${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load]);

  const isProvider = job?.provider_id && user?.id === job.provider_id;
  const stageIdx = job ? STAGES.findIndex((s) => s.key === job.status) : -1;
  const fmt = (c: number | null) => c ? `$${(c/100).toFixed(0)}` : "—";

  const advance = async (next: "en_route" | "arrived" | "in_progress" | "completed") => {
    if (!job) return;
    try {
      await updateStatus({ data: { job_id: job.id, status: next } });
      toast.success(`Marked ${next.replace("_"," ")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const cancel = async () => {
    if (!job) return;
    if (!confirm("Cancel this job?")) return;
    try {
      await updateStatus({ data: { job_id: job.id, status: "cancelled" } });
      nav({ to: "/jobs" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    }
  };

  if (loading) {
    return <MobileShell><div className="grid place-items-center h-screen text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin"/></div></MobileShell>;
  }
  if (!job) {
    return <MobileShell><div className="px-5 pt-20 text-center text-muted-foreground">Job not found.</div></MobileShell>;
  }

  const initials = (providerName ?? "··").split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
  const nextAction = (() => {
    if (job.status === "assigned") return { label: "Start trip", next: "en_route" as const };
    if (job.status === "en_route") return { label: "I've arrived", next: "arrived" as const };
    if (job.status === "arrived") return { label: "Start work", next: "in_progress" as const };
    if (job.status === "in_progress") return { label: "Mark complete", next: "completed" as const };
    return null;
  })();

  return (
    <MobileShell>
      <div className="relative h-[45vh] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 30% 40%, oklch(0.30 0.10 275 / 0.6), transparent 50%), radial-gradient(circle at 70% 70%, oklch(0.25 0.08 290 / 0.4), transparent 50%), oklch(0.10 0.04 270)",
        }}>
          <svg className="w-full h-full opacity-30" viewBox="0 0 400 400">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.5 0.1 275)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
            <path d="M 0 200 Q 150 180 200 220 T 400 200" stroke="oklch(0.62 0.22 275)" strokeWidth="3" fill="none" strokeDasharray="8 4"/>
          </svg>
          <div className="absolute top-[35%] left-[28%]">
            <div className="relative">
              <div className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-xs font-bold text-primary-foreground shadow-glow border-2 border-white">{initials}</div>
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping"/>
            </div>
          </div>
          <div className="absolute bottom-[25%] right-[25%]">
            <div className="w-10 h-10 rounded-full gradient-success grid place-items-center text-lg shadow-glow border-2 border-white">🏠</div>
          </div>
        </div>
        <div className="absolute top-12 left-5 right-5 flex justify-between">
          <Link to={isProvider ? "/provider/dashboard" : "/jobs"} className="w-10 h-10 glass-strong rounded-full grid place-items-center">←</Link>
          <div className="glass-strong rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold capitalize"><Clock className="w-4 h-4 text-primary"/>{job.status.replace("_"," ")}</div>
        </div>
      </div>

      <div className="-mt-8 relative bg-background rounded-t-3xl border-t border-white/5 px-5 pt-5 pb-6">
        <div className="w-12 h-1 rounded-full bg-white/15 mx-auto mb-5"/>

        {job.provider_id && (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full gradient-primary grid place-items-center font-semibold text-primary-foreground shadow-glow">{initials}</div>
            <div className="flex-1">
              <div className="font-semibold">{providerName ?? "Provider"}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-warning text-warning"/>5.0
                <span className="flex items-center gap-0.5 text-success"><Shield className="w-3 h-3"/>Verified</span>
              </div>
            </div>
            <Link to="/chat" search={{ id: job.id } as never} className="w-10 h-10 rounded-full bg-secondary grid place-items-center"><MessageSquare className="w-4 h-4"/></Link>
            <button className="w-10 h-10 rounded-full bg-secondary grid place-items-center"><Phone className="w-4 h-4"/></button>
          </div>
        )}

        <div className="mt-5 glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-[10px] font-medium">
            {STAGES.map((s, i) => {
              const done = i <= stageIdx;
              const active = i === stageIdx;
              return (
                <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5 relative">
                  {i > 0 && <div className={`absolute right-1/2 top-2 w-full h-0.5 ${done ? "bg-primary" : "bg-white/10"}`}/>}
                  <div className={`relative w-4 h-4 rounded-full ${done ? "gradient-primary shadow-glow" : "bg-white/15"} ${active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}/>
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 gradient-card rounded-2xl p-4 border border-white/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Job</div>
          <div className="font-semibold mt-1">{job.scope_title ?? "Job"}</div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">{job.address}</div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-muted-foreground">{isProvider ? "Payout" : "Fixed price"}</span>
            <span className="font-bold">{fmt(job.price_cents)}</span>
          </div>
        </div>

        {isProvider && nextAction && (
          <button
            onClick={() => advance(nextAction.next)}
            className="mt-4 w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow"
          >
            {nextAction.label}
          </button>
        )}

        {!isProvider && job.status !== "completed" && job.status !== "cancelled" && (
          <button onClick={cancel} className="mt-3 w-full text-sm text-destructive py-3">Cancel job</button>
        )}
      </div>
    </MobileShell>
  );
}
