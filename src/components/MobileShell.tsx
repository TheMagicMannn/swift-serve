import { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Briefcase, MessageSquare, Activity, User, Radio, Calendar, DollarSign } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

const customerTabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/activity", icon: Activity, label: "Activity" },
  { to: "/profile", icon: User, label: "Profile" },
];

const providerTabs = [
  { to: "/provider/dashboard", icon: Radio, label: "Dispatch" },
  { to: "/provider/schedule", icon: Calendar, label: "Schedule" },
  { to: "/provider/earnings", icon: DollarSign, label: "Earnings" },
  { to: "/chat", icon: MessageSquare, label: "Messages" },
  { to: "/provider/profile", icon: User, label: "Profile" },
];

export function MobileShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  const { role } = useApp();
  const location = useLocation();
  const tabs = role === "customer" ? customerTabs : providerTabs;

  return (
    <div className="mobile-frame">
      <main className={cn("min-h-screen", !hideNav && "pb-24")}>{children}</main>
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 px-3 pb-3">
          <div className="glass-strong shadow-float rounded-3xl flex items-center justify-around py-2 px-1">
            {tabs.map((t) => {
              const active = location.pathname === t.to ||
                (t.to !== "/" && location.pathname.startsWith(t.to));
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all",
                    active && "bg-primary/15 shadow-glow"
                  )}>
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] font-medium">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function StatusBar({ title, action, back }: { title?: string; action?: ReactNode; back?: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 glass-strong px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">{back}{title && <h1 className="font-semibold text-base">{title}</h1>}</div>
      {action}
    </div>
  );
}
