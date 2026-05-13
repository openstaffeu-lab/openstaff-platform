"use client";

import { useEffect, useState } from "react";
import {
  generateRenewals,
  getBillingInvoices,
  getBillingPayments,
  getBillingRenewals,
  getBillingWebhooks,
  markInvoicePaid,
  processBillingWebhook,
  processRenewal,
  type BillingInvoice,
  type BillingWebhookEvent,
  type PaymentRecord,
  type SubscriptionRenewal,
} from "@/lib/api";

function formatDate(value: string | null) {
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

function currentMonthWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [webhooks, setWebhooks] = useState<BillingWebhookEvent[]>([]);
  const [renewals, setRenewals] = useState<SubscriptionRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [nextInvoices, nextPayments, nextWebhooks, nextRenewals] = await Promise.all([
          getBillingInvoices(),
          getBillingPayments(),
          getBillingWebhooks(),
          getBillingRenewals(),
        ]);

        if (!cancelled) {
          setInvoices(nextInvoices);
          setPayments(nextPayments);
          setWebhooks(nextWebhooks);
          setRenewals(nextRenewals);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nu am putut incarca billing dashboard.",
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

  async function handleMarkPaid(invoiceId: string) {
    setBusyKey(`invoice:${invoiceId}`);
    setError(null);
    setSuccess(null);

    try {
      const result = await markInvoicePaid(invoiceId, { provider: "MANUAL" });
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === invoiceId ? result.invoice : invoice)),
      );
      setPayments((current) => [result.payment, ...current]);
      setSuccess(`Invoice ${result.invoice.invoiceNumber} marked as paid.`);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nu am putut marca factura ca platita.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleProcessWebhook(webhookId: string) {
    setBusyKey(`webhook:${webhookId}`);
    setError(null);
    setSuccess(null);

    try {
      const result = await processBillingWebhook(webhookId, { status: "PROCESSED" });
      setWebhooks((current) =>
        current.map((item) => (item.id === webhookId ? result : item)),
      );
      setSuccess(`Webhook ${result.eventType} processed.`);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nu am putut procesa webhook-ul.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleGenerateRenewals() {
    setBusyKey("renewals:generate");
    setError(null);
    setSuccess(null);

    try {
      const result = await generateRenewals(currentMonthWindow());
      const nextRenewals = await getBillingRenewals();
      setRenewals(nextRenewals);
      setSuccess(`Generated ${result.createdCount} renewal records.`);
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Nu am putut genera renewals.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleProcessRenewal(renewalId: string) {
    setBusyKey(`renewal:${renewalId}`);
    setError(null);
    setSuccess(null);

    try {
      const result = await processRenewal(renewalId);
      setRenewals((current) =>
        current.map((item) => (item.id === renewalId ? result.renewal : item)),
      );
      if (result.invoice) {
        const invoice = result.invoice;
        setInvoices((current) => [
          invoice,
          ...current.filter((item) => item.id !== invoice.id),
        ]);
      }
      setSuccess(`Renewal ${renewalId} processed.`);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nu am putut procesa renewal-ul.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6 px-6 py-8 md:px-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Billing Engine Foundation
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">Invoices, webhooks, renewals</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          EXEC-04B ofera stratul minim de agregare comerciala: facturi, reconciliere
          manuala, ingestie webhook placeholder si recurring renewals administrabile.
        </p>
      </section>

      {error ? (
        <section className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      {success ? (
        <section className="rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {success}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Renewals</div>
            <div className="mt-2 text-lg font-semibold text-white">Recurring renewal scheduler</div>
          </div>
          <button
            type="button"
            onClick={() => void handleGenerateRenewals()}
            disabled={busyKey === "renewals:generate"}
            className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            Generate renewals
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-6 py-4 text-lg font-semibold text-white">
          Invoices
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
            <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
              <tr>
                <th className="px-4 py-4">Invoice</th>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-4 py-4">Due</th>
                <th className="px-4 py-4">Lines</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={7}>
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-4 font-medium text-white">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-4 text-slate-300">{invoice.user.email}</td>
                    <td className="px-4 py-4 text-slate-300">{invoice.status}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {(invoice.total / 100).toFixed(2)} {invoice.currency}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(invoice.dueAt)}</td>
                    <td className="px-4 py-4 text-slate-300">{invoice.lineCount ?? "-"}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={invoice.status === "PAID" || busyKey === `invoice:${invoice.id}`}
                        onClick={() => void handleMarkPaid(invoice.id)}
                        className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
                      >
                        Mark paid
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={7}>
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 px-6 py-4 text-lg font-semibold text-white">
            Payments
          </div>
          <div className="space-y-3 px-6 py-5">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm"
                >
                  <div className="font-medium text-white">
                    {(payment.amount / 100).toFixed(2)} {payment.currency}
                  </div>
                  <div className="mt-1 text-slate-400">
                    {payment.provider} | {payment.status} |{" "}
                    {payment.invoice?.invoiceNumber ?? "No invoice"}
                  </div>
                  <div className="mt-1 text-slate-500">{formatDate(payment.paidAt)}</div>
                </div>
              ))
            ) : (
              <div className="px-1 py-2 text-sm text-slate-400">No payments recorded yet.</div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 px-6 py-4 text-lg font-semibold text-white">
            Webhooks
          </div>
          <div className="space-y-3 px-6 py-5">
            {webhooks.length > 0 ? (
              webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-white">
                        {webhook.provider} / {webhook.eventType}
                      </div>
                      <div className="mt-1 text-slate-400">{webhook.status}</div>
                    </div>
                    <button
                      type="button"
                      disabled={
                        webhook.status === "PROCESSED" || busyKey === `webhook:${webhook.id}`
                      }
                      onClick={() => void handleProcessWebhook(webhook.id)}
                      className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
                    >
                      Process
                    </button>
                  </div>
                  <div className="mt-2 text-slate-500">{formatDate(webhook.createdAt)}</div>
                </div>
              ))
            ) : (
              <div className="px-1 py-2 text-sm text-slate-400">No webhook events captured yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 px-6 py-4 text-lg font-semibold text-white">
          Renewals
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
            <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
              <tr>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4">Period</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Invoice</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {renewals.length > 0 ? (
                renewals.map((renewal) => (
                  <tr key={renewal.id}>
                    <td className="px-4 py-4 text-slate-300">{renewal.user.email}</td>
                    <td className="px-4 py-4 text-white">{renewal.subscription.plan.code}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {formatDate(renewal.periodStart)} - {formatDate(renewal.periodEnd)}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{renewal.status}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {renewal.billingInvoice?.invoiceNumber ?? "-"}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={
                          renewal.status === "PROCESSED" || busyKey === `renewal:${renewal.id}`
                        }
                        onClick={() => void handleProcessRenewal(renewal.id)}
                        className="rounded-full bg-fuchsia-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
                      >
                        Process
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={6}>
                    No renewals scheduled yet.
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
