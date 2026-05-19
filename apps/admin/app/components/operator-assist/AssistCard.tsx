"use client";

export function AssistCard({
  title,
  generatedAt,
  badge = "Advisory only",
  children,
}: {
  title: string;
  generatedAt: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.18em] text-cyan-400">{title}</div>
          <div className="mt-2 text-xs text-slate-400">
            Snapshot: {generatedAt}
          </div>
        </div>
        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          {badge}
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function AssistMetricGrid({
  metrics,
}: {
  metrics: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
        >
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {metric.label}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-100">
            {String(metric.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssistList({
  title,
  items,
  tone = "slate",
}: {
  title: string;
  items: string[];
  tone?: "slate" | "amber" | "rose" | "cyan";
}) {
  if (items.length === 0) {
    return null;
  }

  const toneClass =
    tone === "amber"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
      : tone === "rose"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-100"
        : tone === "cyan"
          ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
          : "border-slate-800 bg-slate-950/60 text-slate-200";

  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClass}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
