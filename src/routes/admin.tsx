import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { useApp } from "@/lib/app-state";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminStats, listAllJobsAdmin, listAllUsersAdmin,
  listDisputesAdmin, listAuditLogs,
  adminCancelJob, adminRefundJob, adminResolveDispute, adminUpdateJobStatus,
} from "@/lib/admin.functions";
import {
  Loader2, Shield, Users, Briefcase, Activity, DollarSign, Radio,
  AlertTriangle, FileText, Ban, RotateCcw, Check, X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Stats = {
  users: number; providers: number; online_providers: number;
  jobs_total: number; jobs_active: number; jobs_completed: number; gmv_cents: number;
};
type AdminJob = {
  id: string; scope_title: string | null; scope_category: string | null;
  status: string; urgency: string; price_cents: number | null; address: string;
  customer_id: string; provider_id: string | null; created_at: string;
  cancelled_reason: string | null; refunded_cents: number | null;
};
type AdminUser = {
  id: string; full_name: string | null; phone: string | null; active_role: string; created_at: string;
};
type Dispute = {
  id: string; job_id: string; opened_by: string; reason: string;
  status: string; resolution_notes: string | null;
  created_at: string; resolved_at: string | null;
};
type AuditLog = {
  id: string; actor_id: string; action: string; target_type: string;
  target_id: string | null; metadata: any; created_at: string;
};

type Tab = "jobs" | "users" | "disputes" | "audit";

const fmt$ = (c: number) => `$${(c / 100).toFixed(0)}`;

function AdminPage() {
  const { roles, loading: appLoading } = useApp();
  const nav = useNavigate();
  const fetchStats = useServerFn(getAdminStats);
  const fetchJobs = useServerFn(listAllJobsAdmin);
  const fetchUsers = useServerFn(listAllUsersAdmin);
  const fetchDisputes = useServerFn(listDisputesAdmin);
  const fetchAudit = useServerFn(listAuditLogs);
  const cancelJob = useServerFn(adminCancelJob);
  const refundJob = useServerFn(adminRefundJob);
  const resolveDispute = useServerFn(adminResolveDispute);
  const updateStatus = useServerFn(adminUpdateJobStatus);

  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [tab, setTab] = useState<Tab>("jobs");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [s, j, u, d, a] = await Promise.all([
      fetchStats(), fetchJobs(), fetchUsers(), fetchDisputes(), fetchAudit(),
    ]);
    setStats(s as Stats);
    setJobs(j as AdminJob[]);
    setUsers(u as AdminUser[]);
    setDisputes(d as Dispute[]);
    setAudit(a as AuditLog[]);
  }, [fetchStats, fetchJobs, fetchUsers, fetchDisputes, fetchAudit]);

  useEffect(() => {
    if (appLoading) return;
    if (!roles.includes("admin")) { nav({ to: "/" }); return; }
    reload().finally(() => setLoading(false));
  }, [appLoading, roles, nav, reload]);

  async function withAction<T>(id: string, fn: () => Promise<T>, msg: string) {
    setActingId(id);
    try {
      await fn();
      toast.success(msg);
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setActingId(null);
    }
  }

  function onCancel(j: AdminJob) {
    const reason = window.prompt(`Cancel job "${j.scope_title ?? j.id.slice(0,8)}". Reason?`);
    if (!reason) return;
    withAction(j.id, () => cancelJob({ data: { job_id: j.id, reason } }), "Job cancelled");
  }
  function onRefund(j: AdminJob) {
    const def = j.price_cents ?? 0;
    const raw = window.prompt(`Refund amount in cents (default ${def})?`, String(def));
    if (raw == null) return;
    const amount_cents = parseInt(raw, 10);
    if (!Number.isFinite(amount_cents) || amount_cents < 0) return toast.error("Invalid amount");
    const note = window.prompt("Internal note (optional)?") ?? undefined;
    withAction(j.id, () => refundJob({ data: { job_id: j.id, amount_cents, note } }), "Refund logged");
  }
  function onForceStatus(j: AdminJob) {
    const status = window.prompt("New status (assigned / en_route / arrived / in_progress / completed / disputed):");
    if (!status) return;
    const note = window.prompt("Note?") ?? undefined;
    withAction(j.id, () => updateStatus({ data: { job_id: j.id, status: status as any, note } }), "Status updated");
  }
  function onResolve(d: Dispute, status: "resolved" | "refunded" | "rejected") {
    const notes = window.prompt(`Resolution notes (${status})?`);
    if (!notes) return;
    withAction(d.id, () => resolveDispute({ data: { dispute_id: d.id, status, notes } }), "Dispute updated");
  }

  if (appLoading || loading) {
    return (
      <MobileShell hideNav>
        <StatusBar title="Admin" />
        <div className="grid place-items-center pt-20"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
      </MobileShell>
    );
  }

  const openDisputes = disputes.filter((d) => d.status === "open").length;

  return (
    <MobileShell hideNav>
      <StatusBar title="Admin" action={<Shield className="w-4 h-4 text-primary"/>} />
      <div className="px-5 pt-4 pb-10 space-y-5">
        {stats && (
          <div className="grid grid-cols-2 gap-2">
            <Stat icon={Users} label="Users" value={stats.users} />
            <Stat icon={Radio} label="Online" value={`${stats.online_providers}/${stats.providers}`} />
            <Stat icon={Briefcase} label="Jobs" value={stats.jobs_total} />
            <Stat icon={Activity} label="Active" value={stats.jobs_active} />
            <Stat icon={AlertTriangle} label="Open disputes" value={openDisputes} />
            <Stat icon={DollarSign} label="GMV" value={fmt$(stats.gmv_cents)} />
          </div>
        )}

        <div className="glass rounded-full p-1 flex text-xs font-medium">
          {(["jobs", "disputes", "users", "audit"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-full capitalize transition ${tab === t ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>
              {t}{t === "disputes" && openDisputes > 0 ? ` (${openDisputes})` : ""}
            </button>
          ))}
        </div>

        {tab === "jobs" && (
          <div className="space-y-2">
            {jobs.length === 0 && <Empty label="No jobs" />}
            {jobs.map((j) => (
              <div key={j.id} className="glass rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{j.scope_title ?? "Untitled job"}</div>
                    <div className="text-xs text-muted-foreground truncate">{j.address}</div>
                    {j.cancelled_reason && (
                      <div className="text-[10px] text-destructive mt-1">Cancelled: {j.cancelled_reason}</div>
                    )}
                    {j.refunded_cents != null && (
                      <div className="text-[10px] text-amber-400 mt-1">Refunded {fmt$(j.refunded_cents)}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{j.price_cents ? fmt$(j.price_cents) : "—"}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">{j.status}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <ActionBtn icon={FileText} label="Status" onClick={() => onForceStatus(j)} disabled={actingId === j.id} />
                  <ActionBtn icon={RotateCcw} label="Refund" onClick={() => onRefund(j)} disabled={actingId === j.id} />
                  <ActionBtn icon={Ban} label="Cancel" onClick={() => onCancel(j)} disabled={actingId === j.id || j.status === "cancelled"} danger />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "disputes" && (
          <div className="space-y-2">
            {disputes.length === 0 && <Empty label="No disputes" />}
            {disputes.map((d) => (
              <div key={d.id} className="glass rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Job {d.job_id.slice(0, 8)}</div>
                    <div className="text-sm mt-0.5">{d.reason}</div>
                    {d.resolution_notes && (
                      <div className="text-[10px] text-muted-foreground mt-1">→ {d.resolution_notes}</div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                    {d.status}
                  </span>
                </div>
                {d.status === "open" && (
                  <div className="flex gap-1.5 pt-1">
                    <ActionBtn icon={Check} label="Resolve" onClick={() => onResolve(d, "resolved")} disabled={actingId === d.id} />
                    <ActionBtn icon={RotateCcw} label="Refund" onClick={() => onResolve(d, "refunded")} disabled={actingId === d.id} />
                    <ActionBtn icon={X} label="Reject" onClick={() => onResolve(d, "rejected")} disabled={actingId === d.id} danger />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
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

        {tab === "audit" && (
          <div className="space-y-2">
            {audit.length === 0 && <Empty label="No audit entries" />}
            {audit.map((a) => (
              <div key={a.id} className="glass rounded-2xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs text-primary">{a.action}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {a.target_type} {a.target_id?.slice(0, 8)} · by {a.actor_id.slice(0, 8)}
                </div>
                {a.metadata && Object.keys(a.metadata).length > 0 && (
                  <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap break-all">
                    {JSON.stringify(a.metadata)}
                  </pre>
                )}
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

function ActionBtn({ icon: Icon, label, onClick, disabled, danger }: {
  icon: typeof Shield; label: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-medium py-2 rounded-xl transition disabled:opacity-50 ${
        danger ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
               : "bg-primary/15 text-primary hover:bg-primary/25"}`}>
      <Icon className="w-3 h-3"/>{label}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="text-center text-xs text-muted-foreground py-8">{label}</div>;
}
