import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { CheckCircle2, MessageSquare, CreditCard, Star, Zap } from "lucide-react";

export const Route = createFileRoute("/activity")({ component: Activity });

const items = [
  { icon: CheckCircle2, color: "text-success", title: "Job completed", sub: "TV mount · Marcus T.", time: "2h ago" },
  { icon: CreditCard, color: "text-primary", title: "Payment captured", sub: "$135.00 · Visa ••4242", time: "2h ago" },
  { icon: Star, color: "text-warning", title: "Review submitted", sub: "5 stars to Marcus T.", time: "2h ago" },
  { icon: MessageSquare, color: "text-primary", title: "New message", sub: "Diane L.: All done!", time: "Yesterday" },
  { icon: Zap, color: "text-emergency", title: "Emergency dispatched", sub: "Burst pipe · 1.2 mi", time: "3 days ago" },
];

function Activity() {
  return (
    <MobileShell>
      <StatusBar title="Activity" />
      <div className="px-5 pt-4 space-y-2">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="glass rounded-2xl p-4 flex items-start gap-3 fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className={`w-10 h-10 rounded-xl bg-secondary grid place-items-center ${it.color}`}>
                <Icon className="w-5 h-5"/>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-xs text-muted-foreground">{it.sub}</div>
              </div>
              <div className="text-[10px] text-muted-foreground">{it.time}</div>
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}
