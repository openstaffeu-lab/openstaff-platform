"use client";

import { useEffect, useState } from "react";
import {
  getAdminOnboardingSessions,
  type AdminOnboardingSession,
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
                  <td className="px-4 py-6 text-slate-400" colSpan={9}>
                    Loading onboarding sessions...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
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
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={9}>
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
