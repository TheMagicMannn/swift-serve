import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { RoleSwitch } from "@/components/RoleSwitch";
import { ChevronRight, MapPin, CreditCard, Bell, Shield, HelpCircle, Settings, LogOut, Loader2, Check } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: Profile });

const items = [
  { icon: MapPin, label: "Saved addresses" },
  { icon: CreditCard, label: "Payment methods" },
  { icon: Bell, label: "Notifications" },
  { icon: Shield, label: "Privacy & safety" },
  { icon: Settings, label: "Preferences" },
  { icon: HelpCircle, label: "Help & support" },
];

function Profile() {
  const { user, profile, signOut, refreshProfile, role } = useApp();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setAddress(profile?.default_address ?? "");
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone, default_address: address })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    setEditing(false);
    toast.success("Profile updated");
  };

  const initial = (profile?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <MobileShell>
      <StatusBar title="Profile" action={<RoleSwitch />} />
      <div className="px-5 pt-4 pb-8">
        <div className="glass-strong rounded-3xl p-5 flex items-center gap-4 shadow-card">
          <div className="w-16 h-16 rounded-full gradient-primary grid place-items-center text-xl font-semibold text-primary-foreground shadow-glow">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg truncate">{profile?.full_name || "Unnamed"}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            <div className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider font-bold">{role}</div>
          </div>
          <button onClick={() => setEditing((v) => !v)} className="text-xs text-primary font-medium">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing && (
          <div className="glass rounded-2xl p-4 mt-4 space-y-3">
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field label="Default address" value={address} onChange={setAddress} />
            <button
              onClick={save}
              disabled={saving}
              className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}

        <div className="mt-5 glass rounded-2xl divide-y divide-white/5">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <button key={it.label} className="w-full flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-secondary grid place-items-center"><Icon className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{it.label}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <button
          onClick={async () => { await signOut(); nav({ to: "/login" }); }}
          className="mt-5 w-full glass rounded-2xl py-3.5 flex items-center justify-center gap-2 text-destructive text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </div>
    </MobileShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
