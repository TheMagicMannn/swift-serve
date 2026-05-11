import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Phone, MessageSquare, Star, Shield, Clock, Loader2, Camera, X, Plus } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";
import { useServerFn } from "@tanstack/react-start";
import { updateJobStatus } from "@/lib/dispatch.functions";
import { getCompletion, submitCompletion, submitRating } from "@/lib/completion.functions";
import { toast } from "sonner";

const Search = z.object({ id: z.string().uuid().optional() });
export const Route = createFileRoute("/track")({
  component: Track,
  validateSearch: (s) => Search.parse(s),
});

type Job = {
  id: string;
  status: string;
  customer_id: string;
  provider_id: string | null;
  scope_title: string | null;
  price_cents: number | null;
  address: string;
};

type Completion = {
  id: string;
  proof_paths: string[];
  provider_notes: string | null;
  rating: number | null;
  review: string | null;
  customer_confirmed_at: string | null;
};

const STAGES: { key: string; label: string }[] = [
  { key: "dispatching", label: "Dispatched" },
  { key: "assigned", label: "Accepted" },
  { key: "en_route", label: "En route" },
  { key: "arrived", label: "Arrived" },
  { key: "in_progress", label: "Working" },
  { key: "completed", label: "Done" },
];

function Track() {
  const { id } = Route.useSearch();
  const { user } = useApp();
  const nav = useNavigate();
  const updateStatus = useServerFn(updateJobStatus);
  const fetchCompletion = useServerFn(getCompletion);
  const submitDone = useServerFn(submitCompletion);
  const submitRate = useServerFn(submitRating);
  const [job, setJob] = useState<Job | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [providerLoc, setProviderLoc] = useState<{ lat: number; lng: number; updated_at: string } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
    setJob(data as Job | null);
    if (data?.provider_id) {
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.provider_id).maybeSingle();
      setProviderName(p?.full_name ?? null);
    }
    try {
      const res = await fetchCompletion({ data: { job_id: id } });
      setCompletion((res as { completion: Completion | null }).completion);
      setProofUrls((res as { signedUrls: string[] }).signedUrls);
    } catch {/* ignore */}
  }, [id, fetchCompletion]);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    load().finally(() => setLoading(false));
    const ch = supabase
      .channel(`track_${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load]);

  // Live provider location: load once + subscribe to updates while job is active
  useEffect(() => {
    const pid = job?.provider_id;
    const active = job && ["assigned","en_route","arrived","in_progress"].includes(job.status);
    if (!pid || !active) { setProviderLoc(null); return; }
    let cancelled = false;
    supabase.from("provider_locations").select("lat,lng,updated_at").eq("provider_id", pid).maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setProviderLoc(data as typeof providerLoc); });
    const ch = supabase
      .channel(`ploc_${pid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "provider_locations", filter: `provider_id=eq.${pid}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { lat: number; lng: number; updated_at: string } | undefined;
          if (row) setProviderLoc({ lat: Number(row.lat), lng: Number(row.lng), updated_at: row.updated_at });
        })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [job?.provider_id, job?.status, job]);

  const isProvider = !!(job?.provider_id && user?.id === job.provider_id);
  const stageIdx = job ? STAGES.findIndex((s) => s.key === job.status) : -1;
  const fmt = (c: number | null) => c ? `$${(c/100).toFixed(0)}` : "—";

  const advance = async (next: "en_route" | "arrived" | "in_progress") => {
    if (!job) return;
    try {
      await updateStatus({ data: { job_id: job.id, status: next } });
      toast.success(`Marked ${next.replace("_"," ")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const cancel = async () => {
    if (!job) return;
    if (!confirm("Cancel this job?")) return;
    try {
      await updateStatus({ data: { job_id: job.id, status: "cancelled" } });
      nav({ to: "/jobs" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    }
  };

  if (loading) {
    return <MobileShell><div className="grid place-items-center h-screen text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin"/></div></MobileShell>;
  }
  if (!job) {
    return <MobileShell><div className="px-5 pt-20 text-center text-muted-foreground">Job not found.</div></MobileShell>;
  }

  const initials = (providerName ?? "··").split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
  const nextAction = (() => {
    if (job.status === "assigned") return { label: "Start trip", next: "en_route" as const };
    if (job.status === "en_route") return { label: "I've arrived", next: "arrived" as const };
    if (job.status === "arrived") return { label: "Start work", next: "in_progress" as const };
    return null;
  })();

  return (
    <MobileShell>
      <div className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 30% 40%, oklch(0.30 0.10 275 / 0.6), transparent 50%), radial-gradient(circle at 70% 70%, oklch(0.25 0.08 290 / 0.4), transparent 50%), oklch(0.10 0.04 270)",
        }}>
          <svg className="w-full h-full opacity-30" viewBox="0 0 400 400">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.5 0.1 275)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
            <path d="M 0 200 Q 150 180 200 220 T 400 200" stroke="oklch(0.62 0.22 275)" strokeWidth="3" fill="none" strokeDasharray="8 4"/>
          </svg>
        </div>
        <div className="absolute top-12 left-5 right-5 flex justify-between">
          <Link to={isProvider ? "/provider/dashboard" : "/jobs"} className="w-10 h-10 glass-strong rounded-full grid place-items-center">←</Link>
          <div className="glass-strong rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold capitalize"><Clock className="w-4 h-4 text-primary"/>{job.status.replace("_"," ")}</div>
        </div>
        {providerLoc && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <span className="relative flex w-4 h-4">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping"/>
              <span className="relative inline-flex rounded-full h-4 w-4 gradient-primary shadow-glow border-2 border-background"/>
            </span>
            <span className="glass-strong rounded-full px-2.5 py-1 text-[10px] font-medium tabular-nums">
              {providerLoc.lat.toFixed(4)}, {providerLoc.lng.toFixed(4)} · live
            </span>
          </div>
        )}
      </div>

      <div className="-mt-8 relative bg-background rounded-t-3xl border-t border-white/5 px-5 pt-5 pb-32">
        <div className="w-12 h-1 rounded-full bg-white/15 mx-auto mb-5"/>

        {job.provider_id && (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full gradient-primary grid place-items-center font-semibold text-primary-foreground shadow-glow">{initials}</div>
            <div className="flex-1">
              <div className="font-semibold">{providerName ?? "Provider"}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-warning text-warning"/>5.0
                <span className="flex items-center gap-0.5 text-success"><Shield className="w-3 h-3"/>Verified</span>
              </div>
            </div>
            <Link to="/chat" search={{ id: job.id } as never} className="w-10 h-10 rounded-full bg-secondary grid place-items-center"><MessageSquare className="w-4 h-4"/></Link>
            <button className="w-10 h-10 rounded-full bg-secondary grid place-items-center"><Phone className="w-4 h-4"/></button>
          </div>
        )}

        <div className="mt-5 glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-[10px] font-medium">
            {STAGES.map((s, i) => {
              const done = i <= stageIdx;
              const active = i === stageIdx;
              return (
                <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5 relative">
                  {i > 0 && <div className={`absolute right-1/2 top-2 w-full h-0.5 ${done ? "bg-primary" : "bg-white/10"}`}/>}
                  <div className={`relative w-4 h-4 rounded-full ${done ? "gradient-primary shadow-glow" : "bg-white/15"} ${active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}/>
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 gradient-card rounded-2xl p-4 border border-white/5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Job</div>
          <div className="font-semibold mt-1">{job.scope_title ?? "Job"}</div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">{job.address}</div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-muted-foreground">{isProvider ? "Payout" : "Fixed price"}</span>
            <span className="font-bold">{fmt(job.price_cents)}</span>
          </div>
        </div>

        {/* Provider transition actions */}
        {isProvider && nextAction && (
          <button
            onClick={() => advance(nextAction.next)}
            className="mt-4 w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow"
          >
            {nextAction.label}
          </button>
        )}

        {/* Provider: submit completion proof */}
        {isProvider && job.status === "in_progress" && (
          <CompletionForm
            jobId={job.id}
            userId={user!.id}
            onDone={() => load()}
            onSubmit={(payload) => submitDone({ data: payload })}
          />
        )}

        {/* Existing completion proof view */}
        {(job.status === "completed" || completion) && completion && (
          <div className="mt-5 glass-strong rounded-2xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Proof of completion</div>
            {proofUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {proofUrls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden border border-white/5">
                    <img src={u} alt="" className="w-full h-full object-cover"/>
                  </a>
                ))}
              </div>
            )}
            {completion.provider_notes && (
              <div className="mt-3 text-sm text-muted-foreground">"{completion.provider_notes}"</div>
            )}
            {completion.rating && (
              <div className="mt-3 flex items-center gap-1 text-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < (completion.rating ?? 0) ? "fill-warning text-warning" : "text-muted-foreground"}`}/>
                ))}
                {completion.review && <span className="ml-2 text-muted-foreground">— "{completion.review}"</span>}
              </div>
            )}
          </div>
        )}

        {/* Customer: rating */}
        {!isProvider && job.status === "completed" && completion && !completion.rating && (
          <RatingForm onSubmit={async (rating, review) => {
            try {
              await submitRate({ data: { job_id: job.id, rating, review } });
              toast.success("Thanks for rating!");
              load();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Rating failed");
            }
          }}/>
        )}

        {!isProvider && job.status !== "completed" && job.status !== "cancelled" && (
          <button onClick={cancel} className="mt-3 w-full text-sm text-destructive py-3">Cancel job</button>
        )}
      </div>
    </MobileShell>
  );
}

