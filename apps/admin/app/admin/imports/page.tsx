"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminApi,
  type TaxonomyImportBatch,
  type TaxonomyImportOption,
  type TaxonomyImportType,
} from "@/lib/api";

type LoadState = "loading" | "success" | "error";

export default function AdminImportsPage() {
  const [options, setOptions] = useState<TaxonomyImportOption[]>([]);
  const [selectedType, setSelectedType] = useState<TaxonomyImportType>("ESCO");
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<TaxonomyImportBatch | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [busy, setBusy] = useState<"" | "upload" | "parse" | "validate" | "commit">("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        const response = await adminApi.getTaxonomyImportOptions();
        if (!mounted) {
          return;
        }
        setOptions(response.supportedTypes);
        if (response.supportedTypes[0]) {
          setSelectedType(response.supportedTypes[0].value);
        }
        setState("success");
      } catch (error) {
        if (!mounted) {
          return;
        }
        setState("error");
        setMessage(error instanceof Error ? error.message : "Import options failed to load.");
      }
    }

    void loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedType) ?? null,
    [options, selectedType],
  );

  async function handleUpload() {
    if (!file) {
      setMessage("Choose a CSV or Excel file first.");
      return;
    }

    try {
      setBusy("upload");
      setMessage(null);
      const uploaded = await adminApi.uploadTaxonomyImport(selectedType, file);
      setBatch(uploaded);
      setMessage(`Uploaded ${uploaded.fileName}. Continue with parse, validate, and commit.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy("");
    }
  }

  async function runAction(action: "parse" | "validate" | "commit") {
    if (!batch) {
      setMessage("Upload a file before running import actions.");
      return;
    }

    try {
      setBusy(action);
      setMessage(null);

      const nextBatch =
        action === "parse"
          ? await adminApi.parseTaxonomyImport(batch.id)
          : action === "validate"
            ? await adminApi.validateTaxonomyImport(batch.id)
            : await adminApi.commitTaxonomyImport(batch.id);

      setBatch(nextBatch);
      setMessage(
        action === "commit"
          ? "Import committed successfully."
          : `Import ${action} completed successfully.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Import ${action} failed.`);
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          OpenStaff Taxonomy Imports
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Excel / CSV Import</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Upload spreadsheet data, parse it into a preview, validate duplicates and errors,
          then commit the batch into the real taxonomy, geography, VAT, and currency models.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {state === "loading" ? (
          <Notice tone="neutral" message="Loading import configuration..." />
        ) : null}

        {state === "error" ? <Notice tone="danger" message={message ?? "Import page failed to load."} /> : null}

        {state === "success" ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Import Setup
              </div>

              <label className="mt-4 grid gap-2 text-sm text-slate-300">
                <span className="font-black uppercase tracking-[0.18em] text-slate-500">
                  Dataset
                </span>
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value as TaxonomyImportType)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                {selectedOption?.description ?? "Select a supported dataset to import."}
              </p>

              <label className="mt-5 grid gap-2 text-sm text-slate-300">
                <span className="font-black uppercase tracking-[0.18em] text-slate-500">
                  File
                </span>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                />
              </label>

              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={busy === "upload"}
                className="mt-5 w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
              >
                {busy === "upload" ? "Uploading..." : "Upload Import File"}
              </button>

              <div className="mt-5 grid gap-3">
                <ActionButton
                  label={busy === "parse" ? "Parsing..." : "Parse"}
                  onClick={() => void runAction("parse")}
                  disabled={!batch || busy !== ""}
                />
                <ActionButton
                  label={busy === "validate" ? "Validating..." : "Validate"}
                  onClick={() => void runAction("validate")}
                  disabled={!batch || busy !== ""}
                />
                <ActionButton
                  label={busy === "commit" ? "Committing..." : "Commit Import"}
                  onClick={() => void runAction("commit")}
                  disabled={!batch || busy !== ""}
                  tone="success"
                />
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Current Batch
                    </div>
                    <div className="mt-2 text-xl font-semibold text-cyan-100">
                      {batch?.fileName ?? "No batch uploaded yet"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Pill label={batch?.entityType ?? selectedType} />
                    <Pill label={batch?.status ?? "IDLE"} tone="success" />
                    <Pill label={`${batch?.rowCount ?? 0} rows`} tone="neutral" />
                  </div>
                </div>

                {batch?.validationSummary ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-5">
                    <MetricCard label="Total" value={String(batch.validationSummary.totalRows)} />
                    <MetricCard label="Valid" value={String(batch.validationSummary.validRows)} />
                    <MetricCard label="Invalid" value={String(batch.validationSummary.invalidRows)} />
                    <MetricCard label="Create" value={String(batch.validationSummary.createCount)} />
                    <MetricCard label="Update" value={String(batch.validationSummary.updateCount)} />
                  </div>
                ) : null}

                {batch?.duplicateSummary?.duplicateKeysInFile.length ? (
                  <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Duplicate keys in file: {batch.duplicateSummary.duplicateKeysInFile.join(", ")}
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Preview
                </div>
                {batch?.preview.length ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-300">
                      <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          {Object.keys(batch.preview[0] ?? {}).map((key) => (
                            <th key={key} className="px-3 py-2">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {batch.preview.slice(0, 12).map((row, index) => (
                          <tr key={`preview-${index}`} className="border-t border-slate-800">
                            {Object.entries(row).map(([key, value]) => (
                              <td key={`${index}-${key}`} className="px-3 py-3 align-top text-slate-300">
                                {typeof value === "object" && value !== null
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Notice tone="neutral" message="Preview will appear after parse or validate." />
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Error Report
                </div>
                {batch?.errors.length ? (
                  <div className="mt-4 grid gap-3">
                    {batch.errors.slice(0, 20).map((error) => (
                      <div
                        key={`${error.rowNumber}-${error.code}-${error.key ?? "none"}`}
                        className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                      >
                        <div className="font-black uppercase tracking-[0.18em]">
                          Row {error.rowNumber} · {error.code}
                        </div>
                        <div className="mt-2">{error.message}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Notice tone="neutral" message="Validation errors will appear here before commit." />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone = "neutral",
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  tone?: "neutral" | "success";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
        tone === "success"
          ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          : "border border-slate-700 bg-slate-900 text-white hover:border-cyan-400/40"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Pill({
  label,
  tone = "info",
}: {
  label: string;
  tone?: "info" | "success" | "neutral";
}) {
  const className =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : tone === "neutral"
        ? "border-slate-700 bg-slate-900 text-slate-300"
        : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${className}`}>
      {label}
    </span>
  );
}

function Notice({
  tone,
  message,
}: {
  tone: "neutral" | "danger";
  message: string;
}) {
  return (
    <div
      className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
        tone === "danger"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
          : "border-slate-800 bg-slate-900/80 text-slate-300"
      }`}
    >
      {message}
    </div>
  );
}
