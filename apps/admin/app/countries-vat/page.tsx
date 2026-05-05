"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let isMounted = true;

    async function loadCountries() {
      setState("loading");
      setMessage(null);

      const result = await fetchApiJson<Country[]>("/countries");

      if (!isMounted) {
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

    void loadCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  async function createCountry() {
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

    if (!result.ok) {
      setState(result.kind);
      setMessage(result.message);
      return;
    }

    setName("");
    setCode("");
    setCurrency("");
    setVatRate("");
    setCountries((current) => [...current, result.data]);
    setState("success");
    setMessage(null);
  }

  if (state === "loading") {
    return (
      <div className="p-6 text-white md:p-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-semibold">Countries & VAT</h1>
          <p className="mt-3 text-slate-400">Loading countries...</p>
        </div>
      </div>
    );
  }

  if (state === "unauthorized") {
    return (
      <div className="p-6 text-white md:p-8">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h1 className="text-2xl font-semibold text-amber-200">
            Autentificare necesară
          </h1>
          <p className="mt-3 text-amber-100">
            {message ?? "API-ul funcționează, dar lipsește tokenul JWT."}
          </p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="p-6 text-white md:p-8">
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-rose-200">Eroare API</h1>
          <p className="mt-3 text-rose-100">
            {message ?? "API-ul nu răspunde."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white md:p-8">
      <div className="mb-8 rounded-3xl bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Countries & VAT</h1>
        <p className="mt-2 text-slate-400">
          Configurează țările active și ratele standard de TVA.
        </p>
      </div>

      <div className="mb-8 rounded-3xl bg-slate-900 p-6">
        <h2 className="mb-4 text-xl text-cyan-300">Add Country</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <input
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded bg-slate-800 p-3 text-white"
          />
          <input
            placeholder="Code (RO, DE...)"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="rounded bg-slate-800 p-3 text-white"
          />
          <input
            placeholder="Currency (EUR, GBP)"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="rounded bg-slate-800 p-3 text-white"
          />
          <input
            placeholder="VAT %"
            value={vatRate}
            onChange={(event) => setVatRate(event.target.value)}
            className="rounded bg-slate-800 p-3 text-white"
          />
        </div>

        <button
          onClick={createCountry}
          className="mt-4 rounded bg-cyan-500 px-4 py-3 font-semibold hover:bg-cyan-600"
        >
          Add Country
        </button>
      </div>

      <div className="rounded-3xl bg-slate-900 p-6">
        <h2 className="mb-4 text-xl text-cyan-300">Active Countries</h2>
        {countries.length === 0 ? (
          <p className="text-slate-400">No countries found.</p>
        ) : (
          <div className="space-y-3">
            {countries.map((country) => (
              <div
                key={country.id}
                className="rounded-2xl border border-slate-800 bg-slate-800/60 p-4"
              >
                <div className="text-sm text-slate-400">{country.code}</div>
                <div className="font-semibold">{country.name}</div>
                <div className="text-sm text-slate-300">
                  {country.currency} - TVA: {country.vatRate}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
