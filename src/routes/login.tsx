import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Apple, Mail, Phone, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <MobileShell hideNav>
      <div className="min-h-screen flex flex-col px-6 pt-20 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl gradient-primary grid place-items-center shadow-glow mb-6">
            <Sparkles className="w-10 h-10 text-primary-foreground"/>
          </div>
          <h1 className="text-3xl font-bold text-balance">Local help, dispatched in seconds.</h1>
          <p className="text-muted-foreground mt-3 text-sm text-balance">Describe what you need. AI scopes it. A vetted pro shows up.</p>
        </div>

        <div className="space-y-2.5">
          <button className="w-full bg-white text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Apple className="w-5 h-5"/>Continue with Apple
          </button>
          <button className="w-full glass-strong font-medium py-4 rounded-2xl flex items-center justify-center gap-2">
            <Mail className="w-5 h-5"/>Continue with Google
          </button>
          <button className="w-full glass-strong font-medium py-4 rounded-2xl flex items-center justify-center gap-2">
            <Phone className="w-5 h-5"/>Continue with phone
          </button>
          <Link to="/" className="block w-full text-center text-sm text-muted-foreground pt-3">Skip for demo →</Link>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-5 text-balance">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </MobileShell>
  );
}
