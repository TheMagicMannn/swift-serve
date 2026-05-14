import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { Bell, CheckCircle2, MessageSquare, Inbox, Loader2 } from "lucide-react";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/activity")({ component: Activity });

function iconFor(kind: string) {
  if (kind === "chat") return MessageSquare;
  if (kind === "offer") return Inbox;
  if (kind === "job") return CheckCircle2;
  return Bell;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Activity() {
  const { items, loading, markAllRead, unread } = useNotifications();

  return (
    <MobileShell>
      <StatusBar
        title="Activity"
        action={
          unread > 0 ? (
            <button onClick={markAllRead} className="text-xs text-primary font-medium">Mark all read</button>
          ) : null
        }
      />
      <div className="px-5 pt-4 pb-8 space-y-2">
        {loading ? (
          <div className="py-20 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto"/>
            <p className="mt-3 text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          items.map((n, i) => {
            const Icon = iconFor(n.kind);
            const inner = (
              <div className={`glass rounded-2xl p-4 flex items-start gap-3 fade-up ${n.read_at ? "" : "border border-primary/30"}`} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center text-primary">
                  <Icon className="w-5 h-5"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground truncate">{n.body}</div>}
                </div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(n.created_at)}</div>
              </div>
            );
            return n.job_id ? (
              <Link key={n.id} to="/track" search={{ id: n.job_id } as never}>{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })
        )}
      </div>
    </MobileShell>
  );
}
