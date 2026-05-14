import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, StatusBar } from "@/components/MobileShell";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyJobs } from "@/lib/jobs.functions";
import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/jobs")({ component: Jobs });

const statusColor: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  scoping: "bg-primary/20 text-primary",
  dispatching: "bg-primary/20 text-primary",
  assigned: "bg-primary/20 text-primary",
  en_route: "bg-warning/20 text-warning",
  arrived: "bg-warning/20 text-warning",
  in_progress: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

type Filter = "All" | "Active" | "Completed" | "Drafts";

function Jobs() {
  const { user } = useApp();
  const fetchJobs = useServerFn(listMyJobs);
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ["jobs", "mine", user?.id],
    queryFn: () => fetchJobs(),
    enabled: !!user,
    retry: 1,
  });
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = (jobs ?? []).filter((j) => {
    if (filter === "All") return true;
    if (filter === "Drafts") return j.status === "draft";
    if (filter === "Completed") return j.status === "completed";
    return !["draft", "completed", "cancelled"].includes(j.status);
  });

  return (
    <MobileShell>
      <StatusBar title="Your jobs" />
      <div className="px-5 pt-4 pb-8">
        <div className="flex gap-2 mb-4">
          {(["All", "Active", "Completed", "Drafts"] as Filter[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === t ? "gradient-primary text-primary-foreground shadow-glow" : "glass text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto"/>
            <p className="mt-3 text-sm text-muted-foreground">{(error as Error).message || "Couldn't load your jobs"}</p>
            <button onClick={() => refetch()} className="mt-4 px-5 py-2.5 rounded-2xl glass-strong text-sm font-medium">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">No jobs yet</p>
            <Link to="/create" className="inline-block mt-4 px-5 py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold">Create a job</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((j) => (
              <Link
                to="/track"
                search={{ id: j.id } as never}
                key={j.id}
                className="block glass-strong rounded-2xl p-4 fade-up"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor[j.status] || "bg-secondary"}`}>
                    {j.status.replace("_", " ")}
                  </span>
                  {j.price_cents != null && <span className="text-sm font-bold">${(j.price_cents / 100).toFixed(0)}</span>}
                </div>
                <div className="font-semibold mt-2 truncate">{j.scope_title ?? j.description}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {j.address}{j.scope_duration_minutes ? ` · ${j.scope_duration_minutes}m` : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
