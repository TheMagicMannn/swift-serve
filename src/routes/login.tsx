import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Apple, Mail, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const { session } = useApp();
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) nav({ to: "/" });
  }, [session, nav]);

  const oauth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || `Couldn't sign in with ${provider}`);
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      nav({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
      setLoading(false);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell hideNav>
      <div className="min-h-screen flex flex-col px-6 pt-16 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl gradient-primary grid place-items-center shadow-glow mb-6">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-balance">Local help, dispatched in seconds.</h1>
          <p className="text-muted-foreground mt-3 text-sm text-balance">
            Describe what you need. AI scopes it. A vetted pro shows up.
          </p>
        </div>

        {mode === "choose" ? (
          <div className="space-y-2.5">
            <button
              disabled={loading}
              onClick={() => oauth("apple")}
              className="w-full bg-white text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Apple className="w-5 h-5" />Continue with Apple
            </button>
            <button
              disabled={loading}
              onClick={() => oauth("google")}
              className="w-full glass-strong font-medium py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Mail className="w-5 h-5" />Continue with Google
            </button>
            <button
              onClick={() => setMode("email")}
              className="w-full glass-strong font-medium py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              Continue with email
            </button>
          </div>
        ) : (
          <form onSubmit={submitEmail} className="space-y-2.5">
            {isSignup && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-strong rounded-2xl px-4 py-4 outline-none"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-strong rounded-2xl px-4 py-4 outline-none"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-strong rounded-2xl px-4 py-4 outline-none"
            />
            <button
              disabled={loading}
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignup ? "Create account" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setIsSignup((s) => !s)}
              className="w-full text-center text-sm text-muted-foreground py-2"
            >
              {isSignup ? "Have an account? Sign in" : "New here? Create an account"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="w-full text-center text-xs text-muted-foreground"
            >
              ← Other options
            </button>
          </form>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-5 text-balance">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </MobileShell>
  );
}
