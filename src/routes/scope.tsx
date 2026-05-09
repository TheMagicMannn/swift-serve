import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { ArrowLeft, Sparkles, Check, Clock, Wrench, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { scopeJob, createJob, type AiScope } from "@/lib/jobs.functions";
import { dispatchOffers } from "@/lib/dispatch.functions";
import { toast } from "sonner";
import { z } from "zod";

const Search = z.object({
  desc: z.string().default(""),
  address: z.string().default(""),
  urgency: z.enum(["standard", "urgent", "emergency"]).default("standard"),
  media: z.string().default(""),
});

export const Route = createFileRoute("/scope")({
  component: Scope,
  validateSearch: (s) => Search.parse(s),
});

function Scope() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const scope = useServerFn(scopeJob);
  const create = useServerFn(createJob);
  const [aiScope, setAiScope] = useState<AiScope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mediaPaths = search.media ? search.media.split(",").filter(Boolean) : [];

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const result = await scope({
          data: {
            description: search.desc,
            address: search.address,
            urgency: search.urgency,
            media_paths: mediaPaths,
          },
        });
        if (!cancel) setAiScope(result);
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : "Failed to scope job");
      }
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = async () => {
    if (!aiScope) return;
    setSubmitting(true);
    try {
      const { id } = await create({
        data: {
          description: search.desc,
          address: search.address,
          urgency: search.urgency,
          media_paths: mediaPaths,
          scope: aiScope,
        },
      });
      toast.success("Job dispatched");
      nav({ to: "/dispatch", search: { id } as never });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to dispatch");
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <MobileShell hideNav>
        <StatusBar title="Scoping failed" back={<Link to="/create" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>
        <div className="px-5 pt-10 text-center">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto"/>
          <p className="mt-4 text-sm text-muted-foreground">{error}</p>
          <Link to="/create" className="inline-block mt-6 px-5 py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold">Edit request</Link>
        </div>
      </MobileShell>
    );
  }

  if (!aiScope) {
    return (
      <MobileShell hideNav>
        <StatusBar back={<Link to="/create" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>
        <div className="px-5 pt-20 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full gradient-primary grid place-items-center shadow-glow pulse-ring">
            <Sparkles className="w-10 h-10 text-primary-foreground"/>
          </div>
          <h2 className="mt-8 text-xl font-semibold">Scoping your job…</h2>
          <p className="text-sm text-muted-foreground mt-2 text-balance">Analyzing photos, classifying task, estimating effort and price.</p>
          <div className="mt-8 w-full space-y-2">
            {["Identifying task type", "Reading photos & context", "Estimating effort & materials", "Calculating fair price"].map((s, i) => (
              <div key={s} className="glass rounded-xl px-4 py-3 flex items-center gap-3 fade-up" style={{ animationDelay: `${i * 200}ms` }}>
                <Loader2 className="w-4 h-4 animate-spin text-primary"/>
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    );
  }

  const total = aiScope.labor_cents + aiScope.platform_cents + aiScope.materials_cents;
  const fmt = (c: number) => `$${(c / 100).toFixed(0)}`;
  const conf = Math.round(aiScope.confidence * 100);

  return (
    <MobileShell hideNav>
      <StatusBar title="AI work order" back={<Link to="/create" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>
      <div className="px-5 pt-4 space-y-4 pb-32">
        <div className="glass-strong rounded-3xl p-5 fade-up">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-success font-semibold uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/>{conf >= 80 ? "High" : conf >= 60 ? "Medium" : "Low"} confidence</div>
              <h2 className="text-xl font-semibold mt-1 truncate">{aiScope.title}</h2>
              <div className="text-sm text-muted-foreground mt-0.5 truncate">{aiScope.category}</div>
            </div>
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary"/>
                <circle cx="18" cy="18" r="15" fill="none" stroke="url(#g)" strokeWidth="3" strokeDasharray={`${conf} 100`} strokeLinecap="round"/>
                <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="oklch(0.62 0.22 275)"/><stop offset="1" stopColor="oklch(0.72 0.20 290)"/></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-sm font-bold">{conf}%</div>
            </div>
          </div>
        </div>

        <div className="gradient-card rounded-3xl p-5 shadow-card fade-up" style={{ animationDelay: "60ms" }}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fixed price</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold">{fmt(total)}</span>
            <span className="text-sm text-muted-foreground">all-in</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div><div className="text-muted-foreground">Labor</div><div className="font-semibold mt-0.5">{fmt(aiScope.labor_cents)}</div></div>
            <div><div className="text-muted-foreground">Platform</div><div className="font-semibold mt-0.5">{fmt(aiScope.platform_cents)}</div></div>
            <div><div className="text-muted-foreground">Materials</div><div className="font-semibold mt-0.5">{fmt(aiScope.materials_cents)}</div></div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 fade-up" style={{ animationDelay: "120ms" }}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Included</div>
          <ul className="space-y-2.5">
            {aiScope.tasks.map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full bg-success/20 grid place-items-center mt-0.5 shrink-0"><Check className="w-3 h-3 text-success"/></div>
                {s}
              </li>
            ))}
          </ul>
          {aiScope.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-white/5">{aiScope.notes}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2 fade-up" style={{ animationDelay: "180ms" }}>
          <div className="glass rounded-2xl p-3 text-center"><Clock className="w-4 h-4 mx-auto text-primary mb-1"/><div className="text-[10px] text-muted-foreground">Duration</div><div className="text-sm font-semibold">{aiScope.duration_minutes}m</div></div>
          <div className="glass rounded-2xl p-3 text-center"><Wrench className="w-4 h-4 mx-auto text-primary mb-1"/><div className="text-[10px] text-muted-foreground">Skill</div><div className="text-sm font-semibold capitalize">{aiScope.skill}</div></div>
          <div className="glass rounded-2xl p-3 text-center"><AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${aiScope.risk === "high" ? "text-destructive" : aiScope.risk === "medium" ? "text-warning" : "text-success"}`}/><div className="text-[10px] text-muted-foreground">Risk</div><div className="text-sm font-semibold capitalize">{aiScope.risk}</div></div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 glass-strong">
        <div className="flex gap-2">
          <Link to="/create" className="px-5 py-4 rounded-2xl bg-secondary font-medium">Edit</Link>
          <button onClick={dispatch} disabled={submitting} className="flex-1 gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin"/>}
            Dispatch · {fmt(total)}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
