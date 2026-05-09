import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { ArrowLeft, Star, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { getJobOffersForJob } from "@/lib/dispatch.functions";
import { supabase } from "@/integrations/supabase/client";

const Search = z.object({ id: z.string().uuid().optional() });
export const Route = createFileRoute("/dispatch")({
  component: Dispatch,
  validateSearch: (s) => Search.parse(s),
});

type OfferRow = {
  id: string;
  job_id: string;
  provider_id: string;
  status: string;
  match_score: number;
  eta_minutes: number | null;
  profile: { full_name: string | null } | null;
  provider_profile?: { rating?: number; completed_count?: number } | null;
};

function initials(name: string | null | undefined) {
  if (!name) return "··";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function Dispatch() {
  const nav = useNavigate();
  const { id } = Route.useSearch();
  const fetchOffers = useServerFn(getJobOffersForJob);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [jobStatus, setJobStatus] = useState<string>("dispatching");

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    const load = async () => {
      try {
        const rows = await fetchOffers({ data: { job_id: id } });
        if (!cancel) setOffers(rows as OfferRow[]);
      } catch {/* ignore */}
    };
    load();
    const offersCh = supabase
      .channel(`job_offers_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_offers", filter: `job_id=eq.${id}` }, () => load())
      .subscribe();
    const jobCh = supabase
      .channel(`job_${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${id}` }, (payload) => {
        const ns = (payload.new as { status?: string }).status;
        if (ns) setJobStatus(ns);
        if (ns === "assigned") setTimeout(() => nav({ to: "/track", search: { id } as never }), 800);
      })
      .subscribe();
    return () => {
      cancel = true;
      supabase.removeChannel(offersCh);
      supabase.removeChannel(jobCh);
    };
  }, [id, fetchOffers, nav]);

  const accepted = offers.filter((o) => o.status === "accepted");
  const pending = offers.filter((o) => o.status === "pending");

  return (
    <MobileShell hideNav>
      <StatusBar title="Finding providers" back={<Link to="/jobs" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>

      <div className="px-5 pt-4 pb-32">
        <div className="relative h-48 grid place-items-center mb-4">
          <div className="absolute w-40 h-40 rounded-full border border-primary/20 animate-ping" style={{animationDuration:"3s"}}/>
          <div className="absolute w-28 h-28 rounded-full border border-primary/30 animate-ping" style={{animationDuration:"2.5s",animationDelay:"0.5s"}}/>
          <div className="w-16 h-16 rounded-full gradient-primary grid place-items-center shadow-glow text-2xl">📍</div>
        </div>

        <div className="text-center mb-4 fade-up">
          <div className="text-sm text-muted-foreground">{offers.length} nearby providers notified</div>
          <div className="text-2xl font-semibold mt-1">{accepted.length} accepted</div>
          {jobStatus === "assigned" && <div className="text-xs text-success mt-1">Assigned · opening tracker…</div>}
        </div>

        {offers.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            Searching for online providers nearby…
          </div>
        ) : (
          <div className="space-y-2.5">
            {[...accepted, ...pending].map((o) => {
              const name = o.profile?.full_name ?? "Provider";
              const rating = o.provider_profile?.rating ?? 5;
              const jobs = o.provider_profile?.completed_count ?? 0;
              return (
                <div key={o.id} className="glass-strong rounded-2xl p-4 flex items-center gap-3 fade-up">
                  <div className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-sm font-semibold text-primary-foreground shadow-glow">{initials(name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate">{name}</span>
                      {o.status === "accepted" && <span className="text-[10px] gradient-success text-white px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Check className="w-2.5 h-2.5"/>ACCEPTED</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-warning text-warning"/>{Number(rating).toFixed(2)}</span>
                      <span>·</span><span>{jobs} jobs</span>
                      {o.eta_minutes && (<><span>·</span><span>{o.eta_minutes} min</span></>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">match</div>
                    <div className="font-bold text-success">{o.match_score}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {accepted.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 glass-strong fade-up">
          <button onClick={() => nav({ to: "/track", search: { id } as never })} className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow">
            View tracker
          </button>
        </div>
      )}
    </MobileShell>
  );
}
