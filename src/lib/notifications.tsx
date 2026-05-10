import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";
import { toast } from "sonner";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  kind: string;
  job_id: string | null;
  read_at: string | null;
  created_at: string;
};

export function useNotifications() {
  const { user } = useApp();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif_${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev]);
          toast(n.title, { description: n.body ?? undefined });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
  }, [user]);

  const unread = items.filter((n) => !n.read_at).length;
  return { items, unread, loading, markAllRead, reload: load };
}
