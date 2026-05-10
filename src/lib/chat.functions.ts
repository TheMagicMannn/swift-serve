import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ job_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("*")
      .eq("job_id", data.job_id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Response(error.message, { status: 400 });
    return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ job_id: z.string().uuid(), body: z.string().min(1).max(2000) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("messages")
      .insert({ job_id: data.job_id, sender_id: context.userId, body: data.body })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return row;
  });
