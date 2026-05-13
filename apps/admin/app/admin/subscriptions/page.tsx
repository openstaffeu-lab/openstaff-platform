"use client";

import { useEffect, useState } from "react";
import {
  getAdminUpgradeRequests,
  type UpgradeRequest,
  updateUpgradeRequestStatus,
} from "@/lib/api";

const STATUS_OPTIONS = ["CONTACTED", "APPROVED", "REJECTED", "CLOSED"] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminSubscriptionsPage() {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const nextRequests = await getAdminUpgradeRequests();

        if (!cancelled) {
          setRequests(nextRequests);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nu am putut incarca cererile de upgrade.",
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
  }, []);

  async function handleStatusChange(
    requestId: string,
    status: "CONTACTED" | "APPROVED" | "REJECTED" | "CLOSED",
  ) {
    setBusyId(requestId);
    setError(null);

    try {
      const updated = await updateUpgradeRequestStatus(requestId, status);
      setRequests((current) =>
        current.map((item) => (item.id === requestId ? updated : item)),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Nu am putut actualiza statusul cererii.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 px-6 py-8 md:px-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Subscription Upgrade Requests
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">Manual upgrade pipeline</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Cererile venite din pricing sau din limit reached CTA apar aici pentru follow-up
          comercial. EXEC-03F nu activeaza automat planul.
        </p>
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
                <th className="px-4 py-4">Created</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Company</th>
                <th className="px-4 py-4">Current plan</th>
                <th className="px-4 py-4">Requested</th>
                <th className="px-4 py-4">Source</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={8}>
                    Loading upgrade requests...
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id} className="align-top">
                    <td className="px-4 py-4 text-slate-300">{formatDate(request.createdAt)}</td>
                    <td className="px-4 py-4 font-medium text-white">{request.email}</td>
                    <td className="px-4 py-4 text-slate-300">{request.name ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-300">{request.companyName ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-300">{request.currentPlanCode ?? "-"}</td>
                    <td className="px-4 py-4 text-cyan-300">{request.requestedPlanCode}</td>
                    <td className="px-4 py-4 text-slate-300">{request.source}</td>
                    <td className="px-4 py-4">
                      <select
                        value={request.status}
                        onChange={(event) =>
                          void handleStatusChange(
                            request.id,
                            event.target.value as
                              | "CONTACTED"
                              | "APPROVED"
                              | "REJECTED"
                              | "CLOSED",
                          )
                        }
                        disabled={busyId === request.id}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60"
                      >
                        <option value="PENDING">PENDING</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={8}>
                    No upgrade requests recorded yet.
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
