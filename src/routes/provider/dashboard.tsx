import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { RoleSwitch } from "@/components/RoleSwitch";
import { Star, Zap, MapPin, Clock, Wrench, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listJobOffersForProvider, getMyProviderProfile, upsertProviderProfile } from "@/lib/dispatch.functions";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/provider/dashboard")({ component: Dashboard });

type Offer = {
  id: string;
  job_id: string;
  match_score: number;
  eta_minutes: number | null;
  jobs: {
    id: string;
    scope_title: string | null;
    scope_category: string | null;
    address: string;
    urgency: string;
    price_cents: number | null;
    scope_duration_minutes: number | null;
  } | null;
};

function Dashboard() {
  const { user, profile } = useApp();
  const nav = useNavigate();
  const fetchOffers = useServerFn(listJobOffersForProvider);
  const fetchProvProfile = useServerFn(getMyProviderProfile);
  const updateProv = useServerFn(upsertProviderProfile);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pp, setPp] = useState<{ is_online: boolean; rating: number; completed_count: number; skills: string[] } | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = (await fetchOffers()) as unknown as Offer[];
      setOffers(rows);
    } catch {/* ignore */}
  }, [fetchOffers]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const p = await fetchProvProfile();
      setPp(p as typeof pp);
      await load();
      setLoading(false);
    })();

    const ch = supabase
      .channel(`offers_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_offers", filter: `provider_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchProvProfile, load]);

  const toggleOnline = async () => {
    if (!pp || toggling) return;
    setToggling(true);
    const next = !pp.is_online;
    try {
      await updateProv({ data: { is_online: next } });
      setPp({ ...pp, is_online: next });
    } finally { setToggling(false); }
  };

  const fmt$ = (c: number | null) => c ? `$${(c/100).toFixed(0)}` : "—";

  return (
    <MobileShell>
      <StatusBar title="Dispatch" action={<RoleSwitch/>} />
      <div className="px-5 pt-4 space-y-5">
        <button onClick={toggleOnline} className="w-full glass-strong rounded-3xl p-5 flex items-center justify-between fade-up text-left">
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${pp?.is_online ? "text-success" : "text-muted-foreground"}`}>
              <span className="relative flex w-2 h-2">
                {pp?.is_online && <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping"/>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${pp?.is_online ? "bg-success" : "bg-muted-foreground"}`}/>
              </span>
              {pp?.is_online ? "Online" : "Offline"}
            </div>
            <div className="font-semibold mt-1">{pp?.is_online ? "Accepting jobs" : "Tap to go online"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {pp?.skills?.length ? pp.skills.slice(0,3).join(" · ") : "Add skills in profile"}
            </div>
          </div>
          <div className={`relative w-14 h-7 rounded-full transition ${pp?.is_online ? "gradient-primary shadow-glow" : "bg-secondary"}`}>
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${pp?.is_online ? "right-0.5" : "left-0.5"}`}/>
          </div>
        </button>

        <div className="grid grid-cols-3 gap-2 fade-up" style={{ animationDelay: "60ms" }}>
          <div className="gradient-card rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-muted-foreground uppercase">Jobs done</div>
            <div className="text-lg font-bold mt-0.5">{pp?.completed_count ?? 0}</div>
          </div>
          <div className="gradient-card rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-muted-foreground uppercase">Rating</div>
            <div className="text-lg font-bold mt-0.5 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-warning text-warning"/>{pp?.rating?.toFixed(2) ?? "—"}</div>
          </div>
          <div className="gradient-card rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-muted-foreground uppercase">Open offers</div>
            <div className="text-lg font-bold mt-0.5">{offers.length}</div>
          </div>
        </div>

        <div className="fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">New offers</h2>
            {profile && <span className="text-xs text-muted-foreground">{profile.full_name}</span>}
          </div>

          {loading ? (
            <div className="py-10 grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin"/></div>
          ) : offers.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              {pp?.is_online ? "No offers right now. We'll notify you in real time." : "Go online to receive offers."}
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((o) => {
                const j = o.jobs;
                const emergency = j?.urgency === "emergency";
                return (
                  <button
                    key={o.id}
                    onClick={() => nav({ to: "/provider/offer", search: { id: o.id } as never })}
                    className={`block w-full text-left rounded-3xl p-5 shadow-card border border-white/5 fade-up ${emergency ? "gradient-emergency text-white" : "glass-strong"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {emergency ? (
                          <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Zap className="w-3 h-3"/>Emergency</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase bg-secondary text-foreground px-2 py-0.5 rounded-full">{j?.scope_category ?? "Job"}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fmt$(j?.price_cents ?? null)}</div>
                        <div className={`text-[10px] uppercase ${emergency ? "text-white/80" : "text-muted-foreground"}`}>payout</div>
                      </div>
                    </div>
                    <div className="font-semibold mt-2">{j?.scope_title ?? "Job"}</div>
                    <div className={`flex items-center gap-3 text-xs mt-3 flex-wrap ${emergency ? "text-white/90" : "text-muted-foreground"}`}>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{j?.address?.split(",")[0]}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{j?.scope_duration_minutes ?? "—"}m</span>
                      <span className="flex items-center gap-1"><Wrench className="w-3 h-3"/>{o.match_score}% match</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center pb-4">
          <Link to="/provider/profile" className="text-xs text-muted-foreground underline">Manage provider profile</Link>
        </div>
      </div>
    </MobileShell>
  );
}
