"use client";

import { AssistCard, AssistList } from "@/app/components/operator-assist/AssistCard";

export function IncidentAssistSummary({
  generatedAt,
  affectedSystems,
  impactedFlows,
  correlatedFailures,
  unresolvedRisks,
  nextChecks,
  rollbackReminders,
}: {
  generatedAt: string;
  affectedSystems: string[];
  impactedFlows: string[];
  correlatedFailures: string[];
  unresolvedRisks: string[];
  nextChecks: string[];
  rollbackReminders: string[];
}) {
  return (
    <AssistCard title="Incident assistance surface" generatedAt={generatedAt}>
      <AssistList title="Affected systems" items={affectedSystems} tone="slate" />
      <AssistList title="Likely impacted flows" items={impactedFlows} tone="slate" />
      <AssistList title="Recent correlated failures" items={correlatedFailures} tone="cyan" />
      <AssistList title="Unresolved risk indicators" items={unresolvedRisks} tone="amber" />
      <AssistList title="Suggested next checks" items={nextChecks} tone="slate" />
      <AssistList title="Rollback-risk reminders" items={rollbackReminders} tone="rose" />
    </AssistCard>
  );
}
