import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const ScopeSchema = z.object({
  title: z.string().describe("Short job title, e.g. '65\" TV mount on drywall'"),
  category: z.string().describe("e.g. 'Handyman · TV mounting'"),
  tasks: z.array(z.string()).min(2).max(8).describe("What's included"),
  duration_minutes: z.number().int().min(15).max(600),
  skill: z.enum(["basic", "skilled", "pro", "expert"]),
  risk: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  notes: z.string().nullable().optional(),
  labor_cents: z.number().int().min(0),
  platform_cents: z.number().int().min(0),
  materials_cents: z.number().int().min(0),
});
export type AiScope = z.infer<typeof ScopeSchema>;

const ScopeInput = z.object({
  description: z.string().min(3).max(2000),
  address: z.string().min(3).max(500),
  urgency: z.enum(["standard", "urgent", "emergency"]).default("standard"),
  media_paths: z.array(z.string()).max(10).default([]),
});

export const scopeJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ScopeInput.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Response("Missing LOVABLE_API_KEY", { status: 500 });

    // Generate signed URLs for any media so the model can see them
    const imageParts: { type: "image"; image: string }[] = [];
    if (data.media_paths.length > 0) {
      for (const path of data.media_paths) {
        const { data: signed } = await context.supabase.storage
          .from("job-media")
          .createSignedUrl(path, 60 * 10);
        if (signed?.signedUrl) imageParts.push({ type: "image", image: signed.signedUrl });
      }
    }

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    const system = `You are a dispatch operations expert for an on-demand local services marketplace.
Convert a customer request into a structured fixed-price work order.
Return realistic US-market pricing in cents. Platform fee is ~12% of labor with $5 min.
Skill: basic (no license), skilled (handy), pro (licensed trade), expert (specialist).
Risk reflects safety/property damage potential. Confidence 0-1 reflects how clear the scope is.`;

    const userText = `Customer description: ${data.description}
Service address: ${data.address}
Urgency: ${data.urgency}
${imageParts.length ? `Photos attached: ${imageParts.length}` : "No photos provided."}`;

    try {
      const { experimental_output } = await generateText({
        model,
        system,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: userText }, ...imageParts],
          },
        ],
        experimental_output: Output.object({ schema: ScopeSchema }),
      });
      return experimental_output as AiScope;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Response("Rate limited. Try again shortly.", { status: 429 });
      if (msg.includes("402")) throw new Response("AI credits exhausted.", { status: 402 });
      throw new Response(`AI scoping failed: ${msg}`, { status: 500 });
    }
  });

const CreateJobInput = z.object({
  description: z.string().min(3).max(2000),
  address: z.string().min(3).max(500),
  urgency: z.enum(["standard", "urgent", "emergency"]),
  media_paths: z.array(z.string()).max(10).default([]),
  scope: ScopeSchema,
});

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateJobInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const s = data.scope;
    const price = s.labor_cents + s.platform_cents + s.materials_cents;
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        customer_id: userId,
        status: "dispatching",
        urgency: data.urgency,
        description: data.description,
        address: data.address,
        media_paths: data.media_paths,
        scope_title: s.title,
        scope_category: s.category,
        scope_tasks: s.tasks,
        scope_duration_minutes: s.duration_minutes,
        scope_skill: s.skill,
        scope_risk: s.risk,
        scope_confidence: s.confidence,
        scope_notes: s.notes ?? null,
        labor_cents: s.labor_cents,
        platform_cents: s.platform_cents,
        materials_cents: s.materials_cents,
        price_cents: price,
      })
      .select("id")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return { id: job.id };
  });

export const listMyJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("jobs")
      .select("*")
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });

export const getJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: job, error } = await context.supabase
      .from("jobs")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 400 });
    return job;
  });
