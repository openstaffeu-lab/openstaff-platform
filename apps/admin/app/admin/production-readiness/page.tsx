"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AssistCard,
  AssistList,
  CorrelationSummaryCard,
  DigestSection,
  IncidentAssistSummary,
  QueueAssistSummary,
} from "@/app/components/operator-assist";
import { buildApiUrl } from "@/lib/api";
import { getAdminRuntimeConfigSummary } from "@/lib/runtime-config";

type StatusPayload = {
  status: string;
  api: string;
  db: string;
  service: string;
  timestamp: string;
  runtime?: {
    nodeEnv?: string;
    port?: number;
    authMode?: string;
    databaseConfigured?: boolean;
    jwtSecretConfigured?: boolean;
    storageBucketConfigured?: boolean;
  };
  featureFlags?: Record<string, boolean>;
  readiness?: {
    warnings?: string[];
    errors?: string[];
  };
  integrations?: Record<string, unknown>;
  queues?: Record<string, unknown>;
  rolloutIntelligence?: {
    windowHours?: number;
    funnel?: Record<string, number>;
    conversions?: Record<string, number>;
    operations?: {
      onboarding?: Record<string, number>;
      moderation?: Record<string, number>;
      upgrades?: Record<string, number>;
      failures?: Record<string, number>;
      feedback?: Record<string, number>;
      support?: Record<string, number>;
      aging?: Record<string, number | string | null>;
      adoptionReadiness?: {
        status?: string;
        reasons?: string[];
      };
      recentOperatorActions?: Array<{
        createdAt: string;
        action: string;
        category: string | null;
        entityType: string;
        actorEmail: string;
        actorRole: string;
      }>;
    };
  };
};

