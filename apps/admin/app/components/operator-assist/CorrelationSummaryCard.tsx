"use client";

import { AssistCard, AssistList, AssistMetricGrid } from "@/app/components/operator-assist/AssistCard";

export function CorrelationSummaryCard({
  title,
  generatedAt,
  summary,
  metrics,
  sourceReasoning,
  safetyGuardrails,
}: {
  title: string;
  generatedAt: string;
  summary: string;
  metrics: Array<{ label: string; value: string | number }>;
  sourceReasoning: string[];
  safetyGuardrails: string[];
}) {
  return (
    <AssistCard title={title} generatedAt={generatedAt} badge="Summary only correlation">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-200">
        {summary}
      </div>
      <AssistMetricGrid metrics={metrics} />
      <AssistList title="Correlation reasoning" items={sourceReasoning} tone="cyan" />
      <AssistList title="Safety guardrails" items={safetyGuardrails} tone="rose" />
    </AssistCard>
  );
}
