"use client";

import { useMemo, useState } from "react";
import ReluSmartInput from "@/components/relu/ReluSmartInput";
import TaxonomySuggestionPanel from "@/components/relu/TaxonomySuggestionPanel";
import type {
  ReluBuilderResult,
  ReluBuilderSuggestion,
} from "@/lib/relu-builder-api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type DraftState = {
  summary: string;
  taxonomy: string;
  esco: string;
  nace: string;
  geography: string;
};

const emptyDraft: DraftState = {
  summary: "",
  taxonomy: "",
  esco: "",
  nace: "",
  geography: "",
};

export default function ReluBuilderFoundationPage() {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [lastResult, setLastResult] = useState<ReluBuilderResult | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  const canUseBuilder = user?.role === "SUPERADMIN";

  const guidance = useMemo(
    () => [
      "AI suggestions are advisory only.",
      "Manual profile and post creation must continue to work if AI is unavailable.",
      "Suggestions are never saved automatically.",
      "Human review may still be required before public use.",
    ],
    [],
  );

  function updateDraft(field: keyof DraftState, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSuggestionSelect(
    field: keyof DraftState,
    suggestion: ReluBuilderSuggestion,
    result: ReluBuilderResult,
  ) {
    updateDraft(field, suggestion.label);
    setLastResult(result);
  }

  function handlePanelApply(suggestion: ReluBuilderSuggestion) {
    setAppliedSuggestions((current) =>
      current.includes(suggestion.label) ? current : [...current, suggestion.label],
    );
  }

  function handlePanelIgnore(suggestion: ReluBuilderSuggestion) {
    setAppliedSuggestions((current) =>
      current.filter((item) => item !== suggestion.label),
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-brand-charcoal md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-brand-navy">
              Back to dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold md:text-4xl">
              RELU Builder foundation
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              Internal preview for reusable RELU-assisted drafting and taxonomy
              selection. This layer prepares suggestions only; operators and users stay
              in control.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <div className="font-semibold text-brand-charcoal">Execution boundary</div>
            <div className="mt-2">No auto-save. No backend changes. No raw technical IDs.</div>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {guidance.map((item) => (
            <div key={item} className="rounded-lg border border-sky-100 bg-white p-4 text-sm text-slate-700">
              {item}
            </div>
          ))}
        </section>

        {!isReady ? (
          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading RELU Builder workspace...
          </section>
        ) : null}

        {isReady && !isAuthenticated ? (
          <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-950">Sign-in required</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Sign in with an authorized technical operator account before asking RELU
              AI for suggestions. Manual drafting outside this preview remains available.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          </section>
        ) : null}

        {isReady && isAuthenticated && !canUseBuilder ? (
          <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-950">
              Technical operator access required
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              RELU Builder endpoints are restricted to authorized technical operators.
              Profile and post creation should continue manually without this AI layer.
            </p>
          </section>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <ReluSmartInput
              label="Profile or post summary"
              placeholder="Describe the service, project, or professional profile..."
              value={draft.summary}
              type="summary"
              token={token}
              disabled={!canUseBuilder}
              onChange={(value) => updateDraft("summary", value)}
              onSuggestionSelect={(suggestion, result) =>
                handleSuggestionSelect("summary", suggestion, result)
              }
            />

            <ReluSmartInput
              label="General taxonomy"
              placeholder="Example: Romanian construction electrician profile..."
              value={draft.taxonomy}
              type="taxonomy"
              token={token}
              disabled={!canUseBuilder}
              onChange={(value) => updateDraft("taxonomy", value)}
              onSuggestionSelect={(suggestion, result) =>
                handleSuggestionSelect("taxonomy", suggestion, result)
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ReluSmartInput
                label="ESCO"
                placeholder="Example: electrician building maintenance..."
                value={draft.esco}
                type="esco"
                token={token}
                disabled={!canUseBuilder}
                onChange={(value) => updateDraft("esco", value)}
                onSuggestionSelect={(suggestion, result) =>
                  handleSuggestionSelect("esco", suggestion, result)
                }
              />

              <ReluSmartInput
                label="NACE"
                placeholder="Example: electrical installation contractor..."
                value={draft.nace}
                type="nace"
                token={token}
                disabled={!canUseBuilder}
                onChange={(value) => updateDraft("nace", value)}
                onSuggestionSelect={(suggestion, result) =>
                  handleSuggestionSelect("nace", suggestion, result)
                }
              />
            </div>

            <ReluSmartInput
              label="Geography"
              placeholder="Example: Bucharest construction workforce region..."
              value={draft.geography}
              type="geography"
              token={token}
              disabled={!canUseBuilder}
              onChange={(value) => updateDraft("geography", value)}
              onSuggestionSelect={(suggestion, result) =>
                handleSuggestionSelect("geography", suggestion, result)
              }
            />
          </div>

          <aside className="grid gap-4 self-start">
            <TaxonomySuggestionPanel
              result={lastResult}
              onApplySuggestion={handlePanelApply}
              onIgnoreSuggestion={handlePanelIgnore}
            />

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-brand-charcoal">
                Applied in this preview
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Applying here only updates the local preview state. It does not save to
                profile, onboarding, or marketplace records.
              </p>
              {appliedSuggestions.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {appliedSuggestions.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No suggestion applied in this preview yet.
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
