import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const skillKeywords: Record<string, string[]> = {
  basic: ["assembly", "moving", "cleaning", "yard"],
  skilled: ["mounting", "drywall", "furniture", "handyman"],
  pro: ["electrical", "plumbing", "hvac", "appliance"],
  expert: ["roof", "gas", "structural"],
};

function scoreProvider(p: {
  skills: string[];
  rating: number;
  completed_count: number;
  service_radius_km: number;
}, jobCategory: string | null, jobSkill: string | null) {
  const cat = (jobCategory ?? "").toLowerCase();
  const skillMatches = p.skills.filter((s) => cat.includes(s.toLowerCase())).length;
  const lvlMatches = (skillKeywords[jobSkill ?? "skilled"] ?? []).filter((kw) =>
    p.skills.some((s) => s.toLowerCase().includes(kw))
  ).length;
  const skillScore = (skillMatches * 25 + lvlMatches * 10);
  const ratingScore = (p.rating - 4) * 30; // 4.0 → 0, 5.0 → 30
  const exp = Math.min(p.completed_count, 500) / 500 * 15;
  return Math.max(0, Math.min(100, 50 + skillScore + ratingScore + exp));
}

export const dispatchOffers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ job_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error: jerr } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", data.job_id)
      .maybeSingle();
    if (jerr || !job) throw new Response("Job not found", { status: 404 });
    if (job.customer_id !== userId) throw new Response("Forbidden", { status: 403 });

    const { data: providers, error: perr } = await supabase
      .from("provider_profiles")
      .select("id, skills, rating, completed_count, service_radius_km, is_online")
      .eq("is_online", true);
    if (perr) throw new Response(perr.message, { status: 400 });

    const ranked = (providers ?? [])
      .map((p) => ({
        ...p,
        score: scoreProvider(p, job.scope_category, job.scope_skill),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (ranked.length === 0) return { sent: 0 };

    const rows = ranked.map((p) => ({
      job_id: job.id,
      provider_id: p.id,
      match_score: Math.round(p.score),
      eta_minutes: 10 + Math.floor(Math.random() * 25),
    }));

    const { error: ierr } = await supabase
      .from("job_offers")
      .upsert(rows, { onConflict: "job_id,provider_id" });
    if (ierr) throw new Response(ierr.message, { status: 400 });

    return { sent: rows.length };
  });

export const listJobOffersForProvider = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("job_offers")
      .select("*, jobs:job_id(*)")
      .eq("provider_id", userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });

export const getJobOffersForJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ job_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("job_offers")
      .select("*, provider:provider_id(id), provider_profile:provider_id(rating, completed_count, skills, vehicle)")
      .eq("job_id", data.job_id)
      .order("match_score", { ascending: false });
    if (error) throw new Response(error.message, { status: 400 });
    // Enrich provider name from profiles
    const ids = Array.from(new Set((rows ?? []).map((r) => r.provider_id)));
    const { data: profs } = await context.supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({ ...r, profile: map.get(r.provider_id) ?? null }));
  });

export const acceptJobOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ offer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("claim_job_offer", {
      _offer_id: data.offer_id,
    });
    if (error) throw new Response(error.message, { status: 400 });
    const row = Array.isArray(result) ? result[0] : result;
    return row ?? null;
  });

export const declineJobOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ offer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("job_offers")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", data.offer_id)
      .eq("provider_id", context.userId);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

const StatusInput = z.object({
  job_id: z.string().uuid(),
  status: z.enum(["en_route", "arrived", "in_progress", "completed", "cancelled"]),
});
export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("jobs")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.job_id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

const ProviderProfileInput = z.object({
  skills: z.array(z.string().min(1).max(40)).max(20).optional(),
  service_radius_km: z.number().min(1).max(100).optional(),
  vehicle: z.string().max(80).nullable().optional(),
  payout_method: z.string().max(80).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  is_online: z.boolean().optional(),
  base_lat: z.number().nullable().optional(),
  base_lng: z.number().nullable().optional(),
});
export const upsertProviderProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProviderProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("provider_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("provider_profiles").update(data).eq("id", userId);
      if (error) throw new Response(error.message, { status: 400 });
    } else {
      const { error } = await supabase
        .from("provider_profiles")
        .insert({ id: userId, ...data });
      if (error) throw new Response(error.message, { status: 400 });
    }
    return { ok: true };
  });

export const getMyProviderProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("provider_profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 400 });
    return data;
  });