export default function ProductionReadinessPage() {
  const localRuntime = useMemo(() => getAdminRuntimeConfigSummary(), []);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(buildApiUrl("/status"), {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Status request failed with ${response.status}`);
        }

        const payload = (await response.json()) as StatusPayload;
        if (!cancelled) {
          setStatus(payload);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Status unavailable");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const warnings = status?.readiness?.warnings ?? [];
  const errors = status?.readiness?.errors ?? [];
  const integrations = status?.integrations as
    | {
        commercial?: {
          launchMode?: string;
          publicUpgradeFlow?: string;
          operatorReviewRequired?: boolean;
          billingMode?: string;
          emailDelivery?: string;
          smsDelivery?: string;
        };
        billingWebhook?: {
          mode?: string;
        };
        billingPayments?: {
          mode?: string;
        };
      }
    | undefined;
  const commercialLaunchMode = integrations?.commercial?.launchMode ?? "Unknown";
  const rolloutWindowHours = status?.rolloutIntelligence?.windowHours ?? 24;
  const funnel = status?.rolloutIntelligence?.funnel ?? {};
  const conversions = status?.rolloutIntelligence?.conversions ?? {};
  const operations = status?.rolloutIntelligence?.operations;
  const adoptionReadiness = operations?.adoptionReadiness;
  const billingMode =
    integrations?.commercial?.billingMode ??
    integrations?.billingPayments?.mode ??
    commercialLaunchMode;
  const missingCommercialContract =
    !integrations?.commercial?.launchMode || !integrations?.billingWebhook?.mode;
  const blockers = [
    ...errors,
    ...(status?.db === "error" ? ["Database connectivity is failing."] : []),
    ...(status?.runtime?.jwtSecretConfigured === false
      ? ["JWT secrets are not fully configured."]
      : []),
    ...(missingCommercialContract
      ? [
          "Commercial launch contract is not exposed by the active API /status payload yet. Deploy the EXEC-19 readiness contract before calling rollout fully live.",
        ]
      : []),
    ...(integrations?.commercial?.launchMode === "manual_only" &&
    integrations?.commercial?.operatorReviewRequired !== true
      ? [
          "Manual commercial operations are not explicitly marked as operator-reviewed in the active readiness payload.",
        ]
      : []),
  ];
  const generatedAt = formatDateTime(status?.timestamp);
  const moderationPendingTotal = operations?.moderation?.pendingTotal ?? 0;
  const moderationOldestMinutes = operations?.moderation?.oldestPendingMinutes ?? 0;
  const upgradePendingTotal =
    (operations?.upgrades?.pending ?? 0) + (operations?.upgrades?.contacted ?? 0);
  const upgradeOldestMinutes = operations?.upgrades?.oldestOpenMinutes ?? 0;
  const onboardingCompleted24h = funnel.onboardingCompleted24h ?? 0;
  const registerCompleted24h = funnel.registerCompleted24h ?? 0;
  const loginFailures15m = operations?.failures?.loginFailures15m ?? 0;
  const loginFailures24h = operations?.failures?.loginFailures24h ?? 0;
  const rateLimitTriggers15m = operations?.failures?.rateLimitTriggers15m ?? 0;
  const uploadFailures24h = operations?.failures?.uploadFailures24h ?? 0;
  const webhookFailures24h = operations?.failures?.webhookFailures24h ?? 0;
  const supportSignals = operations?.support?.backlogSignals24h ?? 0;
  const operatorEscalations24h = operations?.support?.operatorEscalations24h ?? 0;
  const repeatedConfusion24h = operations?.support?.repeatedConfusion24h ?? 0;
  const failedFlows24h = operations?.support?.failedFlows24h ?? 0;
  const billingConfusion24h = operations?.feedback?.billingConfusion24h ?? 0;
  const moderationConfusion24h = operations?.feedback?.moderationConfusion24h ?? 0;
  const onboardingFriction24h = operations?.feedback?.onboardingFriction24h ?? 0;
  const adoptionReasons = adoptionReadiness?.reasons ?? [];
  const snapshotAgeMinutes = getSnapshotAgeMinutes(status?.timestamp);
  const freshnessState =
    snapshotAgeMinutes === null
      ? "unknown"
      : snapshotAgeMinutes <= 15
        ? "fresh"
        : snapshotAgeMinutes <= 60
          ? "aging"
          : "stale";
  const freshnessSummary =
    freshnessState === "fresh"
      ? `Snapshot freshness is good. The active /status payload is ${formatMinutes(snapshotAgeMinutes)} old.`
      : freshnessState === "aging"
        ? `Snapshot freshness is aging. The active /status payload is ${formatMinutes(snapshotAgeMinutes)} old, so operators should confirm whether the latest queue and incident state still matches this page.`
        : freshnessState === "stale"
          ? `Snapshot freshness is stale. The active /status payload is ${formatMinutes(snapshotAgeMinutes)} old, so summaries should be treated as orientation-only until a newer source snapshot is confirmed.`
          : "Snapshot freshness could not be derived because the active /status timestamp is unavailable.";
  const globalOperationalState =
    blockers.length > 0 || errors.length > 0
      ? "degraded attention"
      : warnings.length > 0 || adoptionReasons.length > 0
        ? "watch closely"
        : "steady";
  const queueState =
    moderationPendingTotal > 0 || upgradePendingTotal > 0 || supportSignals > 0
      ? "active review"
      : "quiet";
  const rolloutState =
    adoptionReasons.length > 0 || warnings.length > 0 || errors.length > 0
      ? "hold and review"
      : "controlled rollout ready";
  const moderationState =
    moderationPendingTotal > 0
      ? `${moderationPendingTotal} pending`
      : "clear";
  const billingState =
    upgradePendingTotal > 0 || webhookFailures24h > 0
      ? "manual review pressure"
      : "manual review quiet";
  const escalationState =
    supportSignals > 0 || operatorEscalations24h > 0
      ? "attention routing needed"
      : "quiet";
  const incidentState =
    errors.length > 0 ||
    warnings.length > 0 ||
    loginFailures15m > 0 ||
    uploadFailures24h > 0 ||
    webhookFailures24h > 0
      ? "needs operator interpretation"
      : "no clear active incident signal";
  const degradedModeState =
    blockers.length > 0 || errors.length > 0
      ? "review degraded-mode posture"
      : "not indicated";
  const unresolvedIncidentWarnings = [
    ...errors,
    ...warnings,
    ...(adoptionReasons.length > 0 ? adoptionReasons : []),
  ];
  const operatorOverloadIndicators = [
    supportSignals >= 6
      ? `Support and escalation pressure is elevated with ${supportSignals} support backlog signals in the last 24 hours.`
      : null,
    operatorEscalations24h >= 2
      ? `${operatorEscalations24h} operator escalation events were recorded in the last 24 hours.`
      : null,
    repeatedConfusion24h >= 3
      ? `${repeatedConfusion24h} repeated confusion reports suggest operators may be re-explaining the same issue.`
      : null,
    moderationPendingTotal >= 10 && moderationOldestMinutes >= 120
      ? `Moderation pressure is elevated because ${moderationPendingTotal} items are pending and the oldest is ${formatMinutes(moderationOldestMinutes)} old.`
      : null,
    upgradePendingTotal >= 5 && upgradeOldestMinutes >= 240
      ? `Billing review pressure is elevated because ${upgradePendingTotal} upgrade requests remain open and the oldest is ${formatMinutes(upgradeOldestMinutes)} old.`
      : null,
  ].filter(Boolean) as string[];
  const operatorAvailabilityState =
    operatorOverloadIndicators.length > 0
      ? "coverage pressure visible"
      : "no visible overload hint";

  const escalationPressureIndicators = [
    operatorEscalations24h > 0
      ? `${operatorEscalations24h} operator escalations were logged in the last 24 hours.`
      : `No operator escalations were logged in the last 24 hours.`,
    failedFlows24h > 0
      ? `${failedFlows24h} failed-flow reports may require owner follow-up before the next rollout step.`
      : `No failed-flow reports were logged in the last 24 hours.`,
    supportSignals > 0
      ? `${supportSignals} support backlog signals suggest active queue pressure that may need coordination.`
      : `Support backlog signals remain quiet in the current 24-hour window.`,
  ];

  const incidentAffectedSystems = [
    ...(loginFailures15m > 0 ? [`Authentication and access paths show ${loginFailures15m} recent login failures in the last 15 minutes.`] : []),
    ...(uploadFailures24h > 0 ? [`Upload and storage workflows show ${uploadFailures24h} failed uploads in the last 24 hours.`] : []),
    ...(webhookFailures24h > 0 ? [`Billing webhook handling shows ${webhookFailures24h} failed webhook events in the last 24 hours.`] : []),
    ...(moderationPendingTotal > 0 ? [`Moderation surfaces currently hold ${moderationPendingTotal} pending review items.`] : []),
    ...(supportSignals > 0 ? [`Support and escalation handling shows ${supportSignals} backlog signals in the last 24 hours.`] : []),
    ...(warnings.length === 0 && errors.length === 0 && loginFailures15m === 0 && uploadFailures24h === 0 && webhookFailures24h === 0
      ? ["No cross-system incident signal is currently obvious in the active `/status` snapshot."]
      : []),
  ];
  const incidentImpactedFlows = [
    ...(loginFailures15m > 0 ? ["Company and worker sign-in may be degraded or noisy, so onboarding conversion should be checked before interpreting demand changes."] : []),
    ...(uploadFailures24h > 0 ? ["Publishing flows may stall before moderation if uploads are failing earlier in the pipeline."] : []),
    ...(webhookFailures24h > 0 ? ["Manual billing follow-up may increase because webhook reconciliation failed recently."] : []),
    ...(moderationPendingTotal > 0 ? ["Public content visibility can lag while moderation backlog remains open."] : []),
    ...(
      incidentAffectedSystems.length === 1 && incidentAffectedSystems[0].includes("No cross-system")
        ? ["No likely operator-visible flow degradation was inferred from the current snapshot."]
        : []
    ),
  ];
  const correlatedFailures = [
    ...(loginFailures15m > 0 && (conversions.registerCompleteToOnboardingPct ?? 0) < 70
      ? [`Auth spikes and onboarding conversion softness are visible together: ${loginFailures15m} login failures in 15m and ${conversions.registerCompleteToOnboardingPct ?? 0}% register-to-onboarding conversion.`]
      : []),
    ...(uploadFailures24h > 0 && moderationPendingTotal > 0
      ? [`Upload failures and moderation delay are both present: ${uploadFailures24h} upload failures in 24h and ${moderationPendingTotal} pending moderation items.`]
      : []),
    ...(webhookFailures24h > 0 && upgradePendingTotal > 0
      ? [`Webhook failures and billing backlog are both present: ${webhookFailures24h} webhook failures in 24h and ${upgradePendingTotal} open upgrade reviews.`]
      : []),
    ...(supportSignals > 0 && adoptionReasons.length > 0
      ? [`Support pressure and rollout warnings are both present: ${supportSignals} support backlog signals and ${adoptionReasons.length} adoption-readiness reasons.`]
      : []),
    ...(loginFailures15m === 0 && uploadFailures24h === 0 && webhookFailures24h === 0 && supportSignals === 0
      ? ["No major multi-signal correlation was inferred from the current snapshot."]
      : []),
  ];
  const incidentNextChecks = [
    ...(loginFailures15m > 0 ? ["Check `/status`, auth-related security events, and recent rate-limit triggers before treating this as user confusion only."] : []),
    ...(uploadFailures24h > 0 ? ["Check upload failure logs, storage delivery health, and whether moderation queues are receiving fewer new items than expected."] : []),
    ...(webhookFailures24h > 0 ? ["Check failed webhook records, pending invoice handling, and whether manual billing review load is rising."] : []),
    ...(moderationPendingTotal > 0 ? ["Check oldest moderation item age and whether the queue is being drained between shifts."] : []),
    ...(supportSignals > 0 ? ["Check support pain points, repeated confusion reports, and unresolved escalation ownership."] : []),
    ...((loginFailures15m === 0 && uploadFailures24h === 0 && webhookFailures24h === 0 && supportSignals === 0)
      ? ["Continue normal readiness monitoring and treat this assistance panel as a summary-only surface."] : []),
  ];
  const rollbackReminders = [
    "This panel may suggest rollback review candidates, but it may not trigger rollback or set severity automatically.",
    "Any rollback discussion still requires operator review of `/health`, `/status`, current incidents, and active rollout state.",
    ...(errors.length > 0 ? ["Readiness errors are present, so rollback risk should be reviewed explicitly rather than inferred from one metric family."] : []),
  ];
  const staleStateIndicators = [
    freshnessSummary,
    freshnessState === "stale"
      ? "Stale-state handling: confirm /health, /status, queue surfaces, and current owner notes before treating this page as current operational truth."
      : "Stale-state handling: the current page remains advisory, but the snapshot age does not currently force a stale-state warning.",
    missingCommercialContract
      ? "Conflicting-state handling: the commercial readiness contract is incomplete in the active payload, so rollout state should be treated as partially unresolved."
      : "Conflicting-state handling: no major readiness-contract mismatch is visible between commercial mode and webhook mode in the active payload.",
  ];
  const priorityStack = [
    ...(blockers.length > 0 ? blockers.map((item) => `Immediate blocker: ${item}`) : []),
    ...(errors.length > 0 ? errors.map((item) => `Readiness error: ${item}`) : []),
    ...operatorOverloadIndicators,
    ...(supportSignals > 0
      ? [`Support attention: ${supportSignals} support backlog signals were logged in the last 24 hours.`]
      : []),
    ...(moderationPendingTotal > 0
      ? [`Moderation attention: ${moderationPendingTotal} items remain pending and the oldest item is ${formatMinutes(moderationOldestMinutes)} old.`]
      : []),
    ...(upgradePendingTotal > 0 || webhookFailures24h > 0
      ? [`Billing attention: ${upgradePendingTotal} open reviews and ${webhookFailures24h} webhook failures are visible in the active snapshot.`]
      : []),
    ...(loginFailures15m > 0 || uploadFailures24h > 0
      ? [`Runtime attention: auth failures / 15m = ${loginFailures15m}, upload failures / 24h = ${uploadFailures24h}.`]
      : []),
  ];
  const attentionRoutingSummary = [
    blockers.length > 0 || errors.length > 0
      ? "Urgent: confirm runtime health, incident state, and current owner coverage before continuing routine queue work."
      : "Urgent: no blocker currently forces automatic interruption of routine queue review.",
    supportSignals > 0 || operatorEscalations24h > 0
      ? "Important: route attention toward support and escalation ownership before creating more parallel investigations."
      : "Important: support and escalation pressure is currently low enough to remain in normal review order.",
    moderationPendingTotal > 0 || upgradePendingTotal > 0
      ? "Queue routing: review the oldest moderation and billing items first so operators do not rebuild the same queue story repeatedly."
      : "Queue routing: no backlog currently suggests special rerouting beyond normal review cadence.",
    freshnessState !== "fresh"
      ? "Freshness routing: verify whether this snapshot still matches live operator context before using it to justify escalation or rollout-state discussion."
      : "Freshness routing: the current snapshot is recent enough to support orientation, but it remains advisory rather than authoritative.",
  ];
  const groupedOperationalSummaries = [
    `Global operational state: ${globalOperationalState}.`,
    `Queue state: ${queueState}.`,
    `Rollout state: ${rolloutState}.`,
    `Incident state: ${incidentState}.`,
    `Degraded-mode state: ${degradedModeState}.`,
    `Operator availability state: ${operatorAvailabilityState}.`,
  ];
  const groupedQueueSummaries = [
    `Moderation queue: ${moderationPendingTotal} pending, oldest age ${formatMinutes(moderationOldestMinutes)}, bucket ${formatAgeBucket(moderationOldestMinutes)}.`,
    `Billing queue: ${upgradePendingTotal} open reviews, oldest age ${formatMinutes(upgradeOldestMinutes)}, webhook failures / 24h = ${webhookFailures24h}.`,
    `Support queue: backlog signals / 24h = ${supportSignals}, operator escalations / 24h = ${operatorEscalations24h}, repeated confusion / 24h = ${repeatedConfusion24h}.`,
  ];
  const groupedRolloutSummaries = [
    `Funnel activity: landing ${funnel.landingPageVisits24h ?? 0}, register ${registerCompleted24h}, onboarding ${onboardingCompleted24h}.`,
    `Conversion posture: register completion ${conversions.registerStartToCompletePct ?? 0}%, onboarding conversion ${conversions.registerCompleteToOnboardingPct ?? 0}%, publish conversion ${conversions.publishStartToSubmitPct ?? 0}%.`,
    `Adoption readiness: ${formatReadinessStatus(adoptionReadiness?.status)} with ${adoptionReasons.length} current reason(s).`,
  ];
  const groupedIncidentSummaries = [
    `Auth burst visibility: login failures / 15m = ${loginFailures15m}, login failures / 24h = ${loginFailures24h}, rate-limit triggers / 15m = ${rateLimitTriggers15m}.`,
    `Upload and billing failure visibility: upload failures / 24h = ${uploadFailures24h}, webhook failures / 24h = ${webhookFailures24h}.`,
    `Readiness visibility: warnings = ${warnings.length}, errors = ${errors.length}, unresolved incident warnings = ${unresolvedIncidentWarnings.length}.`,
  ];
  const groupedSourceRules = [
    "Source-of-truth hierarchy: active /status payload first, visible /health and runtime status second, current queue and owner review surfaces third, operator handoff notes last.",
    "Timestamp ownership: this page uses the active /status timestamp as the summary clock and treats every assistance block as derivative of that same visible snapshot.",
    "Conflicting-state handling: when queue pressure, rollout warnings, or billing visibility disagree, operators must inspect the source metrics and current owner context before acting.",
    "No hidden prioritization: the compressed layer uses only visible counts, ages, readiness messages, and explicit threshold wording rendered on this page.",
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">
                Production hardening
              </div>
              <h1 className="mt-2 text-3xl font-semibold">
                Production readiness control panel
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
                This view separates explicit demo behavior from live behavior and now layers in
                advisory operator summaries that explain queue pressure, incident hints, digests,
                and correlations without taking approval, escalation, severity, billing, rollback,
                or rollout authority away from humans.
              </p>
            </div>

            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                blockers.length === 0
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              {blockers.length === 0 ? "Ready for controlled rollout" : `${blockers.length} blocker(s)`}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Environment" value={status?.runtime?.nodeEnv ?? localRuntime.environment} />
          <MetricCard label="API" value={loading ? "Checking..." : status?.api ?? "Unknown"} />
          <MetricCard label="Database" value={loading ? "Checking..." : status?.db ?? "Unknown"} />
          <MetricCard label="Auth Mode" value={status?.runtime?.authMode ?? "Unknown"} />
        </section>

        <section className="grid gap-4 md:grid-cols-4 xl:grid-cols-5">
          <MetricCard
            label="Commercial Mode"
            value={commercialLaunchMode}
          />
          <MetricCard
            label="Billing Mode"
            value={billingMode}
          />
          <MetricCard
            label="Upgrade Flow"
            value={integrations?.commercial?.publicUpgradeFlow ?? "Unknown"}
          />
          <MetricCard
            label="Webhook"
            value={integrations?.billingWebhook?.mode ?? "Unknown"}
          />
          <MetricCard
            label="Email / SMS"
            value={`${integrations?.commercial?.emailDelivery ?? "Unknown"} / ${integrations?.commercial?.smsDelivery ?? "Unknown"}`}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label={`Landing / ${rolloutWindowHours}h`}
            value={funnel.landingPageVisits24h ?? 0}
          />
          <MetricCard
            label={`Register / ${rolloutWindowHours}h`}
            value={funnel.registerCompleted24h ?? 0}
          />
          <MetricCard
            label={`Onboarding / ${rolloutWindowHours}h`}
            value={funnel.onboardingCompleted24h ?? 0}
          />
          <MetricCard
            label="Pending Moderation"
            value={operations?.moderation?.pendingTotal ?? 0}
          />
          <MetricCard
            label="Upgrade Requests"
            value={operations?.upgrades?.pending ?? 0}
          />
          <MetricCard
            label={`Auth Failures / 15m`}
            value={operations?.failures?.loginFailures15m ?? 0}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Register Conv."
            value={`${conversions.registerStartToCompletePct ?? 0}%`}
          />
          <MetricCard
            label="Onboarding Conv."
            value={`${conversions.registerCompleteToOnboardingPct ?? 0}%`}
          />
          <MetricCard
            label="Publish Conv."
            value={`${conversions.publishStartToSubmitPct ?? 0}%`}
          />
          <MetricCard
            label="Feedback / 24h"
            value={operations?.feedback?.total24h ?? 0}
          />
          <MetricCard
            label="Support Pressure"
            value={operations?.support?.backlogSignals24h ?? 0}
          />
          <MetricCard
            label="Adoption Status"
            value={formatReadinessStatus(adoptionReadiness?.status)}
          />
        </section>

        {error ? (
          <section className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100">
            <div className="text-sm uppercase tracking-[0.18em] text-rose-200">API status error</div>
            <div className="mt-3 text-sm leading-6">{error}</div>
          </section>
        ) : null}

        <AssistCard title="Assistance safety contract" generatedAt={generatedAt}>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-200">
            Every assistance surface on this page is advisory, explainable, and non-authoritative.
            Each summary cites visible source metrics from the active `/status` payload, includes the
            current snapshot timestamp, and requires operator confirmation before any escalation,
            severity, rollback, moderation, billing, or rollout decision is made.
          </div>
          <AssistList
            title="Authority boundaries"
            tone="rose"
            items={[
              "No assistance card on this page can approve, reject, escalate automatically, assign severity automatically, activate billing, trigger rollback, change rollout state, or override an operator.",
              "Queue pressure, incident, digest, and correlation summaries are rendered as operator context only and do not execute actions.",
              "If a recommendation looks urgent, the source metrics below should still be reviewed before any human action is taken.",
            ]}
          />
        </AssistCard>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <AssistCard title="Compressed operator orientation" generatedAt={generatedAt}>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-200">
              This compression layer is the first unified intelligence surface for operator
              orientation. It compresses repeated queue, rollout, billing, escalation, and
              incident reasoning into one timestamped view so operators can decide where to look
              next without surrendering moderation, billing, severity, escalation, rollback, or
              rollout authority.
            </div>
            <AssistList
              title="Priority stack"
              tone={priorityStack.length > 0 ? "amber" : "cyan"}
              items={
                priorityStack.length > 0
                  ? priorityStack
                  : ["No immediate priority item crossed the visible review thresholds in the active snapshot."]
              }
            />
            <AssistList title="Operational freshness" tone="slate" items={staleStateIndicators} />
            <AssistList title="Attention routing" tone="cyan" items={attentionRoutingSummary} />
          </AssistCard>

          <Card title="Unified operational state">
            <StateGrid
              items={[
                { label: "Global operational state", value: globalOperationalState },
                { label: "Queue state", value: queueState },
                { label: "Rollout state", value: rolloutState },
                { label: "Moderation state", value: moderationState },
                { label: "Billing state", value: billingState },
                { label: "Escalation state", value: escalationState },
                { label: "Incident state", value: incidentState },
                { label: "Degraded-mode state", value: degradedModeState },
                { label: "Operator availability", value: operatorAvailabilityState },
              ]}
            />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card title="Feature flags">
            <FlagGrid flags={status?.featureFlags ?? localRuntime} />
          </Card>

          <Card title="Launch blockers">
            {blockers.length === 0 ? (
              <EmptyState text="No hard blockers detected in the current runtime snapshot." />
            ) : (
              <SimpleList items={blockers} tone="rose" />
            )}
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card title="Grouped operational summaries">
            <SimpleList items={groupedOperationalSummaries} tone="cyan" />
          </Card>

          <Card title="Source-of-truth and freshness rules">
            <SimpleList items={groupedSourceRules} tone="amber" />
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card title="Grouped queue summaries">
            <SimpleList items={groupedQueueSummaries} tone="cyan" />
          </Card>

          <Card title="Grouped rollout summaries">
            <SimpleList items={groupedRolloutSummaries} tone="amber" />
          </Card>

          <Card title="Grouped incident summaries">
            <SimpleList items={groupedIncidentSummaries} tone="rose" />
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <QueueAssistSummary
            title="Moderation queue assistance"
            generatedAt={generatedAt}
            summary={
              moderationPendingTotal === 0
                ? "No pending moderation backlog is visible in the current snapshot, so this queue does not currently indicate operator pressure."
                : `Moderation has ${moderationPendingTotal} pending items. The oldest pending ${operations?.moderation?.oldestPendingItemType ?? "item"} is ${formatMinutes(moderationOldestMinutes)} old, so this summary treats the queue as advisory backlog pressure rather than an automatic SLA breach.`
            }
            metrics={[
              { label: "Pending total", value: moderationPendingTotal },
              { label: "Rejected total", value: operations?.moderation?.rejectedTotal ?? 0 },
              { label: "Oldest item age", value: formatMinutes(moderationOldestMinutes) },
              { label: "Oldest item bucket", value: formatAgeBucket(moderationOldestMinutes) },
            ]}
            sourceReasoning={[
              `Derived from moderation.pendingTotal = ${moderationPendingTotal}.`,
              `Derived from moderation.oldestPendingMinutes = ${moderationOldestMinutes}.`,
              `The displayed aging bucket is based only on the oldest pending item threshold: under 30m, 30-119m, 120-239m, or 240m+.`,
              `No item-level prioritization or automatic moderation action is executed from this summary.`,
            ]}
            warnings={[
              ...(moderationPendingTotal >= 8 ? [`Backlog warning: ${moderationPendingTotal} items are pending review.`] : []),
              ...(moderationOldestMinutes >= 120 ? [`Aging warning: the oldest moderation item has been waiting ${formatMinutes(moderationOldestMinutes)}.`] : []),
              ...(moderationConfusion24h > 0 ? [`Moderation confusion reports in 24h: ${moderationConfusion24h}.`] : []),
            ]}
            recommendations={[
              moderationPendingTotal === 0
                ? "No immediate moderation escalation is suggested from the current snapshot."
                : "Review oldest pending items first, confirm queue ownership, and then decide whether a human escalation is needed.",
              moderationOldestMinutes >= 240
                ? "Consider operator escalation review if the oldest moderation item remains open after the next check."
                : "Continue operator review and avoid treating this summary as automatic moderation priority.",
            ]}
          />

          <QueueAssistSummary
            title="Billing queue assistance"
            generatedAt={generatedAt}
            summary={
              upgradePendingTotal === 0 && webhookFailures24h === 0
                ? "No billing queue pressure is obvious from open upgrade reviews or webhook failures in the current snapshot."
                : `Billing pressure is summarized from ${upgradePendingTotal} open upgrade reviews, ${webhookFailures24h} failed webhook events, and ${billingConfusion24h} billing confusion reports in the last 24 hours.`
            }
            metrics={[
              { label: "Open reviews", value: upgradePendingTotal },
              { label: "Oldest open age", value: formatMinutes(upgradeOldestMinutes) },
              { label: "Webhook failures / 24h", value: webhookFailures24h },
              { label: "Billing confusion / 24h", value: billingConfusion24h },
            ]}
            sourceReasoning={[
              `Derived from upgrades.pending = ${operations?.upgrades?.pending ?? 0} and upgrades.contacted = ${operations?.upgrades?.contacted ?? 0}.`,
              `Derived from upgrades.oldestOpenMinutes = ${upgradeOldestMinutes}.`,
              `Webhook pressure uses failures.webhookFailures24h = ${webhookFailures24h}.`,
              `This summary does not activate billing, change invoice state, or approve upgrade requests.`,
            ]}
            warnings={[
              ...(upgradePendingTotal >= 4 ? [`Backlog warning: ${upgradePendingTotal} billing reviews remain open.`] : []),
              ...(upgradeOldestMinutes >= 240 ? [`Aging warning: the oldest billing review has been open for ${formatMinutes(upgradeOldestMinutes)}.`] : []),
              ...(webhookFailures24h > 0 ? [`Retry warning: ${webhookFailures24h} webhook failures may increase manual reconciliation work.`] : []),
            ]}
            recommendations={[
              upgradePendingTotal > 0
                ? "Review the oldest open upgrade request first and confirm whether manual follow-up is already assigned."
                : "No billing queue escalation is suggested from open reviews right now.",
              webhookFailures24h > 0
                ? "Check failed webhook events before treating billing backlog as only a human throughput issue."
                : "Keep billing assistance advisory and require operator confirmation before any escalation.",
            ]}
          />

          <QueueAssistSummary
            title="Support and escalation assistance"
            generatedAt={generatedAt}
            summary={
              supportSignals === 0
                ? "Support and escalation pressure is currently quiet in the active snapshot."
                : `Support pressure is summarized from ${supportSignals} backlog signals, ${operatorEscalations24h} operator escalations, ${repeatedConfusion24h} repeated confusion reports, and ${failedFlows24h} failed-flow reports in the last 24 hours.`
            }
            metrics={[
              { label: "Support signals / 24h", value: supportSignals },
              { label: "Escalations / 24h", value: operatorEscalations24h },
              { label: "Repeated confusion / 24h", value: repeatedConfusion24h },
              { label: "Failed flows / 24h", value: failedFlows24h },
            ]}
            sourceReasoning={[
              `Support pressure uses support.backlogSignals24h = ${supportSignals}.`,
              `Escalation pressure uses support.operatorEscalations24h = ${operatorEscalations24h}.`,
              `Operator overload hints use support.repeatedConfusion24h = ${repeatedConfusion24h} and feedback.failedFlows24h = ${failedFlows24h}.`,
              `This summary may suggest review priority, but it may not open or route escalations automatically.`,
            ]}
            warnings={[
              ...(supportSignals >= 6 ? [`Backlog warning: support backlog signals reached ${supportSignals} in the last 24 hours.`] : []),
              ...(operatorEscalations24h >= 2 ? [`Escalation warning: ${operatorEscalations24h} operator escalations were logged in the last 24 hours.`] : []),
              ...(repeatedConfusion24h >= 3 ? [`Overload warning: ${repeatedConfusion24h} repeated confusion reports may signal explanation fatigue.`] : []),
            ]}
            recommendations={[
              supportSignals > 0
                ? "Confirm active owner coverage and handoff clarity before deciding whether to escalate further."
                : "No support escalation recommendation is suggested from the current snapshot.",
              operatorEscalations24h > 0
                ? "Review whether the same issue is being escalated repeatedly before treating this as multiple incidents."
                : "Continue using this surface as summary-only context for operator review.",
            ]}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AssistCard title="Production readiness assistance summary" generatedAt={generatedAt}>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-200">
              This readiness assistance layer summarizes queue pressure, failure bursts, onboarding conversion, operator overload, escalation pressure, and unresolved incident warnings from the active `/status` snapshot. It does not hide threshold logic: each recommendation is tied to a visible count, age, or readiness message shown on this page.
            </div>
            <AssistList
              title="Queue pressure summary"
              tone="cyan"
              items={[
                `Moderation pending items: ${moderationPendingTotal} with oldest age ${formatMinutes(moderationOldestMinutes)}.`,
                `Billing open reviews: ${upgradePendingTotal} with oldest age ${formatMinutes(upgradeOldestMinutes)}.`,
                `Support backlog signals in 24h: ${supportSignals}.`,
              ]}
            />
            <AssistList
              title="Operator overload indicators"
              tone="amber"
              items={
                operatorOverloadIndicators.length > 0
                  ? operatorOverloadIndicators
                  : ["No current overload indicator crossed the visible summary thresholds on this page."]
              }
            />
            <AssistList
              title="Escalation pressure indicators"
              tone="slate"
              items={escalationPressureIndicators}
            />
            <AssistList
              title="Unresolved incident warnings"
              tone="rose"
              items={
                unresolvedIncidentWarnings.length > 0
                  ? unresolvedIncidentWarnings
                  : ["No readiness warnings, readiness errors, or adoption-readiness reasons were included in the current snapshot."]
              }
            />
          </AssistCard>

          <IncidentAssistSummary
            generatedAt={generatedAt}
            affectedSystems={incidentAffectedSystems}
            impactedFlows={incidentImpactedFlows}
            correlatedFailures={correlatedFailures}
            unresolvedRisks={
              unresolvedIncidentWarnings.length > 0
                ? unresolvedIncidentWarnings
                : ["No unresolved incident warnings were surfaced in the current readiness snapshot."]
            }
            nextChecks={incidentNextChecks}
            rollbackReminders={rollbackReminders}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <DigestSection
            title="Today's auth anomalies digest"
            generatedAt={generatedAt}
            summary={
              loginFailures15m === 0 && rateLimitTriggers15m === 0
                ? "Auth anomaly indicators are currently quiet in the short-term window."
                : `Auth anomaly attention is based on ${loginFailures15m} login failures and ${rateLimitTriggers15m} rate-limit triggers in the last 15 minutes, plus ${loginFailures24h} login failures in the last 24 hours.`
            }
            metrics={[
              { label: "Login failures / 15m", value: loginFailures15m },
              { label: "Rate limits / 15m", value: rateLimitTriggers15m },
              { label: "Login failures / 24h", value: loginFailures24h },
              { label: "Register -> onboarding", value: `${conversions.registerCompleteToOnboardingPct ?? 0}%` },
            ]}
            sourceReasoning={[
              `Uses failures.loginFailures15m = ${loginFailures15m}.`,
              `Uses failures.rateLimitTriggers15m = ${rateLimitTriggers15m}.`,
              `Uses failures.loginFailures24h = ${loginFailures24h}.`,
              `Also references conversions.registerCompleteToOnboardingPct = ${conversions.registerCompleteToOnboardingPct ?? 0}%.`,
            ]}
            actionPriorities={[
              loginFailures15m > 0
                ? "Check auth errors and rate-limit context before deciding if the issue is user confusion or service instability."
                : "Keep monitoring auth patterns; no short-window anomaly requires action from this digest alone.",
            ]}
          />

          <DigestSection
            title="Today's moderation backlog digest"
            generatedAt={generatedAt}
            summary={
              moderationPendingTotal === 0
                ? "Moderation backlog is currently clear in the active snapshot."
                : `Moderation backlog remains open with ${moderationPendingTotal} pending items and ${operations?.moderation?.rejectedTotal ?? 0} rejected items visible for operator follow-up.`
            }
            metrics={[
              { label: "Pending", value: moderationPendingTotal },
              { label: "Rejected", value: operations?.moderation?.rejectedTotal ?? 0 },
              { label: "Oldest age", value: formatMinutes(moderationOldestMinutes) },
              { label: "Aging bucket", value: formatAgeBucket(moderationOldestMinutes) },
            ]}
            sourceReasoning={[
              `Uses moderation.pendingTotal = ${moderationPendingTotal}.`,
              `Uses moderation.rejectedTotal = ${operations?.moderation?.rejectedTotal ?? 0}.`,
              `Uses moderation.oldestPendingMinutes = ${moderationOldestMinutes}.`,
            ]}
            actionPriorities={[
              moderationPendingTotal > 0
                ? "Review the oldest pending moderation item first and confirm whether batching or handoff is required."
                : "No moderation action is suggested from the current digest.",
            ]}
          />

          <DigestSection
            title="Today's upload failures digest"
            generatedAt={generatedAt}
            summary={
              uploadFailures24h === 0
                ? "No upload failure burst is visible in the current 24-hour snapshot."
                : `Upload assistance flags ${uploadFailures24h} upload failures in the last 24 hours because these failures can suppress future moderation intake and create hidden publishing friction.`
            }
            metrics={[
              { label: "Upload failures / 24h", value: uploadFailures24h },
              { label: "Moderation pending", value: moderationPendingTotal },
              { label: "Publish conversion", value: `${conversions.publishStartToSubmitPct ?? 0}%` },
              { label: "Warnings", value: warnings.length },
            ]}
            sourceReasoning={[
              `Uses failures.uploadFailures24h = ${uploadFailures24h}.`,
              `Cross-checks moderation.pendingTotal = ${moderationPendingTotal}.`,
              `References conversions.publishStartToSubmitPct = ${conversions.publishStartToSubmitPct ?? 0}%.`,
            ]}
            actionPriorities={[
              uploadFailures24h > 0
                ? "Check upload logs and whether publishing conversion softened at the same time."
                : "No upload-specific action is suggested from the current digest.",
            ]}
          />

          <DigestSection
            title="Today's billing pressure digest"
            generatedAt={generatedAt}
            summary={
              upgradePendingTotal === 0 && webhookFailures24h === 0
                ? "Billing pressure signals are currently quiet."
                : `Billing pressure is summarized from open upgrade reviews, webhook failures, and billing confusion signals without changing billing state automatically.`
            }
            metrics={[
              { label: "Open reviews", value: upgradePendingTotal },
              { label: "Oldest review", value: formatMinutes(upgradeOldestMinutes) },
              { label: "Webhook failures / 24h", value: webhookFailures24h },
              { label: "Billing confusion / 24h", value: billingConfusion24h },
            ]}
            sourceReasoning={[
              `Uses upgrade queue counts = ${upgradePendingTotal}.`,
              `Uses failures.webhookFailures24h = ${webhookFailures24h}.`,
              `Uses feedback.billingConfusion24h = ${billingConfusion24h}.`,
            ]}
            actionPriorities={[
              upgradePendingTotal > 0 || webhookFailures24h > 0
                ? "Review oldest billing items and failed webhook events before deciding if operator escalation is necessary."
                : "No billing action is suggested from the current digest.",
            ]}
          />

          <DigestSection
            title="Today's escalation pressure digest"
            generatedAt={generatedAt}
            summary={
              supportSignals === 0
                ? "Escalation pressure is currently low in the active snapshot."
                : `Escalation pressure is derived from ${supportSignals} support signals, ${operatorEscalations24h} operator escalations, and ${repeatedConfusion24h} repeated confusion reports.`
            }
            metrics={[
              { label: "Support signals", value: supportSignals },
              { label: "Escalations", value: operatorEscalations24h },
              { label: "Repeated confusion", value: repeatedConfusion24h },
              { label: "Failed flows", value: failedFlows24h },
            ]}
            sourceReasoning={[
              `Uses support.backlogSignals24h = ${supportSignals}.`,
              `Uses support.operatorEscalations24h = ${operatorEscalations24h}.`,
              `Uses support.repeatedConfusion24h = ${repeatedConfusion24h}.`,
              `Uses feedback.failedFlows24h = ${failedFlows24h}.`,
            ]}
            actionPriorities={[
              supportSignals > 0
                ? "Confirm ownership and handoff clarity before creating more escalation traffic."
                : "No escalation action is suggested from the current digest.",
            ]}
          />

          <DigestSection
            title="Today's rollout warnings digest"
            generatedAt={generatedAt}
            summary={
              adoptionReasons.length === 0 && warnings.length === 0 && errors.length === 0
                ? "No current rollout warnings were surfaced by readiness or adoption summary logic."
                : `Rollout warnings are summarized from readiness warnings, readiness errors, and adoption-readiness reasons in the active status payload.`
            }
            metrics={[
              { label: "Readiness warnings", value: warnings.length },
              { label: "Readiness errors", value: errors.length },
              { label: "Adoption reasons", value: adoptionReasons.length },
              { label: "Onboarding completed / 24h", value: onboardingCompleted24h },
            ]}
            sourceReasoning={[
              `Uses readiness.warnings count = ${warnings.length}.`,
              `Uses readiness.errors count = ${errors.length}.`,
              `Uses adoptionReadiness.reasons count = ${adoptionReasons.length}.`,
              `References onboardingCompleted24h = ${onboardingCompleted24h} and registerCompleted24h = ${registerCompleted24h}.`,
            ]}
            actionPriorities={[
              unresolvedIncidentWarnings.length > 0
                ? "Review the warnings before expanding rollout or assuming quiet operations."
                : "No rollout action is suggested from the current digest.",
            ]}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <CorrelationSummaryCard
            title="Auth spikes and onboarding drops"
            generatedAt={generatedAt}
            summary={
              loginFailures15m > 0 || (conversions.registerCompleteToOnboardingPct ?? 0) < 70
                ? "This correlation surface links auth friction with onboarding softness so operators can check whether conversion loss is operational rather than product-only."
                : "No obvious auth-to-onboarding correlation is visible in the current snapshot."
            }
            metrics={[
              { label: "Login failures / 15m", value: loginFailures15m },
              { label: "Register -> onboarding", value: `${conversions.registerCompleteToOnboardingPct ?? 0}%` },
              { label: "Onboarding completed / 24h", value: onboardingCompleted24h },
              { label: "Register completed / 24h", value: registerCompleted24h },
            ]}
            sourceReasoning={[
              `Short-window auth signal uses failures.loginFailures15m = ${loginFailures15m}.`,
              `Conversion signal uses conversions.registerCompleteToOnboardingPct = ${conversions.registerCompleteToOnboardingPct ?? 0}%.`,
              `No hidden severity score is used.`,
            ]}
            safetyGuardrails={[
              "This card may not assign severity automatically.",
              "This card may not execute escalation or auth recovery steps automatically.",
              "Operators must confirm whether conversion drop is real before acting.",
            ]}
          />

          <CorrelationSummaryCard
            title="Upload failures and moderation delays"
            generatedAt={generatedAt}
            summary={
              uploadFailures24h > 0 || moderationPendingTotal > 0
                ? "This correlation surface helps operators check whether upload instability is starving moderation throughput or simply coexisting with queue aging."
                : "No obvious upload-to-moderation correlation is visible in the current snapshot."
            }
            metrics={[
              { label: "Upload failures / 24h", value: uploadFailures24h },
              { label: "Moderation pending", value: moderationPendingTotal },
              { label: "Oldest moderation item", value: formatMinutes(moderationOldestMinutes) },
              { label: "Publish submit rate", value: `${conversions.publishStartToSubmitPct ?? 0}%` },
            ]}
            sourceReasoning={[
              `Failure signal uses failures.uploadFailures24h = ${uploadFailures24h}.`,
              `Queue signal uses moderation.pendingTotal = ${moderationPendingTotal}.`,
              `Aging signal uses moderation.oldestPendingMinutes = ${moderationOldestMinutes}.`,
            ]}
            safetyGuardrails={[
              "This card may not reroute moderation work automatically.",
              "This card may not change content visibility or moderation state.",
              "Operators still need to confirm whether fewer publishes are caused by upload failure or demand changes.",
            ]}
          />

          <CorrelationSummaryCard
            title="Webhook failures and billing backlog"
            generatedAt={generatedAt}
            summary={
              webhookFailures24h > 0 || upgradePendingTotal > 0
                ? "This correlation surface links billing reconciliation risk with billing review pressure so operators can check whether the queue is operationally blocked or just busy."
                : "No obvious webhook-to-billing backlog correlation is visible in the current snapshot."
            }
            metrics={[
              { label: "Webhook failures / 24h", value: webhookFailures24h },
              { label: "Open billing reviews", value: upgradePendingTotal },
              { label: "Oldest billing review", value: formatMinutes(upgradeOldestMinutes) },
              { label: "Billing confusion / 24h", value: billingConfusion24h },
            ]}
            sourceReasoning={[
              `Failure signal uses failures.webhookFailures24h = ${webhookFailures24h}.`,
              `Backlog signal uses upgrades.pending + upgrades.contacted = ${upgradePendingTotal}.`,
              `Confusion signal uses feedback.billingConfusion24h = ${billingConfusion24h}.`,
            ]}
            safetyGuardrails={[
              "This card may not activate billing or invoice state changes.",
              "This card may not auto-escalate webhook incidents.",
              "Manual billing authority remains human-owned even when the summary suggests pressure.",
            ]}
          />

          <CorrelationSummaryCard
            title="Rollout instability and support escalations"
            generatedAt={generatedAt}
            summary={
              supportSignals > 0 || adoptionReasons.length > 0
                ? "This correlation surface links rollout warnings with support pressure so operators can inspect whether instability is spreading beyond one queue."
                : "No obvious rollout-to-support escalation correlation is visible in the current snapshot."
            }
            metrics={[
              { label: "Support signals / 24h", value: supportSignals },
              { label: "Operator escalations / 24h", value: operatorEscalations24h },
              { label: "Adoption reasons", value: adoptionReasons.length },
              { label: "Readiness warnings", value: warnings.length + errors.length },
            ]}
            sourceReasoning={[
              `Support pressure uses support.backlogSignals24h = ${supportSignals}.`,
              `Escalation pressure uses support.operatorEscalations24h = ${operatorEscalations24h}.`,
              `Rollout instability hints use adoptionReadiness.reasons count = ${adoptionReasons.length} plus readiness messages.`,
            ]}
            safetyGuardrails={[
              "This card may not pause rollout or change rollout state automatically.",
              "This card may not enforce rollback recommendations.",
              "Operators must confirm the actual incident state before using this correlation in decision-making.",
            ]}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Warnings and adoption status">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100">
                Status: <span className="font-semibold">{formatReadinessStatus(adoptionReadiness?.status)}</span>
              </div>
              {adoptionReadiness?.reasons?.length ? (
                <SimpleList items={adoptionReadiness.reasons} tone="amber" />
              ) : (
                <EmptyState text="No current adoption blockers were derived from the active rollout snapshot." />
              )}
              {warnings.length === 0 ? (
                <EmptyState text="No runtime warnings reported." />
              ) : (
                <SimpleList items={warnings} tone="amber" />
              )}
            </div>
          </Card>

          <Card title="Integration posture">
            <SimpleList
              items={[
                `Commercial mode: ${commercialLaunchMode}.`,
                `Billing mode: ${billingMode}.`,
                `Upgrade flow: ${integrations?.commercial?.publicUpgradeFlow ?? "Unknown"}.`,
                `Webhook mode: ${integrations?.billingWebhook?.mode ?? "Unknown"}.`,
                `Email / SMS delivery: ${integrations?.commercial?.emailDelivery ?? "Unknown"} / ${integrations?.commercial?.smsDelivery ?? "Unknown"}.`,
                missingCommercialContract
                  ? "Commercial contract visibility is incomplete in the active payload and should be treated as a readiness mismatch."
                  : "Commercial contract visibility is complete enough for advisory operational interpretation on this page.",
              ]}
              tone="cyan"
            />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Recent operator actions">
            {operations?.recentOperatorActions?.length ? (
              <div className="space-y-3">
                {operations.recentOperatorActions.map((item) => (
                  <div
                    key={`${item.createdAt}-${item.action}-${item.entityType}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                  >
                    <div className="text-sm font-medium text-slate-100">
                      {item.action} · {item.entityType}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.actorEmail} ({item.actorRole}) · {new Date(item.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.category ?? "uncategorized"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No recent operator actions were included in the current snapshot." />
            )}
          </Card>

          <Card title="Source snapshot transparency">
            <SimpleList
              items={[
                `Register started vs completed gives the first honesty check on the public signup funnel.`,
                `Pending and rejected moderation counts expose operator backlog without leaking end-user content.`,
                `Auth failure and rate-limit bursts help separate confusion from abuse or runtime instability.`,
                `Webhook and upload failure counts make operational regressions visible before users report them manually.`,
                "The assistance surfaces above use only the visible `/status` snapshot, the timestamp shown on the page, and explicit threshold wording rendered in source reasoning blocks.",
              ]}
              tone="cyan"
            />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Compressed source metrics">
            <SimpleList
              items={[
                `Onboarding / 24h: started ${operations?.onboarding?.started24h ?? 0}, completed ${onboardingCompleted24h}.`,
                `Moderation: pending ${moderationPendingTotal}, rejected ${operations?.moderation?.rejectedTotal ?? 0}, oldest age ${formatMinutes(moderationOldestMinutes)}.`,
                `Billing: pending ${operations?.upgrades?.pending ?? 0}, contacted ${operations?.upgrades?.contacted ?? 0}, oldest open ${formatMinutes(upgradeOldestMinutes)}.`,
                `Failures: login / 15m ${loginFailures15m}, upload / 24h ${uploadFailures24h}, webhook / 24h ${webhookFailures24h}.`,
                `Feedback and support: total feedback / 24h ${operations?.feedback?.total24h ?? 0}, support signals / 24h ${supportSignals}, repeated confusion / 24h ${repeatedConfusion24h}.`,
                `Aging hints: moderation bucket ${formatAgeBucket(moderationOldestMinutes)}, billing review age ${formatMinutes(upgradeOldestMinutes)}.`,
              ]}
              tone="cyan"
            />
          </Card>

          <Card title="Runtime capabilities">
            <SimpleList
              items={[
                `Runtime environment: ${status?.runtime?.nodeEnv ?? localRuntime.environment}.`,
                `Auth mode: ${status?.runtime?.authMode ?? "Unknown"}.`,
                `Database configured: ${String(status?.runtime?.databaseConfigured ?? false)}.`,
                `JWT configured: ${String(status?.runtime?.jwtSecretConfigured ?? false)}.`,
                `Storage configured: ${String(status?.runtime?.storageBucketConfigured ?? false)}.`,
                `Queue visibility surface present: ${status?.queues ? "yes" : "no"}.`,
                `Snapshot timestamp: ${generatedAt}.`,
              ]}
              tone="amber"
            />
          </Card>
        </section>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-sm uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-sm uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-3 text-lg font-semibold text-slate-100">{String(value)}</div>
    </div>
  );
}

