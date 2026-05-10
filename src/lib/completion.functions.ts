import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ job_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("job_completions")
      .select("*")
      .eq("job_id", data.job_id)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 400 });
    if (!row) return { completion: null, signedUrls: [] as string[] };
    const signedUrls: string[] = [];
    for (const p of row.proof_paths ?? []) {
      const { data: s } = await context.supabase.storage.from("job-media").createSignedUrl(p, 3600);
      if (s?.signedUrl) signedUrls.push(s.signedUrl);
    }
    return { completion: row, signedUrls };
  });

const SubmitInput = z.object({
  job_id: z.string().uuid(),
  proof_paths: z.array(z.string().min(1).max(500)).min(1).max(10),
  provider_notes: z.string().max(1000).optional().nullable(),
});
export const submitCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error: jerr } = await supabase
      .from("jobs")
      .select("id, customer_id, provider_id, status")
      .eq("id", data.job_id)
      .maybeSingle();
    if (jerr || !job) throw new Response("Job not found", { status: 404 });
    if (job.provider_id !== userId) throw new Response("Forbidden", { status: 403 });

    const { error: cerr } = await supabase
      .from("job_completions")
      .upsert(
        {
          job_id: job.id,
          provider_id: userId,
          customer_id: job.customer_id,
          proof_paths: data.proof_paths,
          provider_notes: data.provider_notes ?? null,
        },
        { onConflict: "job_id" }
      );
    if (cerr) throw new Response(cerr.message, { status: 400 });

    const { error: uerr } = await supabase
      .from("jobs")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", job.id);
    if (uerr) throw new Response(uerr.message, { status: 400 });
    return { ok: true };
  });

const RatingInput = z.object({
  job_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional().nullable(),
});
export const submitRating = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RatingInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c, error } = await supabase
      .from("job_completions")
      .select("id, customer_id")
      .eq("job_id", data.job_id)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 400 });
    if (!c) throw new Response("Completion not found", { status: 404 });
    if (c.customer_id !== userId) throw new Response("Forbidden", { status: 403 });
    const { error: uerr } = await supabase
      .from("job_completions")
      .update({
        rating: data.rating,
        review: data.review ?? null,
        customer_confirmed_at: new Date().toISOString(),
      })
      .eq("id", c.id);
    if (uerr) throw new Response(uerr.message, { status: 400 });
    return { ok: true };
  });
