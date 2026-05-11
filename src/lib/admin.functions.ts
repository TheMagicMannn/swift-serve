import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: roles } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId);
  if (!(roles ?? []).some((r: any) => r.role === "admin")) {
    throw new Response("Forbidden", { status: 403 });
  }
}

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
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("jobs")
      .select("id, scope_title, scope_category, status, urgency, price_cents, address, customer_id, provider_id, created_at, cancelled_reason, refunded_cents")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });

export const listAllUsersAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, phone, active_role, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });

export const listDisputesAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("disputes")
      .select("id, job_id, opened_by, reason, status, resolution_notes, created_at, resolved_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("id, actor_id, action, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });

export const adminUpdateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    job_id: z.string().uuid(),
    status: z.enum([
      "draft","scoping","dispatching","assigned","en_route","arrived",
      "in_progress","completed","cancelled","disputed","refunded"
    ]),
    note: z.string().max(500).optional(),
  }).parse)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("admin_update_job_status", {
      _job_id: data.job_id, _status: data.status, _note: data.note ?? undefined,
    });
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminCancelJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    job_id: z.string().uuid(),
    reason: z.string().min(2).max(500),
  }).parse)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("admin_cancel_job", {
      _job_id: data.job_id, _reason: data.reason,
    });
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminRefundJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    job_id: z.string().uuid(),
    amount_cents: z.number().int().min(0),
    note: z.string().max(500).optional(),
  }).parse)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("admin_refund_job", {
      _job_id: data.job_id, _amount_cents: data.amount_cents, _note: data.note ?? undefined,
    });
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const adminResolveDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    dispute_id: z.string().uuid(),
    status: z.enum(["resolved", "refunded", "rejected"]),
    notes: z.string().min(2).max(1000),
  }).parse)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("admin_resolve_dispute", {
      _dispute_id: data.dispute_id, _status: data.status, _notes: data.notes,
    });
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });
