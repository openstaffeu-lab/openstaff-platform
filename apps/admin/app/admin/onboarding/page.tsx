"use client";

import { useEffect, useState } from "react";
import {
  getAdminOnboardingSessions,
  getAdminReluProfileResults,
  type AdminOnboardingSession,
  type AdminReluProfileResults,
} from "@/lib/api";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminOnboardingPage() {
  const [items, setItems] = useState<AdminOnboardingSession[]>([]);
  const [reluByProfileId, setReluByProfileId] = useState<Record<string, AdminReluProfileResults | null>>({});
  const [loadingRelu, setLoadingRelu] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const nextItems = await getAdminOnboardingSessions({
          q: query || undefined,
          onboardingStatus:
            (status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED") ||
            undefined,
        });

        if (!cancelled) {
          setItems(nextItems);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nu am putut incarca sesiunile de onboarding.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [query, status]);

  return (
    <div className="space-y-6 px-6 py-8 md:px-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Onboarding Monitoring
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Digital identity rollout
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Vizibilitate centralizata pentru progresul onboarding, completion score si
          identitatea publica pregatita pentru directoare si KYC future-ready.
        </p>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 md:grid-cols-[minmax(0,1fr)_240px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email, display name or company"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All statuses</option>
          <option value="NOT_STARTED">NOT_STARTED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="SKIPPED">SKIPPED</option>
        </select>
      </section>

      {error ? (
        <section className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
            <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
              <tr>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Identity</th>
                <th className="px-4 py-4">Company</th>
                <th className="px-4 py-4">Public page</th>
                <th className="px-4 py-4">RELU AI</th>
                <th className="px-4 py-4">Step</th>
                <th className="px-4 py-4">Progress</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Verification</th>
                <th className="px-4 py-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={10}>
                    Loading onboarding sessions...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => {
                  const profileId = item.legacyProfile?.id ?? null;
                  const relu = profileId ? reluByProfileId[profileId] ?? null : null;
                  const latestClassification = relu?.classifications?.[0] ?? null;
                  const output = latestClassification?.outputData ?? {};

                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{item.email}</div>
                        <div className="text-xs text-slate-400">{item.userId}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div>{item.identityProfile?.displayName ?? "-"}</div>
                        <div className="text-xs text-slate-400">
                          /{item.identityProfile?.publicSlug ?? "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {item.companyProfile?.companyName ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {item.identityProfile?.publicSlug ? (
                          <a
                            href={`/profiles/${item.identityProfile.publicSlug}`}
                            className="text-cyan-300 hover:text-cyan-200"
                            target="_blank"
                            rel="noreferrer"
                          >
                            /profiles/{item.identityProfile.publicSlug}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {profileId ? (
                          <div className="grid gap-2">
                            <button
                              type="button"
                              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-left text-xs font-semibold text-cyan-200"
                              disabled={loadingRelu[profileId]}
                              onClick={async () => {
                                try {
                                  setLoadingRelu((current) => ({ ...current, [profileId]: true }));
                                  const results = await getAdminReluProfileResults(profileId);
                                  setReluByProfileId((current) => ({ ...current, [profileId]: results }));
                                } catch (loadError) {
                                  setError(
                                    loadError instanceof Error
                                      ? loadError.message
                                      : "Nu am putut incarca sugestiile RELU AI.",
                                  );
                                } finally {
                                  setLoadingRelu((current) => ({ ...current, [profileId]: false }));
                                }
                              }}
                            >
                              {loadingRelu[profileId] ? "Loading RELU..." : relu ? "Refresh RELU" : "Load RELU"}
                            </button>
                            {latestClassification ? (
                              <div className="grid gap-2 text-xs leading-6 text-slate-300">
                                <div className="text-cyan-200">
                                  Confidence: {latestClassification.score ? `${Math.round(latestClassification.score * 100)}%` : "advisory"}
                                </div>
                                <div>{latestClassification.explanation ?? "RELU AI classified this profile without extra narrative."}</div>
                                <SuggestionList label="AI ESCO" items={toSuggestionItems(output.escoCandidates)} />
                                <SuggestionList label="AI NACE" items={toSuggestionItems(output.naceCandidates)} />
                                <SuggestionList label="AI Uniclass" items={toSuggestionItems(output.uniclassCandidates)} />
                                <SuggestionList
                                  label="User selections"
                                  items={[
                                    ...toSelectionItems("ESCO", item.legacyProfile?.taxonomySelections.esco),
                                    ...toSelectionItems("NACE", item.legacyProfile?.taxonomySelections.nace),
                                    ...toSelectionItems("Uniclass", item.legacyProfile?.taxonomySelections.uniclass),
                                  ]}
                                />
                                <SuggestionList
                                  label="Missing info"
                                  items={Array.isArray(output.missingInformation) ? output.missingInformation : []}
                                />
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500">
                                RELU AI is advisory only. Load results to compare AI suggestions with
                                the current profile taxonomy before moderation decisions.
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No legacy profile linked yet.</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-300">{item.currentStep}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-cyan-300">
                          {item.completionPercent}%
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.completedSteps.join(", ") || "no completed steps"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{item.status}</td>
                      <td className="px-4 py-4 text-slate-300">
                        {item.identityProfile?.verificationStatus ?? "-"}
                        {item.companyProfile
                          ? ` / ${item.companyProfile.verificationStatus}`
                          : ""}
                      </td>
                      <td className="px-4 py-4 text-slate-300">{formatDate(item.updatedAt)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={10}>
                    No onboarding sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function toSuggestionItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const typed = item as { code?: string; label?: string; confidence?: number };
    return `${typed.code ?? "-"} ${typed.label ?? ""}${
      typeof typed.confidence === "number" ? ` (${Math.round(typed.confidence * 100)}%)` : ""
    }`.trim();
  });
}

function toSelectionItems(
  label: string,
  value?: Array<{ code: string; label: string }>,
) {
  if (!value?.length) {
    return [`${label}: none selected`];
  }

  return value.map((item) => `${label}: ${item.code} ${item.label}`.trim());
}

function SuggestionList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="font-semibold text-slate-200">{label}</div>
      <div className="text-slate-400">
        {items.length > 0 ? items.join(" | ") : "none"}
      </div>
    </div>
  );
}
