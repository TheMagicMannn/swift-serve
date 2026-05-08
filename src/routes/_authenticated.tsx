import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/app-state";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({ component: AuthGuard });

function AuthGuard() {
  const { session, loading } = useApp();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !session) nav({ to: "/login" });
  }, [loading, session, nav]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  return <Outlet />;
}