function CompletionForm({
  jobId,
  userId,
  onSubmit,
  onDone,
}: {
  jobId: string;
  userId: string;
  onSubmit: (p: { job_id: string; proof_paths: string[]; provider_notes?: string | null }) => Promise<unknown>;
  onDone: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<{ path: string; url: string }[]>([]);
  const [notes, setNotes] = useState("");

  const pick = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const next: { path: string; url: string }[] = [];
      for (const file of Array.from(files).slice(0, 10 - items.length)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/completion/${jobId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("job-media").upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data: s } = await supabase.storage.from("job-media").createSignedUrl(path, 3600);
        next.push({ path, url: s?.signedUrl ?? "" });
      }
      setItems((m) => [...m, ...next]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (path: string) => {
    await supabase.storage.from("job-media").remove([path]);
    setItems((m) => m.filter((x) => x.path !== path));
  };

  const submit = async () => {
    if (items.length === 0) return toast.error("Add at least one photo");
    setSubmitting(true);
    try {
      await onSubmit({ job_id: jobId, proof_paths: items.map((x) => x.path), provider_notes: notes.trim() || null });
      toast.success("Job marked complete");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 glass-strong rounded-2xl p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Finish the job</div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)}/>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {items.map((m) => (
          <div key={m.path} className="relative aspect-square rounded-xl overflow-hidden border border-white/5">
            <img src={m.url} alt="" className="w-full h-full object-cover"/>
            <button onClick={() => remove(m.path)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 grid place-items-center"><X className="w-3 h-3 text-white"/></button>
          </div>
        ))}
        {items.length < 10 && (
          <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-white/15 grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5"/>}
          </button>
        )}
      </div>
      <button onClick={() => fileRef.current?.click()} className="mt-2 w-full glass rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm"><Camera className="w-4 h-4"/>Add proof photos</button>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes for the customer (optional)"
        rows={3}
        maxLength={1000}
        className="mt-3 w-full glass rounded-xl p-3 text-sm bg-transparent outline-none resize-none"
      />
      <button
        onClick={submit}
        disabled={submitting || uploading || items.length === 0}
        className="mt-3 w-full gradient-success text-white font-semibold py-4 rounded-2xl shadow-glow disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Mark complete"}
      </button>
    </div>
  );
}

function RatingForm({ onSubmit }: { onSubmit: (rating: number, review: string | null) => Promise<void> }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <div className="mt-5 glass-strong rounded-2xl p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">How did it go?</div>
      <div className="flex justify-center gap-2 my-3">
        {[1,2,3,4,5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className="p-1">
            <Star className={`w-9 h-9 transition ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}/>
          </button>
        ))}
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Leave a review (optional)"
        rows={3}
        maxLength={1000}
        className="w-full glass rounded-xl p-3 text-sm bg-transparent outline-none resize-none"
      />
      <button
        onClick={async () => {
          if (rating === 0) return toast.error("Pick a rating");
          setSubmitting(true);
          try { await onSubmit(rating, review.trim() || null); } finally { setSubmitting(false); }
        }}
        disabled={submitting}
        className="mt-3 w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit rating"}
      </button>
    </div>
  );
}