function FlagGrid({ flags }: { flags: Record<string, unknown> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Object.entries(flags).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
        >
          <span className="text-sm text-slate-300">{key}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              value === true
                ? "bg-cyan-500/15 text-cyan-200"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SimpleList({ items, tone }: { items: string[]; tone: "rose" | "amber" | "cyan" }) {
  const bulletClass =
    tone === "rose"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-100"
      : tone === "amber"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
        : "border-cyan-500/25 bg-cyan-500/10 text-cyan-100";

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${bulletClass}`}>
          {item}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4 text-sm text-slate-400">{text}</div>;
}

function StateGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
        >
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
          <div className="mt-2 text-sm font-medium text-slate-100">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function formatReadinessStatus(status?: string) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatMinutes(value?: number | null) {
  if (value === null || value === undefined || value <= 0) {
    return "0m";
  }

  if (value < 60) {
    return `${value}m`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (hours < 24) {
    return `${hours}h ${minutes}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

function formatAgeBucket(value?: number | null) {
  if (value === null || value === undefined || value <= 0) {
    return "No visible aging";
  }

  if (value < 30) {
    return "Under 30m";
  }

  if (value < 120) {
    return "30m to 119m";
  }

  if (value < 240) {
    return "120m to 239m";
  }

  return "240m+";
}

function getSnapshotAgeMinutes(value?: string | null) {
  if (!value) {
    return null;
  }

  const snapshotTime = new Date(value).getTime();
  if (Number.isNaN(snapshotTime)) {
    return null;
  }

  const diffMs = Date.now() - snapshotTime;
  if (diffMs < 0) {
    return 0;
  }

  return Math.round(diffMs / 60000);
}
