import { useApp, type Role } from "@/lib/app-state";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function RoleSwitch() {
  const { role, setRole } = useApp();
  const nav = useNavigate();
  return (
    <div className="glass rounded-full p-1 flex text-xs font-medium">
      {(["customer", "provider"] as const).map((r: Role) => (
        <button
          key={r}
          onClick={async () => {
            await setRole(r);
            nav({ to: r === "customer" ? "/" : "/provider/dashboard" });
          }}
          className={cn(
            "px-3 py-1.5 rounded-full transition-all capitalize",
            role === r ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
