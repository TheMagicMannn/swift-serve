import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { ArrowLeft, Sparkles, Check, Clock, Wrench, AlertTriangle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/scope")({ component: Scope });

function Scope() {
  const nav = useNavigate();
  const [analyzing, setAnalyzing] = useState(true);
  useEffect(() => { const t = setTimeout(() => setAnalyzing(false), 1800); return () => clearTimeout(t); }, []);

  if (analyzing) {
    return (
      <MobileShell hideNav>
        <StatusBar back={<Link to="/create" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>
        <div className="px-5 pt-20 flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full gradient-primary grid place-items-center shadow-glow pulse-ring relative">
              <Sparkles className="w-10 h-10 text-primary-foreground"/>
            </div>
          </div>
          <h2 className="mt-8 text-xl font-semibold">Scoping your job…</h2>
          <p className="text-sm text-muted-foreground mt-2 text-balance">Analyzing photos, classifying task, estimating effort and price.</p>
          <div className="mt-8 w-full space-y-2">
            {["Identifying task type", "Reading photos & context", "Estimating effort & materials", "Calculating fair price"].map((s, i) => (
              <div key={s} className="glass rounded-xl px-4 py-3 flex items-center gap-3 fade-up" style={{ animationDelay: `${i * 200}ms` }}>
                <div className="w-5 h-5 rounded-full gradient-success grid place-items-center"><Check className="w-3 h-3 text-white"/></div>
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell hideNav>
      <StatusBar title="AI work order" back={<Link to="/create" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>
      <div className="px-5 pt-4 space-y-4 pb-32">
        {/* Confidence */}
        <div className="glass-strong rounded-3xl p-5 fade-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-success font-semibold uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/>High confidence</div>
              <h2 className="text-xl font-semibold mt-1">65" TV mount on drywall</h2>
              <div className="text-sm text-muted-foreground mt-0.5">Handyman · TV mounting specialist</div>
            </div>
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary"/>
                <circle cx="18" cy="18" r="15" fill="none" stroke="url(#g)" strokeWidth="3" strokeDasharray="94" strokeLinecap="round"/>
                <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="oklch(0.62 0.22 275)"/><stop offset="1" stopColor="oklch(0.72 0.20 290)"/></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-sm font-bold">94%</div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="gradient-card rounded-3xl p-5 shadow-card fade-up" style={{ animationDelay: "60ms" }}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fixed price</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold">$135</span>
            <span className="text-sm text-muted-foreground">all-in</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div><div className="text-muted-foreground">Labor</div><div className="font-semibold mt-0.5">$110</div></div>
            <div><div className="text-muted-foreground">Platform</div><div className="font-semibold mt-0.5">$15</div></div>
            <div><div className="text-muted-foreground">Materials</div><div className="font-semibold mt-0.5">$10</div></div>
          </div>
        </div>

        {/* Scope */}
        <div className="glass rounded-3xl p-5 fade-up" style={{ animationDelay: "120ms" }}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Included</div>
          <ul className="space-y-2.5">
            {["Stud finding & wall assessment", "Mount installation on drywall", "TV attachment & leveling", "Cable concealment (basic)", "Cleanup & test power"].map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full bg-success/20 grid place-items-center mt-0.5"><Check className="w-3 h-3 text-success"/></div>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-2 fade-up" style={{ animationDelay: "180ms" }}>
          <div className="glass rounded-2xl p-3 text-center"><Clock className="w-4 h-4 mx-auto text-primary mb-1"/><div className="text-[10px] text-muted-foreground">Duration</div><div className="text-sm font-semibold">60–90m</div></div>
          <div className="glass rounded-2xl p-3 text-center"><Wrench className="w-4 h-4 mx-auto text-primary mb-1"/><div className="text-[10px] text-muted-foreground">Skill</div><div className="text-sm font-semibold">Pro</div></div>
          <div className="glass rounded-2xl p-3 text-center"><AlertTriangle className="w-4 h-4 mx-auto text-warning mb-1"/><div className="text-[10px] text-muted-foreground">Risk</div><div className="text-sm font-semibold">Low</div></div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 glass-strong">
        <div className="flex gap-2">
          <button className="px-5 py-4 rounded-2xl bg-secondary font-medium">Edit</button>
          <button onClick={() => nav({ to: "/dispatch" })} className="flex-1 gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow">
            Dispatch · $135
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
