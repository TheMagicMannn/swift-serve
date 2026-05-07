import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { RoleSwitch } from "@/components/RoleSwitch";
import { quickActions, recentJobs } from "@/lib/mock";
import * as Icons from "lucide-react";
import { MapPin, Mic, Camera, ChevronRight, Sparkles, Clock, Star } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const nav = useNavigate();
  return (
    <MobileShell>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-start justify-between">
        <div className="fade-up">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>1284 Mission St, SF</span>
            <Icons.ChevronDown className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-2xl font-semibold mt-1 text-balance">Hi Alex,<br/>what do you need?</h1>
        </div>
        <RoleSwitch />
      </div>

      {/* AI search */}
      <div className="px-5 fade-up" style={{ animationDelay: "60ms" }}>
        <button
          onClick={() => nav({ to: "/create" })}
          className="w-full glass-strong rounded-3xl p-5 text-left shadow-card group hover:shadow-glow transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Describe your task…</div>
              <div className="text-xs text-muted-foreground/70 mt-0.5">AI will scope it in seconds</div>
            </div>
            <div className="flex gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-secondary grid place-items-center"><Mic className="w-4 h-4" /></div>
              <div className="w-9 h-9 rounded-xl bg-secondary grid place-items-center"><Camera className="w-4 h-4" /></div>
            </div>
          </div>
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-5 mt-7 fade-up" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick book</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((q) => {
            const Icon = (Icons as any)[q.icon];
            return (
              <button
                key={q.label}
                onClick={() => nav({ to: "/create" })}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${q.color} grid place-items-center shadow-card group-active:scale-95 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active job */}
      <div className="px-5 mt-7 fade-up" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active</h2>
        </div>
        <Link to="/track" className="block gradient-card rounded-3xl p-5 shadow-card border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-xs font-medium text-success">Provider matched</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="mt-3 font-semibold">{recentJobs[0].title}</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary grid place-items-center text-sm font-semibold text-primary-foreground">
              {recentJobs[0].provider!.avatar}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{recentJobs[0].provider!.name}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-warning text-warning" />
                {recentJobs[0].provider!.rating} · {recentJobs[0].provider!.jobs} jobs
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">ETA</div>
              <div className="font-semibold flex items-center gap-1"><Clock className="w-3 h-3" />{recentJobs[0].provider!.eta}</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recents */}
      <div className="px-5 mt-7 fade-up" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Book again</h2>
          <Link to="/jobs" className="text-xs text-primary">See all</Link>
        </div>
        <div className="space-y-2.5">
          {recentJobs.slice(1).map((j) => (
            <div key={j.id} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary grid place-items-center">
                <Icons.RotateCw className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{j.title}</div>
                <div className="text-xs text-muted-foreground">{j.provider?.name} · ${j.fixedPrice}</div>
              </div>
              <button className="text-xs font-medium gradient-primary text-primary-foreground px-3 py-1.5 rounded-full">Rebook</button>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
