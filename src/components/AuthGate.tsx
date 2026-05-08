import { useApp } from "@/lib/app-state";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/login"];

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const isPublic = PUBLIC_ROUTES.includes(loc.pathname);

  useEffect(() => {
    if (loading) return;
    if (!session && !isPublic) nav({ to: "/login" });
  }, [loading, session, isPublic, nav]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session && !isPublic) return null;
  return <>{children}</>;
}
