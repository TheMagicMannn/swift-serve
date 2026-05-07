import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { ArrowLeft, Star, Check } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dispatch")({ component: Dispatch });

const candidates = [
  { name: "Marcus T.", avatar: "MT", rating: 4.96, jobs: 312, eta: "12 min", match: 98, accepted: true },
  { name: "Sara V.", avatar: "SV", rating: 4.91, jobs: 188, eta: "18 min", match: 92, accepted: true },
  { name: "Diane L.", avatar: "DL", rating: 4.92, jobs: 487, eta: "25 min", match: 88, accepted: false },
];

function Dispatch() {
  const nav = useNavigate();
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const ids = candidates.map((_, i) => setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 700 + i * 900));
    return () => ids.forEach(clearTimeout);
  }, []);

  return (
    <MobileShell hideNav>
      <StatusBar title="Finding providers" back={<Link to="/scope" className="w-9 h-9 rounded-full bg-secondary grid place-items-center"><ArrowLeft className="w-4 h-4"/></Link>}/>

      <div className="px-5 pt-4 pb-32">
        {/* Radar */}
        <div className="relative h-48 grid place-items-center mb-4">
          <div className="absolute w-40 h-40 rounded-full border border-primary/20 animate-ping" style={{animationDuration:"3s"}}/>
          <div className="absolute w-28 h-28 rounded-full border border-primary/30 animate-ping" style={{animationDuration:"2.5s",animationDelay:"0.5s"}}/>
          <div className="w-16 h-16 rounded-full gradient-primary grid place-items-center shadow-glow text-2xl">📍</div>
        </div>

        <div className="text-center mb-4 fade-up">
          <div className="text-sm text-muted-foreground">8 nearby providers notified</div>
          <div className="text-2xl font-semibold mt-1">{Math.min(revealed, 2)} accepted</div>
        </div>

        <div className="space-y-2.5">
          {candidates.map((p, i) => (
            <div
              key={p.name}
              className={`glass-strong rounded-2xl p-4 flex items-center gap-3 transition-all duration-500 ${i < revealed ? "opacity-100 translate-y-0" : "opacity-30 translate-y-2"}`}
            >
              <div className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-sm font-semibold text-primary-foreground shadow-glow">{p.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{p.name}</span>
                  {i < revealed && p.accepted && <span className="text-[10px] gradient-success text-white px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Check className="w-2.5 h-2.5"/>ACCEPTED</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-warning text-warning"/>{p.rating}</span>
                  <span>·</span><span>{p.jobs} jobs</span>
                  <span>·</span><span>{p.eta}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">match</div>
                <div className="font-bold text-success">{p.match}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {revealed > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 glass-strong fade-up">
          <button onClick={() => nav({ to: "/track" })} className="w-full gradient-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow">
            Confirm Marcus T. · ETA 12 min
          </button>
        </div>
      )}
    </MobileShell>
  );
}
