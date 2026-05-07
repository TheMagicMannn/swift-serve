import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { ArrowLeft, Star, MapPin, Clock, Wrench, Check, Shield, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/provider/offer")({ component: Offer });

function Offer() {
  const nav = useNavigate();
  return (
    <MobileShell hideNav>
      <StatusBar title="Job offer" back={<Link to="/provider/dashboard" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>

      <div className="px-5 pt-4 pb-32 space-y-4">
        <div className="glass-strong rounded-3xl p-5 fade-up">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full">Electrical</span>
            <span className="text-xs text-success font-medium flex items-center gap-1"><Shield className="w-3 h-3"/>Repeat customer</span>
          </div>
          <h2 className="text-xl font-semibold mt-3">Ceiling fan replacement</h2>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-bold">$165</span>
            <span className="text-sm text-muted-foreground">payout</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 fade-up" style={{ animationDelay: "60ms" }}>
          <div className="glass rounded-2xl p-3 text-center"><MapPin className="w-4 h-4 mx-auto text-primary mb-1"/><div className="text-[10px] text-muted-foreground">Distance</div><div className="text-sm font-semibold">2.1 mi</div></div>
          <div className="glass rounded-2xl p-3 text-center"><Clock className="w-4 h-4 mx-auto text-primary mb-1"/><div className="text-[10px] text-muted-foreground">Duration</div><div className="text-sm font-semibold">60 min</div></div>
          <div className="glass rounded-2xl p-3 text-center"><AlertTriangle className="w-4 h-4 mx-auto text-warning mb-1"/><div className="text-[10px] text-muted-foreground">Risk</div><div className="text-sm font-semibold">Low</div></div>
        </div>

        <div className="glass rounded-3xl p-5 fade-up" style={{ animationDelay: "120ms" }}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">AI-generated scope</div>
          <ul className="space-y-2 text-sm">
            {["Remove existing ceiling light fixture", "Install Hunter ceiling fan (provided)", "Test wiring & switch operation", "Mount remote receiver", "Cleanup"].map((s) => (
              <li key={s} className="flex gap-2"><Check className="w-4 h-4 text-success mt-0.5"/>{s}</li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-3xl p-5 fade-up" style={{ animationDelay: "180ms" }}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Customer</div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full gradient-primary grid place-items-center font-semibold text-primary-foreground">RP</div>
            <div className="flex-1">
              <div className="font-medium">Rachel P.</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning"/>4.98 · 8 prior jobs</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-muted-foreground">
            "Fan box already installed, just need swap. Garage parking available."
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 glass-strong">
        <div className="flex gap-2">
          <button onClick={() => nav({ to: "/provider/dashboard" })} className="px-5 py-4 rounded-2xl bg-secondary font-medium">Decline</button>
          <button onClick={() => nav({ to: "/provider/dashboard" })} className="flex-1 gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow">
            Accept · $165
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
