"use client";

import { AssistCard, AssistList, AssistMetricGrid } from "@/app/components/operator-assist/AssistCard";

export function QueueAssistSummary({
  title,
  generatedAt,
  summary,
  metrics,
  sourceReasoning,
  warnings,
  recommendations,
}: {
  title: string;
  generatedAt: string;
  summary: string;
  metrics: Array<{ label: string; value: string | number }>;
  sourceReasoning: string[];
  warnings: string[];
  recommendations: string[];
}) {
  return (
    <AssistCard title={title} generatedAt={generatedAt}>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-200">
        {summary}
      </div>
      <AssistMetricGrid metrics={metrics} />
      <AssistList title="Source reasoning" items={sourceReasoning} tone="cyan" />
      <AssistList title="Backlog warnings" items={warnings} tone="amber" />
      <AssistList title="Escalation recommendations" items={recommendations} tone="slate" />
    </AssistCard>
  );
}
