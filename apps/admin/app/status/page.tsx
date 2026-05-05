import Link from "next/link";
import { adminEnvironmentStatus, adminRouteStatuses } from "@/lib/app-status";

const statusStyles = {
  implemented: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  in_progress: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-200",
} as const;

const statusLabel = {
  implemented: "Implemented",
  in_progress: "In progress",
  error: "Error",
} as const;

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">
                Internal status board
              </div>
              <h1 className="mt-2 text-3xl font-semibold">Admin application status</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                This page reflects the current implementation state of the active admin routes in
                this repository, plus the intended local and production API targets.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-500/40 hover:text-white"
            >
              Back to home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard title="Local API target" value={adminEnvironmentStatus.localApiUrl} />
          <StatusCard title="Production API target" value={adminEnvironmentStatus.productionApiUrl} />
          <StatusCard title="Auth mode" value={adminEnvironmentStatus.authMode} />
        </div>

        <div className="grid gap-4">
          {adminRouteStatuses.map((item) => (
            <div
              key={item.path}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{item.label}</h2>
                  <p className="mt-2 text-sm text-slate-400">{item.path}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{item.note}</p>
                </div>
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusStyles[item.status]}`}
                >
                  {statusLabel[item.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-sm uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className="mt-3 text-sm leading-6 text-slate-200">{value}</div>
    </div>
  );
}
