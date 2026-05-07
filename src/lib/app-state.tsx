import { createContext, useContext, useState, ReactNode } from "react";

type Role = "customer" | "provider";
type Ctx = { role: Role; setRole: (r: Role) => void };

const AppCtx = createContext<Ctx>({ role: "customer", setRole: () => {} });

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("customer");
  return <AppCtx.Provider value={{ role, setRole }}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
