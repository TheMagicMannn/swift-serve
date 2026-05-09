import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { RoleSwitch } from "@/components/RoleSwitch";
import { Star, BadgeCheck, LogOut, X, Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProviderProfile, upsertProviderProfile } from "@/lib/dispatch.functions";
import { useApp } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/provider/profile")({ component: ProviderProfile });

const SUGGESTED = ["TV mounting","Drywall","Electrical","Plumbing","Furniture","Smart home","Appliance","Cleaning","Moving","HVAC"];

function ProviderProfile() {
  const { profile, signOut } = useApp();
  const fetchPp = useServerFn(getMyProviderProfile);
  const upsert = useServerFn(upsertProviderProfile);

  const [skills, setSkills] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState("");
  const [bio, setBio] = useState("");
  const [radius, setRadius] = useState(10);
  const [rating, setRating] = useState(5);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState("");

  useEffect(() => {
    (async () => {
      const p = await fetchPp();
      if (p) {
        setSkills(p.skills ?? []);
        setVehicle(p.vehicle ?? "");
        setBio(p.bio ?? "");
        setRadius(Number(p.service_radius_km) ?? 10);
        setRating(Number(p.rating) ?? 5);
        setCompleted(p.completed_count ?? 0);
      }
      setLoading(false);
    })();
  }, [fetchPp]);

  const save = async () => {
    setSaving(true);
    try {
      await upsert({ data: { skills, vehicle: vehicle || null, bio: bio || null, service_radius_km: radius } });
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || skills.includes(v)) return;
    setSkills([...skills, v]);
    setAdding("");
  };

  const initials = (profile?.full_name ?? "··").split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();

  if (loading) return <MobileShell><div className="grid place-items-center h-screen text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin"/></div></MobileShell>;

  return (
    <MobileShell>
      <StatusBar title="Profile" action={<RoleSwitch/>} />
      <div className="px-5 pt-4 space-y-5 pb-6">
        <div className="glass-strong rounded-3xl p-5 fade-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary grid place-items-center text-xl font-bold text-primary-foreground shadow-glow">{initials}</div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-lg">{profile?.full_name ?? "Provider"}</span>
                <BadgeCheck className="w-4 h-4 text-primary"/>
              </div>
              <div className="text-xs text-muted-foreground">Provider account</div>
              <div className="flex items-center gap-1 text-xs mt-1"><Star className="w-3 h-3 fill-warning text-warning"/>{rating.toFixed(2)} · {completed} jobs</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 fade-up" style={{ animationDelay: "60ms" }}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Skills</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map(s => (
              <span key={s} className="text-xs glass-strong px-3 py-1.5 rounded-full flex items-center gap-1.5">
                {s}
                <button onClick={() => setSkills(skills.filter(x=>x!==s))}><X className="w-3 h-3"/></button>
              </span>
            ))}
            {skills.length === 0 && <span className="text-xs text-muted-foreground">Add skills to receive matching offers.</span>}
          </div>
          <div className="flex gap-2">
            <input
              value={adding}
              onChange={e=>setAdding(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter") addSkill(adding);}}
              placeholder="Add a skill"
              className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm outline-none"
            />
            <button onClick={()=>addSkill(adding)} className="w-10 h-10 rounded-xl gradient-primary grid place-items-center text-primary-foreground"><Plus className="w-4 h-4"/></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SUGGESTED.filter(s=>!skills.includes(s)).map(s=>(
              <button key={s} onClick={()=>addSkill(s)} className="text-[10px] text-muted-foreground border border-white/10 px-2 py-1 rounded-full">+ {s}</button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 space-y-3 fade-up" style={{ animationDelay: "120ms" }}>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold">Service radius ({radius} km)</label>
            <input type="range" min={1} max={50} value={radius} onChange={e=>setRadius(Number(e.target.value))} className="w-full mt-2"/>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold">Vehicle</label>
            <input value={vehicle} onChange={e=>setVehicle(e.target.value)} placeholder="e.g. Pickup truck" className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm mt-1 outline-none"/>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold">Bio</label>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Tell customers about your experience" className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm mt-1 outline-none resize-none"/>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="w-full gradient-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-glow disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin"/>}
          Save profile
        </button>

        <button onClick={signOut} className="w-full glass rounded-2xl py-3.5 flex items-center justify-center gap-2 text-destructive text-sm font-medium">
          <LogOut className="w-4 h-4"/>Sign out
        </button>
      </div>
    </MobileShell>
  );
}
