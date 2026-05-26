"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchApiJson } from "@/lib/api";

type Country = {
  id: string;
  name: string;
  code: string;
  currency: string;
  vatRate: number;
};

type LoadState = "loading" | "success" | "unauthorized" | "error";

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [vatRate, setVatRate] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadCountries() {
    setState("loading");
    setMessage(null);

    const result = await fetchApiJson<Country[]>("/countries");

    if (!result.ok) {
      setCountries([]);
      setState(result.kind);
      setMessage(result.message);
      return;
    }

    setCountries(Array.isArray(result.data) ? result.data : []);
    setState("success");
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialCountries() {
      const result = await fetchApiJson<Country[]>("/countries");

      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setCountries([]);
        setState(result.kind);
        setMessage(result.message);
        return;
      }

      setCountries(Array.isArray(result.data) ? result.data : []);
      setState("success");
    }

    void loadInitialCountries();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(
    () => ({
      countries: countries.length,
      averageVat:
        countries.length > 0
          ? Math.round(
              countries.reduce((total, country) => total + Number(country.vatRate || 0), 0) /
                countries.length,
            )
          : 0,
      currencies: new Set(countries.map((country) => country.currency).filter(Boolean)).size,
    }),
    [countries],
  );

  async function createCountry() {
    setSaving(true);
    setMessage(null);

    const result = await fetchApiJson<Country>("/countries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        code,
        currency,
        vatRate: Number.parseFloat(vatRate),
      }),
    });

    setSaving(false);

    if (!result.ok) {
      setMessage(humanizeError(result.message));
      return;
    }

    setName("");
    setCode("");
    setCurrency("");
    setVatRate("");
    setCountries((current) => [...current, result.data]);
    setState("success");
    setMessage(`Added ${result.data.name} to the VAT reference list.`);
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Financial engine
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Countries & VAT</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Maintain country, currency, and VAT defaults used across marketplace billing and
              public commercial flows.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Countries" value={metrics.countries} />
            <MetricCard label="Currencies" value={metrics.currencies} />
            <MetricCard label="Avg VAT" value={`${metrics.averageVat}%`} />
          </div>
        </div>

        {message ? (
          <InlineNotice
            tone={state === "error" || state === "unauthorized" ? "warning" : "success"}
            message={humanizeError(message)}
            actionLabel={state === "error" || state === "unauthorized" ? "Retry" : undefined}
            onAction={state === "error" || state === "unauthorized" ? () => void loadCountries() : undefined}
          />
        ) : null}

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Add Country</h2>
              <p className="mt-2 text-sm text-slate-400">
                Add a billing-ready market without exposing technical request errors to operators.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <TextField label="Country" value={name} onChange={setName} placeholder="Romania" />
            <TextField label="Code" value={code} onChange={setCode} placeholder="RO" />
            <TextField label="Currency" value={currency} onChange={setCurrency} placeholder="EUR" />
            <TextField label="VAT rate" value={vatRate} onChange={setVatRate} placeholder="19" />
          </div>

          <button
            type="button"
            onClick={() => void createCountry()}
            disabled={saving || !name.trim() || !code.trim() || !currency.trim()}
            className="mt-5 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Country"}
          </button>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Active Countries</h2>
              <p className="mt-2 text-sm text-slate-400">
                Compact operational list used by pricing, invoicing, and onboarding.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadCountries()}
              className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          {state === "loading" ? (
            <InlineNotice tone="neutral" message="Loading country reference data..." />
          ) : null}

          {state !== "loading" && countries.length === 0 ? (
            <EmptyState
              title="No countries available"
              description={
                state === "success"
                  ? "Add the first country above to activate billing defaults."
                  : "Country data could not be loaded. The page remains usable while the source recovers."
              }
            />
          ) : null}

          {countries.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {countries.map((country) => (
                <article
                  key={country.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                        {country.code}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-white">{country.name}</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                      {country.currency}
                    </span>
                  </div>
                  <div className="mt-4 text-sm text-slate-300">
                    Standard VAT rate: <span className="font-semibold text-white">{country.vatRate}%</span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span className="font-semibold">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
      />
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InlineNotice({
  actionLabel,
  message,
  onAction,
  tone,
}: {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  tone: "neutral" | "success" | "warning";
}) {
  const styles =
    tone === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
      : tone === "warning"
        ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
        : "border-slate-800 bg-slate-950/70 text-slate-300";

  return (
    <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      <span>{message}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-8">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}

function humanizeError(message: string) {
  if (/internal server error/i.test(message)) {
    return "Country and VAT data is temporarily unavailable. The page remains stable while you retry.";
  }

  if (/token|auth|unauthorized/i.test(message)) {
    return "Your session needs attention before country and VAT data can be changed.";
  }

  if (/network|cors|unavailable/i.test(message)) {
    return "Country and VAT data could not be reached. Check the connection and retry.";
  }

  return message;
}
