"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminApi,
  type TaxonomyImportOption,
  type TaxonomyImportType,
} from "@/lib/api";

type LoadState = "loading" | "success" | "error";

export default function AdminTaxonomyPage() {
  const [options, setOptions] = useState<TaxonomyImportOption[]>([]);
  const [entityType, setEntityType] = useState<TaxonomyImportType>("ESCO");
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [editorValue, setEditorValue] = useState("{}");
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
        setMessage(error instanceof Error ? error.message : "Taxonomy page failed to load.");
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
        setEditorValue(
          nextSelected
            ? JSON.stringify(
                response.items.find((item) => item.id === nextSelected) ?? {},
                null,
                2,
              )
            : "{}",
        );
      } catch (error) {
        if (!mounted) {
          return;
        }
        setMessage(error instanceof Error ? error.message : "Taxonomy browser failed to load.");
      }
    }

    void loadEntries();

    return () => {
      mounted = false;
    };
  }, [entityType, query, state]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (selectedItem) {
      setEditorValue(JSON.stringify(selectedItem, null, 2));
    }
  }, [selectedItem]);

  async function saveEntry() {
    if (!selectedId) {
      setMessage("Choose an entry before saving.");
      return;
    }

    try {
      const payload = JSON.parse(editorValue) as Record<string, unknown>;
      setSaving(true);
      setMessage(null);
      const updated = await adminApi.updateTaxonomyEntry(entityType, selectedId, payload);
      setItems((current) =>
        current.map((item) => (item.id === selectedId ? updated : item)),
      );
      setEditorValue(JSON.stringify(updated, null, 2));
      setMessage("Taxonomy entry updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Taxonomy update failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          OpenStaff Taxonomy Browser
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Taxonomy Browser & Editor</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Browse imported taxonomy, location, VAT, and currency data. Select an entry,
          edit its JSON payload, and save it back through structured admin endpoints.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {state === "loading" ? (
          <ShellNotice tone="neutral" message="Loading taxonomy browser..." />
        ) : null}

        {state === "error" ? (
          <ShellNotice tone="danger" message={message ?? "Taxonomy browser failed to load."} />
        ) : null}

        {state === "success" ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <label className="grid gap-2 text-sm text-slate-300">
                <span className="font-black uppercase tracking-[0.2em] text-slate-500">Dataset</span>
                <select
                  value={entityType}
                  onChange={(event) => setEntityType(event.target.value as TaxonomyImportType)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 grid gap-2 text-sm text-slate-300">
                <span className="font-black uppercase tracking-[0.2em] text-slate-500">Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Code, slug, label, name..."
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
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
                          ? "border-cyan-400/40 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                        {String(item.code ?? item.key ?? item.slug ?? item.id)}
                      </div>
                      <div className="mt-2 text-base font-semibold text-white">
                        {String(item.name ?? item.label ?? item.slug ?? "Untitled")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    JSON Editor
                  </div>
                  <div className="mt-2 text-xl font-semibold text-cyan-100">
                    {selectedItem
                      ? String(selectedItem.name ?? selectedItem.label ?? selectedItem.id)
                      : "No entry selected"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void saveEntry()}
                  disabled={!selectedId || saving}
                  className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Entry"}
                </button>
              </div>

              <textarea
                value={editorValue}
                onChange={(event) => setEditorValue(event.target.value)}
                className="mt-5 min-h-[620px] w-full rounded-3xl border border-slate-800 bg-slate-900 p-4 font-mono text-sm text-slate-200 outline-none"
              />
            </div>
          </div>
        ) : null}
      </section>
    </main>
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
