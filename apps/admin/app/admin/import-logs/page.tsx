"use client";

import { useEffect, useState } from "react";
import { TechnicalModeGate } from "@/components/TechnicalModeGate";
import { adminApi, type TaxonomyImportBatch } from "@/lib/api";

type LoadState = "loading" | "success" | "error";

export default function AdminImportLogsPage() {
  return (
    <TechnicalModeGate>
      <AdminImportLogsWorkspace />
    </TechnicalModeGate>
  );
}

function AdminImportLogsWorkspace() {
  const [batches, setBatches] = useState<TaxonomyImportBatch[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadBatches() {
      try {
        const response = await adminApi.listTaxonomyImports();
        if (!mounted) {
          return;
        }
        setBatches(response);
        setState("success");
      } catch (error) {
        if (!mounted) {
          return;
        }
        setState("error");
        setMessage(error instanceof Error ? error.message : "Import logs failed to load.");
      }
    }

    void loadBatches();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          OpenStaff Taxonomy Imports
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Import Logs</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Review every import batch, including status, row count, duplicates, validation
          totals, and commit results.
        </p>

        {state === "loading" ? (
          <ShellNotice tone="neutral" message="Loading import history..." />
        ) : null}

        {state === "error" ? (
          <ShellNotice tone="danger" message={message ?? "Import logs failed to load."} />
        ) : null}

        {state === "success" && batches.length === 0 ? (
          <ShellNotice tone="neutral" message="No import batches have been uploaded yet." />
        ) : null}

        {state === "success" ? (
          <div className="mt-8 grid gap-5">
            {batches.map((batch) => (
              <article
                key={batch.id}
                className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge label={batch.entityType} tone="info" />
                      <Badge label={batch.status} tone={statusTone(batch.status)} />
                      <Badge label={`${batch.rowCount} rows`} tone="neutral" />
                    </div>
                    <h2 className="mt-4 break-all text-xl font-semibold text-cyan-100">
                      {batch.fileName}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Uploaded {formatDate(batch.createdAt)}
                      {batch.createdBy?.email ? ` by ${batch.createdBy.email}` : ""}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-5">
                      <Stat label="Valid" value={String(batch.validationSummary?.validRows ?? 0)} />
                      <Stat label="Invalid" value={String(batch.validationSummary?.invalidRows ?? 0)} />
                      <Stat label="Create" value={String(batch.validationSummary?.createCount ?? 0)} />
                      <Stat label="Update" value={String(batch.validationSummary?.updateCount ?? 0)} />
                      <Stat
                        label="Committed"
                        value={String(batch.commitSummary?.totalCommitted ?? 0)}
                      />
                    </div>

                    {batch.errors.length ? (
                      <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        {batch.errors.length} validation issue(s) captured for this batch.
                      </div>
                    ) : null}

                    {batch.duplicateSummary?.duplicateKeysInFile.length ? (
                      <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Duplicate keys in file: {batch.duplicateSummary.duplicateKeysInFile.join(", ")}
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-5 xl:w-80">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Batch Summary
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-slate-300">
                      <SummaryRow label="File record" value={batch.fileName} />
                      <SummaryRow label="File type" value={formatFileType(batch.fileMimeType)} />
                      <SummaryRow
                        label="Committed at"
                        value={batch.committedAt ? formatDate(batch.committedAt) : "Not committed"}
                      />
                      <SummaryRow label="Storage" value="Stored securely" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
}) {
  const styles =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : tone === "danger"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
          : tone === "neutral"
            ? "border-slate-700 bg-slate-900 text-slate-300"
            : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${styles}`}>
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm text-slate-200">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 break-all">{value}</div>
    </div>
  );
}

function ShellNotice({
  message,
  tone,
}: {
  message: string;
  tone: "neutral" | "danger";
}) {
  const styles =
    tone === "danger"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
      : "border-slate-800 bg-slate-950/80 text-slate-300";

  return <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "COMMITTED" || status === "READY_TO_COMMIT") {
    return "success";
  }

  if (status === "FAILED") {
    return "danger";
  }

  if (status === "VALIDATED" || status === "PARSED" || status === "UPLOADED") {
    return "warning";
  }

  return "neutral";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatFileType(value: string) {
  if (/csv/i.test(value)) {
    return "CSV";
  }

  if (/json/i.test(value)) {
    return "JSON import";
  }

  return "Import file";
}
