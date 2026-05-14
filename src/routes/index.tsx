import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { RoleSwitch } from "@/components/RoleSwitch";
import { quickActions } from "@/lib/mock";
import * as Icons from "lucide-react";
import { MapPin, Mic, Camera, ChevronRight, Sparkles, Clock } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyJobs } from "@/lib/jobs.functions";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/")({ component: Home });

const ACTIVE_STATUSES = ["dispatching", "assigned", "en_route", "arrived", "in_progress"];

type JobRow = {
  id: string;
  status: string;
  scope_title: string | null;
  scope_category: string | null;
  description: string;
  address: string;
  price_cents: number | null;
  provider_id: string | null;
  scope_duration_minutes: number | null;
};

function Home() {
  const nav = useNavigate();
  const { user, profile } = useApp();
  const fetchJobs = useServerFn(listMyJobs);
  const { data: jobs } = useQuery({
    queryKey: ["jobs", "mine", user?.id],
    queryFn: () => fetchJobs(),
    enabled: !!user,
    retry: 1,
  });

  const list = (jobs ?? []) as JobRow[];
  const active = list.find((j) => ACTIVE_STATUSES.includes(j.status));
  const completed = list.filter((j) => j.status === "completed").slice(0, 3);
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "there";

  return (
    <MobileShell>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-start justify-between">
        <div className="fade-up">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[220px]">{profile?.default_address ?? "Set your address in profile"}</span>
            <Icons.ChevronDown className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-2xl font-semibold mt-1 text-balance">Hi {firstName},<br/>what do you need?</h1>
        </div>
        <div className="flex items-center gap-2"><NotificationBell /><RoleSwitch /></div>
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
            const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[q.icon];
            return (
              <button
                key={q.label}
                onClick={() => nav({ to: "/create" })}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${q.color} grid place-items-center shadow-card group-active:scale-95 transition-transform`}>
                  {Icon ? <Icon className="w-6 h-6 text-white" /> : null}
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active job */}
      {active && (
        <div className="px-5 mt-7 fade-up" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active</h2>
          </div>
          <Link
            to="/track"
            search={{ id: active.id } as never}
            className="block gradient-card rounded-3xl p-5 shadow-card border border-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <span className="text-xs font-medium text-success capitalize">{active.status.replace("_", " ")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="mt-3 font-semibold truncate">{active.scope_title ?? active.description}</div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{active.address.split(",")[0]}</span>
              {active.scope_duration_minutes && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{active.scope_duration_minutes}m</span>
              )}
              {active.price_cents != null && <span className="ml-auto font-semibold text-foreground">${(active.price_cents/100).toFixed(0)}</span>}
            </div>
          </Link>
        </div>
      )}

      {/* Recents */}
      {completed.length > 0 && (
        <div className="px-5 mt-7 fade-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Book again</h2>
            <Link to="/jobs" className="text-xs text-primary">See all</Link>
          </div>
          <div className="space-y-2.5">
            {completed.map((j) => (
              <Link
                to="/track"
                search={{ id: j.id } as never}
                key={j.id}
                className="glass rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary grid place-items-center">
                  <Icons.RotateCw className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{j.scope_title ?? j.description}</div>
                  <div className="text-xs text-muted-foreground truncate">{j.scope_category ?? "Service"}{j.price_cents != null ? ` · $${(j.price_cents/100).toFixed(0)}` : ""}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground"/>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!active && completed.length === 0 && user && (
        <div className="px-5 mt-7 fade-up" style={{ animationDelay: "240ms" }}>
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No jobs yet. Tap “Describe your task…” to get a fixed-price quote in seconds.
          </div>
        </div>
      )}
    </MobileShell>
  );
}
