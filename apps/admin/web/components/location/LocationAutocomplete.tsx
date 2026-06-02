"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useLocationAutocomplete } from "@/hooks/useLocationAutocomplete";
import type { OpenStaffLocationSuggestion } from "@/lib/location/location-types";

type LocationAutocompleteProps = {
  label: string;
  placeholder?: string;
  value?: OpenStaffLocationSuggestion | null;
  onChange: (location: OpenStaffLocationSuggestion | null) => void;
  disabled?: boolean;
  countryBias?: string[];
  defaultCountry?: string;
  helperText?: string;
  required?: boolean;
  tone?: "light" | "dark";
};

export function LocationAutocomplete({
  label,
  placeholder = "Search city or locality",
  value,
  onChange,
  disabled = false,
  countryBias,
  defaultCountry,
  helperText,
  required = false,
  tone = "light",
}: LocationAutocompleteProps) {
  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const [activeIndex, setActiveIndex] = useState(-1);
  const {
    query,
    setQuery,
    loading,
    detailsLoading,
    error,
    suggestions,
    selectSuggestion,
    reset,
  } = useLocationAutocomplete({
    countryBias,
    defaultCountry,
    europeanFirst: true,
    disabled,
  });

  const activeSuggestion = useMemo(
    () => (activeIndex >= 0 ? suggestions[activeIndex] : null),
    [activeIndex, suggestions],
  );

  useEffect(() => {
    if (value?.formattedAddress && value.formattedAddress !== query) {
      setQuery(value.formattedAddress);
    }
  }, [query, setQuery, value?.formattedAddress]);

  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  async function handleSelect(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) {
      return;
    }

    const location = await selectSuggestion(suggestion);
    if (location) {
      onChange(location);
    }
  }

  function handleClear() {
    reset();
    onChange(null);
  }

  const labelClassName =
    tone === "dark" ? "text-sm font-semibold text-slate-200" : "text-sm font-semibold text-slate-700";
  const helperClassName =
    tone === "dark" ? "text-xs leading-5 text-slate-300" : "text-xs leading-5 text-slate-500";

  return (
    <div className="relative grid gap-2">
      <label htmlFor={inputId} className={labelClassName}>
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      <div className="relative">
        <input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value) {
              onChange(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) =>
                suggestions.length === 0 ? -1 : Math.min(current + 1, suggestions.length - 1),
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => (suggestions.length === 0 ? -1 : Math.max(current - 1, 0)));
            }

            if (event.key === "Enter" && activeSuggestion) {
              event.preventDefault();
              void handleSelect(activeIndex);
            }

            if (event.key === "Escape") {
              setActiveIndex(-1);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeSuggestion ? `${listboxId}-${activeIndex}` : undefined}
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-24 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {loading || detailsLoading ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
              Loading
            </span>
          ) : null}
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {helperText ? <p className={helperClassName}>{helperText}</p> : null}

      {value ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="font-semibold">{value.locality || value.formattedAddress}</div>
          <div className="mt-1 text-xs leading-5 text-emerald-800">
            {[value.region, value.country].filter(Boolean).join(", ")} · {value.latitude.toFixed(5)},{" "}
            {value.longitude.toFixed(5)}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          {error.message}
        </div>
      ) : null}

      {!error && query.trim().length >= 2 && !loading && suggestions.length === 0 && !value ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
          No autocomplete match yet. You can continue with the manual country, region, city, or location fields.
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              id={`${listboxId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void handleSelect(index)}
              className={`grid w-full gap-1 rounded-xl px-3 py-3 text-left text-sm transition ${
                index === activeIndex ? "bg-blue-50 text-blue-950" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="font-semibold">{suggestion.mainText}</span>
              {suggestion.secondaryText ? (
                <span className="text-xs leading-5 text-slate-500">{suggestion.secondaryText}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
