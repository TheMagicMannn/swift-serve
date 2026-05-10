import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("admin_stats");
    if (error) throw new Response(error.message, { status: 403 });
    return data as Record<string, number>;
  });

export const listAllJobsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Confirm admin via has_role; RLS already permits admins to see all jobs
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });
    const { data, error } = await context.supabase
      .from("jobs")
      .select("id, scope_title, scope_category, status, urgency, price_cents, address, customer_id, provider_id, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });

export const listAllUsersAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, phone, active_role, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });
