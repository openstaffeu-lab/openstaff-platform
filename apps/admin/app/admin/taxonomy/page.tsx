"use client";

import { useEffect, useMemo, useState } from "react";
import { TechnicalModeGate } from "@/components/TechnicalModeGate";
import {
  adminApi,
  type TaxonomyImportOption,
  type TaxonomyImportType,
} from "@/lib/api";

type LoadState = "loading" | "success" | "error";
type TaxonomyItem = Record<string, unknown>;
type TaxonomyDraft = {
  code: string;
  label: string;
  description: string;
  parent: string;
};

export default function AdminTaxonomyPage() {
  return (
    <TechnicalModeGate>
      <AdminTaxonomyWorkspace />
    </TechnicalModeGate>
  );
}

function AdminTaxonomyWorkspace() {
  const [options, setOptions] = useState<TaxonomyImportOption[]>([]);
  const [entityType, setEntityType] = useState<TaxonomyImportType>("ESCO");
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<TaxonomyDraft>({
    code: "",
    label: "",
    description: "",
    parent: "",
  });
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        const response = await adminApi.getTaxonomyImportOptions();
        if (!mounted) {
          return;
        }
        setOptions(response.supportedTypes);
        setEntityType(response.supportedTypes[0]?.value ?? "ESCO");
        setState("success");
      } catch (error) {
        if (!mounted) {
          return;
        }
        setState("error");
        setMessage(error instanceof Error ? error.message : "Taxonomy review failed to load.");
      }
    }

    void loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadEntries() {
      if (state !== "success") {
        return;
      }

      try {
        setMessage(null);
        const response = await adminApi.browseTaxonomy(entityType, query);
        if (!mounted) {
          return;
        }

        setItems(response.items);
        const nextSelected = response.items[0]?.id;
        setSelectedId(typeof nextSelected === "string" ? nextSelected : "");
      } catch (error) {
        if (!mounted) {
          return;
        }
        setItems([]);
        setSelectedId("");
        setMessage(error instanceof Error ? error.message : "Taxonomy entries could not load.");
      }
    }

    void loadEntries();

    return () => {
      mounted = false;
    };
  }, [entityType, query, state]);

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    setDraft(buildDraft(selectedItem));
  }, [selectedItem]);

  async function saveEntry() {
    if (!selectedId || !selectedItem) {
      setMessage("Choose a taxonomy entry before saving.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const updated = await adminApi.updateTaxonomyEntry(entityType, selectedId, {
        ...selectedItem,
        code: draft.code || selectedItem.code,
        label: draft.label || selectedItem.label,
        name: draft.label || selectedItem.name,
        description: draft.description || selectedItem.description,
        parentCode: draft.parent || selectedItem.parentCode,
      });
      setItems((current) =>
        current.map((item) => (String(item.id) === selectedId ? updated : item)),
      );
      setMessage("Taxonomy label saved for moderator use.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Taxonomy update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
              RELU taxonomy review
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Category Approvals</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Review labels used by RELU matching and public marketplace filters. This surface
              hides source payloads and keeps moderators focused on business-readable categories.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Dataset" value={entityType} />
            <MetricCard label="Visible entries" value={items.length} />
            <MetricCard label="Mode" value="Approval" />
          </div>
        </div>

        {message ? (
          <InlineNotice tone={state === "error" ? "warning" : "success"} message={humanizeError(message)} />
        ) : null}

        {state === "loading" ? (
          <InlineNotice tone="neutral" message="Loading taxonomy review..." />
        ) : null}

        {state === "error" ? (
          <InlineNotice
            tone="warning"
            message={humanizeError(message ?? "Taxonomy review is temporarily unavailable.")}
          />
        ) : null}

        {state === "success" ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <label className="grid gap-2 text-sm text-slate-300">
                <span className="font-semibold">Dataset</span>
                <select
                  value={entityType}
                  onChange={(event) => setEntityType(event.target.value as TaxonomyImportType)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 grid gap-2 text-sm text-slate-300">
                <span className="font-semibold">Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Occupation, industry, country..."
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />
              </label>

              <div className="mt-5 max-h-[620px] overflow-y-auto pr-1">
                <div className="grid gap-3">
                  {items.map((item) => (
                    <button
                      key={String(item.id)}
                      type="button"
                      onClick={() => setSelectedId(String(item.id))}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        selectedId === String(item.id)
                          ? "border-cyan-400/40 bg-cyan-400/10"
                          : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {displayCode(item)}
                      </div>
                      <div className="mt-2 text-base font-semibold text-white">
                        {displayName(item)}
                      </div>
                      <div className="mt-2 text-xs text-slate-400">{displayParent(item)}</div>
                    </button>
                  ))}

                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-400">
                      No taxonomy entries match this search.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              {selectedItem ? (
                <>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
                        RELU matched category
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold text-white">
                        {displayName(selectedItem)}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                        Moderators can approve the label as-is, reject it by changing the label,
                        or adjust the category wording before it appears in matching and public
                        filters.
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                      Ready for moderator approval
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Public code"
                      value={draft.code}
                      onChange={(value) => setDraft((current) => ({ ...current, code: value }))}
                    />
                    <TextField
                      label="Public label"
                      value={draft.label}
                      onChange={(value) => setDraft((current) => ({ ...current, label: value }))}
                    />
                    <TextField
                      label="Parent category"
                      value={draft.parent}
                      onChange={(value) => setDraft((current) => ({ ...current, parent: value }))}
                    />
                    <TextField
                      label="Moderator note"
                      value={draft.description}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, description: value }))
                      }
                    />
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <DecisionCard
                      title="Approve"
                      description="Use this label in RELU matching and public taxonomy filters."
                    />
                    <DecisionCard
                      title="Reject"
                      description="Change the public label or parent before saving the category."
                    />
                    <DecisionCard
                      title="Adjust Category"
                      description="Normalize language so public and backoffice surfaces use the same naming."
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void saveEntry()}
                      disabled={!selectedId || saving}
                      className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Category"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-8">
                  <h2 className="text-xl font-semibold text-white">Choose a category</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                    Select an entry from the left to review its public label and moderation use.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function buildDraft(item: TaxonomyItem | null): TaxonomyDraft {
  if (!item) {
    return { code: "", label: "", description: "", parent: "" };
  }

  return {
    code: String(item.code ?? item.key ?? ""),
    label: displayName(item),
    description: String(item.description ?? item.note ?? ""),
    parent: String(item.parentCode ?? item.industrySlug ?? item.countryCode ?? ""),
  };
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span className="font-semibold">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function DecisionCard({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: number | string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InlineNotice({
  message,
  tone,
}: {
  message: string;
  tone: "neutral" | "success" | "warning";
}) {
  const styles =
    tone === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
      : tone === "warning"
        ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
        : "border-slate-800 bg-slate-950/70 text-slate-300";

  return <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}

function displayName(item: TaxonomyItem) {
  return String(
    item.name ??
      item.label ??
      item.labelEn ??
      item.title ??
      item.currencyName ??
      item.countryName ??
      "Reference item",
  );
}

function displayCode(item: TaxonomyItem) {
  return String(item.code ?? item.key ?? item.countryCode ?? "Public category");
}

function displayParent(item: TaxonomyItem) {
  const parent = item.parentCode ?? item.industrySlug ?? item.countryCode ?? item.category;
  return parent ? `Parent: ${String(parent)}` : "No parent category";
}

function humanizeError(message: string) {
  if (/internal server error/i.test(message)) {
    return "Taxonomy review is temporarily unavailable. Moderation layout remains stable while the source recovers.";
  }

  return message;
}
