"use client";

import type { ReluBuilderResult, ReluBuilderSuggestion } from "@/lib/relu-builder-api";
import ReluStatusBadge from "./ReluStatusBadge";

type TaxonomySuggestionPanelProps = {
  title?: string;
  result: ReluBuilderResult | null;
  onApplySuggestion?: (suggestion: ReluBuilderSuggestion) => void;
  onIgnoreSuggestion?: (suggestion: ReluBuilderSuggestion) => void;
};

export default function TaxonomySuggestionPanel({
  title = "RELU AI suggestions",
  result,
  onApplySuggestion,
  onIgnoreSuggestion,
}: TaxonomySuggestionPanelProps) {
  if (!result) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-brand-charcoal">{title}</h2>
          <ReluStatusBadge status="idle" />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Ask RELU AI for advisory profile, taxonomy, or geography suggestions. Manual
          editing remains available at all times.
        </p>
      </section>
    );
  }

  const suggestions =
    result.suggestions.length > 0
      ? result.suggestions
      : [
          {
            key: `${result.type}-summary`,
            label: result.summary,
            source: "RELU AI suggestion" as const,
            category: "Summary",
          },
        ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-charcoal">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{result.advisoryMessage}</p>
        </div>
        <ReluStatusBadge status={result.status} />
      </div>

      <div className="mt-5 grid gap-3">
        {suggestions.map((suggestion) => (
          <article
            key={suggestion.key}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  {suggestion.category ?? "Suggestion"} - {suggestion.source}
                </div>
                <div className="mt-2 text-sm font-semibold leading-6 text-brand-charcoal">
                  {suggestion.label}
                </div>
                {suggestion.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {suggestion.description}
                  </p>
                ) : null}
                {typeof suggestion.confidence === "number" ? (
                  <div className="mt-3 text-xs font-medium text-slate-500">
                    Confidence: {suggestion.confidence}%
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {onApplySuggestion ? (
                  <button
                    type="button"
                    onClick={() => onApplySuggestion(suggestion)}
                    className="rounded-lg bg-brand-navy px-3 py-2 text-sm font-semibold text-white"
                  >
                    Apply suggestion
                  </button>
                ) : null}
                {onIgnoreSuggestion ? (
                  <button
                    type="button"
                    onClick={() => onIgnoreSuggestion(suggestion)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Ignore
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
