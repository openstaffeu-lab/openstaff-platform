import Link from "next/link";
import { publicEnvironmentStatus, publicRouteStatuses } from "../../lib/app-status";

const statusStyles = {
  implemented: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-800",
} as const;

const statusLabel = {
  implemented: "Implemented",
  in_progress: "In progress",
  error: "Error",
} as const;

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-[#263238]">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-black uppercase tracking-[0.18em] text-[#00A85A]">
                Internal status board
              </p>
              <h1 className="mt-3 text-4xl font-black text-[#1A237E]">Public application status</h1>
              <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
                This page summarizes the real implementation state of the active public-facing
                routes in this repository and the intended API targets for local and production.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#1A237E] shadow-sm"
            >
              Back to home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard title="Local API target" value={publicEnvironmentStatus.localApiUrl} />
          <StatusCard title="Production API target" value={publicEnvironmentStatus.productionApiUrl} />
          <StatusCard title="Auth mode" value={publicEnvironmentStatus.authMode} />
        </div>

        <div className="grid gap-4">
          {publicRouteStatuses.map((item) => (
            <div key={item.path} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#1A237E]">{item.label}</h2>
                  <p className="mt-2 text-sm text-slate-500">{item.path}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{item.note}</p>
                </div>
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${statusStyles[item.status]}`}
                >
                  {statusLabel[item.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="font-black uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className="mt-3 text-sm leading-6 text-slate-700">{value}</div>
    </div>
  );
}
