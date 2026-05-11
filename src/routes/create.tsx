import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { useRef, useState } from "react";
import { ArrowLeft, Camera, MapPin, Zap, Image as ImageIcon, Sparkles, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-state";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({ component: Create });

type Urgency = "standard" | "urgent" | "emergency";

type MediaItem = { path: string; previewUrl: string };

function Create() {
  const nav = useNavigate();
  const { user, profile } = useApp();
  const [desc, setDesc] = useState("");
  const [address, setAddress] = useState(profile?.default_address ?? "");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const libRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user) {
      toast.error("Please sign in to upload photos");
      return;
    }
    setUploading(true);
    try {
      const next: MediaItem[] = [];
      for (const file of Array.from(files).slice(0, 10 - media.length)) {
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("job-media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });
        if (error) throw error;
        const { data: signed, error: signErr } = await supabase.storage
          .from("job-media").createSignedUrl(path, 3600);
        if (signErr) console.warn("sign url failed", signErr.message);
        next.push({ path, previewUrl: signed?.signedUrl ?? "" });
      }
      setMedia((m) => [...m, ...next]);
      if (next.length > 0) toast.success(`Uploaded ${next.length} file${next.length > 1 ? "s" : ""}`);
    } catch (e) {
      console.error("[upload] failed", e);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (libRef.current) libRef.current.value = "";
      if (camRef.current) camRef.current.value = "";
    }
  };

  const removeMedia = async (path: string) => {
    await supabase.storage.from("job-media").remove([path]);
    setMedia((m) => m.filter((x) => x.path !== path));
  };

  const submit = () => {
    if (desc.trim().length < 5) return toast.error("Please describe what you need");
    if (address.trim().length < 3) return toast.error("Enter a service address");
    const params = new URLSearchParams({
      desc: desc.trim(),
      address: address.trim(),
      urgency,
      media: media.map((m) => m.path).join(","),
    });
    nav({ to: "/scope", search: () => Object.fromEntries(params) as Record<string, string> });
  };

  return (
    <MobileShell hideNav>
      <StatusBar
        title="New job"
        back={<Link to="/" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}
      />

      <div className="px-5 pt-5 pb-8 space-y-6">
        <div className="fade-up">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Describe the task</label>
          <div className="mt-2 glass-strong rounded-3xl p-4">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Mount a 65 inch TV above the fireplace, drywall"
              rows={4}
              maxLength={2000}
              className="w-full bg-transparent resize-none outline-none text-base placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="fade-up" style={{ animationDelay: "60ms" }}>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Photos & video</label>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => onPickFiles(e.target.files)} />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {media.map((m) => (
              <div key={m.path} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5">
                {m.previewUrl ? (
                  <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-3xl">📎</div>
                )}
                <button onClick={() => removeMedia(m.path)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 grid place-items-center">
                  <X className="w-3 h-3 text-white"/>
                </button>
              </div>
            ))}
            {media.length < 10 && (
              <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-white/15 grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5" />}
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => fileRef.current?.click()} className="flex-1 glass rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm"><Camera className="w-4 h-4"/>Camera</button>
            <button onClick={() => fileRef.current?.click()} className="flex-1 glass rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm"><ImageIcon className="w-4 h-4"/>Library</button>
          </div>
        </div>

        <div className="fade-up" style={{ animationDelay: "120ms" }}>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Service address</label>
          <div className="mt-2 glass-strong rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 grid place-items-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city"
              className="flex-1 bg-transparent outline-none text-sm"
              maxLength={500}
            />
          </div>
        </div>

        <div className="fade-up" style={{ animationDelay: "180ms" }}>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">When</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              { v: "standard", label: "Standard", sub: "Within 3 days", emergency: false },
              { v: "urgent", label: "Urgent", sub: "< 4 hours", emergency: false },
              { v: "emergency", label: "Emergency", sub: "Now", emergency: true },
            ] as const).map((o) => (
              <button
                key={o.v}
                onClick={() => setUrgency(o.v)}
                className={cn(
                  "rounded-2xl p-3 text-left border transition-all",
                  urgency === o.v
                    ? o.emergency
                      ? "gradient-emergency border-transparent shadow-glow text-white"
                      : "gradient-primary border-transparent shadow-glow text-primary-foreground"
                    : "glass border-white/5"
                )}
              >
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  {o.emergency && <Zap className="w-3.5 h-3.5"/>}
                  {o.label}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">{o.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={uploading}
          className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow flex items-center justify-center gap-2 fade-up disabled:opacity-60"
          style={{ animationDelay: "240ms" }}
        >
          <Sparkles className="w-5 h-5"/> Analyze with AI
        </button>
      </div>
    </MobileShell>
  );
}
