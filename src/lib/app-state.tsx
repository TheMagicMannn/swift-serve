import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { installAuthFetch } from "@/lib/auth-fetch";

export type Role = "customer" | "provider" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  default_address: string | null;
  active_role: Role;
};

type Ctx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  role: Role; // active role
  loading: boolean;
  setRole: (r: Role) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AppCtx = createContext<Ctx>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  role: "customer",
  loading: true,
  setRole: async () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((prof as Profile) ?? null);
    setRoles(((roleRows ?? []) as { role: Role }[]).map((r) => r.role));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadUserData(session.user.id);
  }, [session, loadUserData]);

  useEffect(() => {
    installAuthFetch();
    // 1) Set up listener BEFORE getting session (per Supabase guidance)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Defer DB calls so we don't block the auth callback
        setTimeout(() => { loadUserData(newSession.user.id); }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    // 2) Then read existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) loadUserData(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const setRole = useCallback(async (r: Role) => {
    if (!session?.user || !profile) return;
    // Ensure role row exists (only customer/provider self-assignable)
    if ((r === "customer" || r === "provider") && !roles.includes(r)) {
      await supabase.from("user_roles").insert({ user_id: session.user.id, role: r });
      setRoles((prev) => [...prev, r]);
    }
    await supabase.from("profiles").update({ active_role: r }).eq("id", session.user.id);
    setProfile({ ...profile, active_role: r });
  }, [session, profile, roles]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRoles([]);
  }, []);

  return (
    <AppCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        roles,
        role: profile?.active_role ?? "customer",
        loading,
        setRole,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
