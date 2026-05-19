"use client";

import { AssistCard, AssistList, AssistMetricGrid } from "@/app/components/operator-assist/AssistCard";

export function DigestSection({
  title,
  generatedAt,
  summary,
  metrics,
  sourceReasoning,
  actionPriorities,
}: {
  title: string;
  generatedAt: string;
  summary: string;
  metrics: Array<{ label: string; value: string | number }>;
  sourceReasoning: string[];
  actionPriorities: string[];
}) {
  return (
    <AssistCard title={title} generatedAt={generatedAt} badge="Digest">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-200">
        {summary}
      </div>
      <AssistMetricGrid metrics={metrics} />
      <AssistList title="Source metrics" items={sourceReasoning} tone="cyan" />
      <AssistList title="Action priorities" items={actionPriorities} tone="slate" />
    </AssistCard>
  );
}
