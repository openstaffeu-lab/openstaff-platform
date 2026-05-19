"use client";

import { useEffect, useMemo, useState } from "react";
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
    operations?: {
      onboarding?: Record<string, number>;
      moderation?: Record<string, number>;
      upgrades?: Record<string, number>;
      failures?: Record<string, number>;
      feedback?: Record<string, number>;
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
  const operations = status?.rolloutIntelligence?.operations;
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
                This view separates explicit demo behavior from live behavior and surfaces launch
                blockers, runtime flags, queue status, integration readiness, and commercial launch
                mode from the active API.
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

        {error ? (
          <section className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100">
            <div className="text-sm uppercase tracking-[0.18em] text-rose-200">API status error</div>
            <div className="mt-3 text-sm leading-6">{error}</div>
          </section>
        ) : null}

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

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Warnings">
            {warnings.length === 0 ? (
              <EmptyState text="No runtime warnings reported." />
            ) : (
              <SimpleList items={warnings} tone="amber" />
            )}
          </Card>

          <Card title="Queue status">
            <JsonPreview value={status?.queues ?? { unavailable: loading }} />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Rollout funnel visibility">
            <JsonPreview value={status?.rolloutIntelligence?.funnel ?? { unavailable: true }} />
          </Card>

          <Card title="Operational summaries">
            <JsonPreview
              value={{
                onboarding: operations?.onboarding ?? {},
                moderation: operations?.moderation ?? {},
                upgrades: operations?.upgrades ?? {},
                failures: operations?.failures ?? {},
                feedback: operations?.feedback ?? {},
              }}
            />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Integration summary">
            <JsonPreview value={status?.integrations ?? { unavailable: true }} />
          </Card>

          <Card title="Runtime capabilities">
            <JsonPreview
              value={{
                runtime: status?.runtime ?? null,
                localRuntime,
                timestamp: status?.timestamp ?? null,
              }}
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

          <Card title="Rollout interpretation">
            <SimpleList
              items={[
                `Register started vs completed gives the first honesty check on the public signup funnel.`,
                `Pending and rejected moderation counts expose operator backlog without leaking end-user content.`,
                `Auth failure and rate-limit bursts help separate confusion from abuse or runtime instability.`,
                `Webhook and upload failure counts make operational regressions visible before users report them manually.`,
              ]}
              tone="cyan"
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

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs leading-6 text-slate-200">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
