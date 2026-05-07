import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { RoleSwitch } from "@/components/RoleSwitch";
import { dispatchOffers, earnings } from "@/lib/mock";
import { TrendingUp, Star, Zap, MapPin, Clock, Wrench } from "lucide-react";

export const Route = createFileRoute("/provider/dashboard")({ component: Dashboard });

function Dashboard() {
  return (
    <MobileShell>
      <StatusBar title="Dispatch" action={<RoleSwitch/>} />
      <div className="px-5 pt-4 space-y-5">
        {/* Online toggle */}
        <div className="glass-strong rounded-3xl p-5 flex items-center justify-between fade-up">
          <div>
            <div className="text-xs text-success font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex w-2 h-2"><span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping"/><span className="relative inline-flex rounded-full h-2 w-2 bg-success"/></span>
              Online
            </div>
            <div className="font-semibold mt-1">Accepting jobs in SF</div>
            <div className="text-xs text-muted-foreground mt-0.5">3 mi radius · Handyman, Electrical</div>
          </div>
          <div className="relative w-14 h-7 rounded-full gradient-primary shadow-glow">
            <div className="absolute right-0.5 top-0.5 w-6 h-6 rounded-full bg-white"/>
          </div>
        </div>

        {/* Earnings strip */}
        <div className="grid grid-cols-3 gap-2 fade-up" style={{ animationDelay: "60ms" }}>
          <div className="gradient-card rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-muted-foreground uppercase">Today</div>
            <div className="text-lg font-bold mt-0.5">${earnings.today}</div>
          </div>
          <div className="gradient-card rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-muted-foreground uppercase">Rating</div>
            <div className="text-lg font-bold mt-0.5 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-warning text-warning"/>{earnings.rating}</div>
          </div>
          <div className="gradient-card rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-muted-foreground uppercase">Accept</div>
            <div className="text-lg font-bold mt-0.5">{earnings.acceptance}%</div>
          </div>
        </div>

        {/* Live offers */}
        <div className="fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">New offers</h2>
            <span className="text-xs text-primary flex items-center gap-1"><TrendingUp className="w-3 h-3"/>Boosted</span>
          </div>
          <div className="space-y-3">
            {dispatchOffers.map((o, i) => (
              <Link
                to="/provider/offer"
                key={o.id}
                className={`block rounded-3xl p-5 shadow-card border border-white/5 fade-up ${o.emergency ? "gradient-emergency text-white" : "glass-strong"}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {o.emergency ? (
                      <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Zap className="w-3 h-3"/>Emergency</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase bg-secondary text-foreground px-2 py-0.5 rounded-full">{o.category}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${o.fixedPrice}</div>
                    <div className={`text-[10px] uppercase ${o.emergency ? "text-white/80" : "text-muted-foreground"}`}>payout</div>
                  </div>
                </div>
                <div className="font-semibold mt-2">{o.title}</div>
                <div className={`flex items-center gap-3 text-xs mt-3 ${o.emergency ? "text-white/90" : "text-muted-foreground"}`}>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{o.address}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{o.duration}</span>
                  <span className="flex items-center gap-1"><Wrench className="w-3 h-3"/>{o.category}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
