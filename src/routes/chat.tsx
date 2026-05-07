import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { chatMessages } from "@/lib/mock";
import { ArrowLeft, Send, Mic, Plus, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/chat")({ component: Chat });

function Chat() {
  return (
    <MobileShell>
      <StatusBar
        title="Marcus T."
        back={<Link to="/track" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}
        action={<div className="text-xs text-success font-medium">● Online</div>}
      />

      <div className="px-4 py-4 space-y-3">
        <div className="text-center text-[10px] text-muted-foreground uppercase tracking-wider">Today · TV mount job</div>
        {chatMessages.map((m, i) => {
          if (m.from === "system") {
            return <div key={i} className="text-center text-xs text-muted-foreground">{m.text}</div>;
          }
          const me = m.from === "customer";
          return (
            <div key={i} className={`flex ${me ? "justify-end" : "justify-start"} fade-up`} style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${me ? "gradient-primary text-primary-foreground rounded-br-md" : "glass rounded-bl-md"}`}>
                {m.text}
                <div className={`text-[10px] mt-1 ${me ? "text-white/70" : "text-muted-foreground"}`}>{m.time}</div>
              </div>
            </div>
          );
        })}

        {/* Quick replies */}
        <div className="flex gap-2 flex-wrap pt-2">
          {["Almost there", "Send photo", "Need 5 more min"].map((q) => (
            <button key={q} className="glass text-xs px-3 py-1.5 rounded-full">{q}</button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-3">
        <div className="glass-strong rounded-full p-1.5 flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><Plus className="w-4 h-4"/></button>
          <input placeholder="Message…" className="flex-1 bg-transparent outline-none text-sm px-1"/>
          <button className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ImageIcon className="w-4 h-4"/></button>
          <button className="w-9 h-9 rounded-full gradient-primary grid place-items-center shadow-glow"><Send className="w-4 h-4 text-primary-foreground"/></button>
        </div>
      </div>
    </MobileShell>
  );
}
