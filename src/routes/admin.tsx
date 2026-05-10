import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { useApp } from "@/lib/app-state";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStats, listAllJobsAdmin, listAllUsersAdmin } from "@/lib/admin.functions";
import { Loader2, Shield, Users, Briefcase, Activity, DollarSign, Radio } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Stats = {
  users: number; providers: number; online_providers: number;
  jobs_total: number; jobs_active: number; jobs_completed: number; gmv_cents: number;
};
type AdminJob = {
  id: string; scope_title: string | null; scope_category: string | null;
  status: string; urgency: string; price_cents: number | null; address: string;
  customer_id: string; provider_id: string | null; created_at: string;
};
type AdminUser = {
  id: string; full_name: string | null; phone: string | null; active_role: string; created_at: string;
};

function AdminPage() {
  const { roles, loading: appLoading } = useApp();
  const nav = useNavigate();
  const fetchStats = useServerFn(getAdminStats);
  const fetchJobs = useServerFn(listAllJobsAdmin);
  const fetchUsers = useServerFn(listAllUsersAdmin);
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<"jobs" | "users">("jobs");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appLoading) return;
    if (!roles.includes("admin")) { nav({ to: "/" }); return; }
    (async () => {
      try {
        const [s, j, u] = await Promise.all([fetchStats(), fetchJobs(), fetchUsers()]);
        setStats(s as Stats);
        setJobs(j as AdminJob[]);
        setUsers(u as AdminUser[]);
      } finally { setLoading(false); }
    })();
  }, [appLoading, roles, nav, fetchStats, fetchJobs, fetchUsers]);

  if (appLoading || loading) {
    return (
      <MobileShell hideNav>
        <StatusBar title="Admin" />
        <div className="grid place-items-center pt-20"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
      </MobileShell>
    );
  }

  const fmt$ = (c: number) => `$${(c / 100).toFixed(0)}`;

  return (
    <MobileShell hideNav>
      <StatusBar title="Admin" action={<Shield className="w-4 h-4 text-primary"/>} />
      <div className="px-5 pt-4 pb-10 space-y-5">
        {stats && (
          <div className="grid grid-cols-2 gap-2">
            <Stat icon={Users} label="Users" value={stats.users} />
            <Stat icon={Radio} label="Online providers" value={`${stats.online_providers}/${stats.providers}`} />
            <Stat icon={Briefcase} label="Jobs total" value={stats.jobs_total} />
            <Stat icon={Activity} label="Active" value={stats.jobs_active} />
            <Stat icon={Briefcase} label="Completed" value={stats.jobs_completed} />
            <Stat icon={DollarSign} label="GMV" value={fmt$(stats.gmv_cents)} />
          </div>
        )}

        <div className="glass rounded-full p-1 flex text-xs font-medium">
          {(["jobs", "users"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-full capitalize transition ${tab === t ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "jobs" ? (
          <div className="space-y-2">
            {jobs.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">No jobs</div>}
            {jobs.map((j) => (
              <div key={j.id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{j.scope_title ?? "Untitled job"}</div>
                    <div className="text-xs text-muted-foreground truncate">{j.address}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{j.price_cents ? fmt$(j.price_cents) : "—"}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">{j.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{u.full_name ?? "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.phone ?? u.id.slice(0, 8)}</div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  {u.active_role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Shield; label: string; value: string | number }) {
  return (
    <div className="gradient-card rounded-2xl p-3 border border-white/5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground tracking-wider">
        <Icon className="w-3 h-3"/>{label}
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
