import { Bell } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/lib/notifications";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open && unread > 0) markAllRead(); }}
        className="relative w-10 h-10 grid place-items-center rounded-full glass"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] glass-strong rounded-2xl shadow-float z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notifications
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {items.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet</div>
              ) : (
                items.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOpen(false);
                      if (n.job_id) nav({ to: "/track", search: { id: n.job_id } as never });
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 block"
                  >
                    <div className="text-sm font-medium">{n.title}</div>
                    {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
