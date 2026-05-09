import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { ArrowLeft, MapPin, Clock, Wrench, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { acceptJobOffer, declineJobOffer } from "@/lib/dispatch.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Search = z.object({ id: z.string().uuid().optional() });
export const Route = createFileRoute("/provider/offer")({
  component: Offer,
  validateSearch: (s) => Search.parse(s),
});

type OfferData = {
  id: string;
  job_id: string;
  match_score: number;
  eta_minutes: number | null;
  status: string;
  expires_at: string;
  jobs: {
    id: string;
    scope_title: string | null;
    scope_category: string | null;
    scope_tasks: string[] | null;
    scope_duration_minutes: number | null;
    scope_risk: string | null;
    description: string;
    address: string;
    price_cents: number | null;
    urgency: string;
  } | null;
};

function Offer() {
  const { id } = Route.useSearch();
  const nav = useNavigate();
  const accept = useServerFn(acceptJobOffer);
  const decline = useServerFn(declineJobOffer);
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("*, jobs:job_id(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) toast.error(error.message);
      setOffer(data as OfferData | null);
      setLoading(false);
    })();
  }, [id]);

  const onAccept = async () => {
    if (!offer || busy) return;
    setBusy(true);
    try {
      await accept({ data: { offer_id: offer.id } });
      toast.success("Job accepted");
      nav({ to: "/track", search: { id: offer.job_id } as never });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept");
      setBusy(false);
    }
  };
  const onDecline = async () => {
    if (!offer || busy) return;
    setBusy(true);
    try {
      await decline({ data: { offer_id: offer.id } });
      nav({ to: "/provider/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not decline");
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <MobileShell hideNav>
        <StatusBar title="Job offer" back={<Link to="/provider/dashboard" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>
        <div className="grid place-items-center pt-20 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin"/></div>
      </MobileShell>
    );
  }

  if (!offer || !offer.jobs) {
    return (
      <MobileShell hideNav>
        <StatusBar title="Job offer" back={<Link to="/provider/dashboard" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>
        <div className="px-5 pt-10 text-center text-sm text-muted-foreground">Offer not found or expired.</div>
      </MobileShell>
    );
  }

  const j = offer.jobs;
  const fmt = (c: number | null) => c ? `$${(c/100).toFixed(0)}` : "—";

  return (
    <MobileShell hideNav>
      <StatusBar title="Job offer" back={<Link to="/provider/dashboard" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>

      <div className="px-5 pt-4 pb-32 space-y-4">
        <div className="glass-strong rounded-3xl p-5 fade-up">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full">{j.scope_category ?? "Job"}</span>
            <span className="text-xs text-muted-foreground">{offer.match_score}% match</span>
          </div>
          <h2 className="text-xl font-semibold mt-3">{j.scope_title ?? "Job"}</h2>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-bold">{fmt(j.price_cents)}</span>
            <span className="text-sm text-muted-foreground">payout</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 fade-up" style={{ animationDelay: "60ms" }}>
          <div className="glass rounded-2xl p-3 text-center"><MapPin className="w-4 h-4 mx-auto text-primary mb-1"/><div className="text-[10px] text-muted-foreground">Address</div><div className="text-xs font-semibold truncate">{j.address.split(",")[0]}</div></div>
          <div className="glass rounded-2xl p-3 text-center"><Clock className="w-4 h-4 mx-auto text-primary mb-1"/><div className="text-[10px] text-muted-foreground">Duration</div><div className="text-sm font-semibold">{j.scope_duration_minutes ?? "—"}m</div></div>
          <div className="glass rounded-2xl p-3 text-center"><AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${j.scope_risk === "high" ? "text-destructive" : j.scope_risk === "medium" ? "text-warning" : "text-success"}`}/><div className="text-[10px] text-muted-foreground">Risk</div><div className="text-sm font-semibold capitalize">{j.scope_risk ?? "—"}</div></div>
        </div>

        {j.scope_tasks && j.scope_tasks.length > 0 && (
          <div className="glass rounded-3xl p-5 fade-up" style={{ animationDelay: "120ms" }}>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5"><Wrench className="w-3 h-3"/>Scope</div>
            <ul className="space-y-2 text-sm">
              {j.scope_tasks.map((s) => (
                <li key={s} className="flex gap-2"><Check className="w-4 h-4 text-success mt-0.5 shrink-0"/>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="glass rounded-3xl p-5 fade-up" style={{ animationDelay: "180ms" }}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Customer note</div>
          <p className="text-sm">{j.description}</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 glass-strong">
        <div className="flex gap-2">
          <button onClick={onDecline} disabled={busy} className="px-5 py-4 rounded-2xl bg-secondary font-medium disabled:opacity-50">Decline</button>
          <button onClick={onAccept} disabled={busy} className="flex-1 gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin"/>}
            Accept · {fmt(j.price_cents)}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
