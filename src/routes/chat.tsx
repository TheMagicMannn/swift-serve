import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { listMessages, sendMessage } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";
import { toast } from "sonner";

const Search = z.object({ id: z.string().uuid().optional() });
export const Route = createFileRoute("/chat")({
  component: Chat,
  validateSearch: (s) => Search.parse(s),
});

type Msg = { id: string; job_id: string; sender_id: string; body: string; created_at: string };

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Chat() {
  const { id } = Route.useSearch();
  const { user } = useApp();
  const list = useServerFn(listMessages);
  const send = useServerFn(sendMessage);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const rows = await list({ data: { job_id: id } });
      setMsgs(rows as Msg[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load chat");
    }
  }, [id, list]);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    load().finally(() => setLoading(false));
    supabase.from("jobs").select("customer_id, provider_id").eq("id", id).maybeSingle().then(async ({ data }) => {
      if (!data || !user) return;
      const otherId = data.customer_id === user.id ? data.provider_id : data.customer_id;
      if (!otherId) return;
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", otherId).maybeSingle();
      setOtherName(p?.full_name ?? null);
    });
    const ch = supabase
      .channel(`chat_${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${id}` },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const submit = async () => {
    if (!id || !text.trim() || sending) return;
    setSending(true);
    const body = text.trim();
    setText("");
    try {
      const row = await send({ data: { job_id: id, body } });
      setMsgs((prev) => (prev.some((x) => x.id === (row as Msg).id) ? prev : [...prev, row as Msg]));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
      setText(body);
    } finally {
      setSending(false);
    }
  };

  if (!id) {
    return (
      <MobileShell>
        <StatusBar title="Chat" back={<Link to="/jobs" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>
        <div className="px-5 pt-20 text-center text-muted-foreground">Open a job to chat.</div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <StatusBar
        title={otherName ?? "Chat"}
        back={<Link to="/track" search={{ id } as never} className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}
      />

      <div className="px-4 py-4 space-y-3 pb-32">
        {loading ? (
          <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin"/></div>
        ) : msgs.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground pt-10">No messages yet — say hello 👋</div>
        ) : (
          msgs.map((m) => {
            const me = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${me ? "gradient-primary text-primary-foreground rounded-br-md" : "glass rounded-bl-md"}`}>
                  {m.body}
                  <div className={`text-[10px] mt-1 ${me ? "text-white/70" : "text-muted-foreground"}`}>{fmtTime(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef}/>
      </div>

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-3">
        <div className="glass-strong rounded-full p-1.5 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Message…"
            maxLength={2000}
            className="flex-1 bg-transparent outline-none text-sm px-3"
          />
          <button onClick={submit} disabled={sending || !text.trim()} className="w-9 h-9 rounded-full gradient-primary grid place-items-center shadow-glow disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin text-primary-foreground"/> : <Send className="w-4 h-4 text-primary-foreground"/>}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
