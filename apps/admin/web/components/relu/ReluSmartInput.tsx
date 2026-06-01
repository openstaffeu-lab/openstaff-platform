"use client";

import { useEffect, useMemo, useState } from "react";
import { useReluBuilder } from "@/hooks/useReluBuilder";
import type {
  ReluBuilderResult,
  ReluBuilderSuggestion,
  ReluBuilderType,
} from "@/lib/relu-builder-api";
import ReluStatusBadge from "./ReluStatusBadge";

type ReluSmartInputProps = {
  label: string;
  placeholder: string;
  value: string;
  type: Extract<ReluBuilderType, "summary" | "taxonomy" | "esco" | "nace" | "geography">;
  disabled?: boolean;
  token?: string | null;
  onChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: ReluBuilderSuggestion, result: ReluBuilderResult) => void;
};

export default function ReluSmartInput({
  label,
  placeholder,
  value,
  type,
  disabled = false,
  token,
  onChange,
  onSuggestionSelect,
}: ReluSmartInputProps) {
  const [query, setQuery] = useState(value);
  const builder = useReluBuilder({ token, limit: 5 });

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (disabled || query.trim().length < 4) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void runForType(query);
    }, 650);

    return () => window.clearTimeout(timeoutId);
    // runForType is intentionally not a dependency; it would restart the debounce after
    // every loading/result state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, query, type]);

  const helperText = useMemo(() => {
    if (type === "summary") {
      return "Use RELU AI to draft a profile or post summary. Edit before saving.";
    }

    if (type === "geography") {
      return "Use RELU AI to suggest business-readable location labels.";
    }

    return "Use RELU AI to suggest taxonomy labels. Human review may still be required.";
  }, [type]);

  const result = builder.lastResult;
  const suggestions = result?.suggestions ?? [];

  async function runForType(input: string) {
    const trimmed = input.trim();
    if (!trimmed) {
      builder.reset();
      return;
    }

    if (type === "summary") {
      await builder.runSummary(trimmed);
    } else if (type === "taxonomy") {
      await builder.suggestTaxonomy(trimmed);
    } else if (type === "esco") {
      await builder.suggestEsco(trimmed);
    } else if (type === "nace") {
      await builder.suggestNace(trimmed);
    } else {
      await builder.suggestGeography(trimmed);
    }
  }

  return (
    <div className="rounded-xl border border-[#DBEAFE] bg-white p-4 shadow-sm shadow-blue-100/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-semibold text-[#172554]" htmlFor={`relu-${type}`}>
          {label}
        </label>
        <ReluStatusBadge status={builder.status} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          id={`relu-${type}`}
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void runForType(query);
            }
          }}
          placeholder={placeholder}
          className="min-h-11 rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#14B8A6]/25 disabled:bg-slate-100"
        />
        <button
          type="button"
          disabled={disabled || builder.loading || query.trim().length < 2}
          onClick={() => void runForType(query)}
          className="min-h-11 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {builder.loading ? "Asking..." : "Ask RELU AI"}
        </button>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">{helperText}</p>

      {builder.error ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {builder.error.message}
        </div>
      ) : null}

      {builder.success && suggestions.length === 0 ? (
        <div className="mt-3 rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] px-3 py-2 text-sm text-slate-600">
          RELU AI did not find a separate suggestion list. You can still use the summary
          result as editable guidance.
        </div>
      ) : null}

      {suggestions.length > 0 && result ? (
        <div className="mt-4" role="listbox" aria-label={`${label} RELU suggestions`}>
          <div className="mb-2 text-xs font-semibold uppercase text-[#1E3A8A]">
            RELU AI suggestion
          </div>
          <div className="grid gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.key}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => onSuggestionSelect?.(suggestion, result)}
                className="rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] px-3 py-3 text-left transition hover:border-[#2563EB] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30"
              >
                <span className="block text-sm font-semibold text-[#172554]">
                  {suggestion.label}
                </span>
                {suggestion.description ? (
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    {suggestion.description}
                  </span>
                ) : null}
                {typeof suggestion.confidence === "number" ? (
                  <span className="mt-2 block text-xs font-medium text-slate-500">
                    Confidence: {suggestion.confidence}%
                  </span>
                ) : null}
                <span className="mt-3 inline-flex rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#1D4ED8]">
                  Apply suggestion
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
