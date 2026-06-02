"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadGooglePlacesLibrary } from "@/lib/location/googleMapsLoader";
import { parseGooglePlace } from "@/lib/location/parseGooglePlace";
import type {
  LocationAutocompleteError,
  OpenStaffLocationSuggestion,
} from "@/lib/location/location-types";

const EUROPE_LOCATION_BIAS = {
  center: { lat: 50.1109, lng: 14.2604 },
  radius: 3_800_000,
} satisfies google.maps.places.LocationBias;

export type LocationPrediction = {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string;
  rawTypes?: string[];
};

type InternalPrediction = LocationPrediction & {
  prediction: google.maps.places.PlacePrediction;
};

export type UseLocationAutocompleteOptions = {
  countryBias?: string[];
  defaultCountry?: string;
  europeanFirst?: boolean;
  minLength?: number;
  disabled?: boolean;
};

function normalizeCountryCodes(values?: string[]) {
  return (values ?? [])
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^[A-Z]{2}$/.test(value))
    .slice(0, 15);
}

function toPredictionItem(prediction: google.maps.places.PlacePrediction): InternalPrediction {
  return {
    placeId: prediction.placeId,
    label: prediction.text.text,
    mainText: prediction.mainText?.text ?? prediction.text.text,
    secondaryText: prediction.secondaryText?.text ?? "",
    rawTypes: prediction.types?.slice(0, 12),
    prediction,
  };
}

export function useLocationAutocomplete(options: UseLocationAutocompleteOptions = {}) {
  const {
    countryBias,
    defaultCountry,
    europeanFirst = true,
    minLength = 2,
    disabled = false,
  } = options;
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<InternalPrediction[]>([]);
  const [selected, setSelected] = useState<OpenStaffLocationSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<LocationAutocompleteError | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestIdRef = useRef(0);
  const normalizedCountryBias = useMemo(() => normalizeCountryCodes(countryBias), [countryBias]);
  const normalizedDefaultCountry = defaultCountry?.trim().toUpperCase();

  const reset = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setSelected(null);
    setLoading(false);
    setDetailsLoading(false);
    setError(null);
    sessionTokenRef.current = null;
  }, []);

  useEffect(() => {
    if (disabled) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < minLength) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(async () => {
      const result = await loadGooglePlacesLibrary();
      if (requestIdRef.current !== requestId) {
        return;
      }

      if (!result.ok) {
        setLoading(false);
        setError(result.error);
        return;
      }

      try {
        sessionTokenRef.current ??= new result.places.AutocompleteSessionToken();

        const autocompleteRequest: google.maps.places.AutocompleteRequest = {
          input: trimmed,
          sessionToken: sessionTokenRef.current,
          includedPrimaryTypes: [
            "locality",
            "sublocality",
            "administrative_area_level_2",
            "administrative_area_level_3",
          ],
          ...(normalizedDefaultCountry ? { region: normalizedDefaultCountry } : {}),
          ...(europeanFirst ? { locationBias: EUROPE_LOCATION_BIAS } : {}),
          ...(normalizedCountryBias.length > 0
            ? { includedRegionCodes: normalizedCountryBias }
            : {}),
        };

        const response =
          await result.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            autocompleteRequest,
          );

        if (requestIdRef.current !== requestId) {
          return;
        }

        setSuggestions(
          response.suggestions
            .map((suggestion) => suggestion.placePrediction)
            .filter((prediction): prediction is google.maps.places.PlacePrediction =>
              Boolean(prediction?.placeId),
            )
            .map(toPredictionItem),
        );
      } catch {
        if (requestIdRef.current === requestId) {
          setError({
            code: "suggestions_failed",
            message: "Location suggestions are unavailable. Continue manually.",
          });
          setSuggestions([]);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [
    disabled,
    europeanFirst,
    minLength,
    normalizedCountryBias,
    normalizedDefaultCountry,
    query,
  ]);

  const selectSuggestion = useCallback(async (prediction: LocationPrediction) => {
    const internalPrediction = suggestions.find((item) => item.placeId === prediction.placeId);
    if (!internalPrediction) {
      return null;
    }

    setDetailsLoading(true);
    setError(null);

    try {
      const place = internalPrediction.prediction.toPlace();
      await place.fetchFields({
        fields: ["id", "formattedAddress", "addressComponents", "location", "types"],
      });
      const parsed = parseGooglePlace(place);

      if (!parsed) {
        throw new Error("unparseable_place");
      }

      setSelected(parsed);
      setQuery(parsed.formattedAddress);
      setSuggestions([]);
      sessionTokenRef.current = null;
      return parsed;
    } catch {
      setError({
        code: "details_failed",
        message: "Location details could not be loaded. Continue manually.",
      });
      return null;
    } finally {
      setDetailsLoading(false);
    }
  }, [suggestions]);

  return {
    query,
    setQuery,
    loading,
    detailsLoading,
    error,
    suggestions: suggestions.map((item) => ({
      placeId: item.placeId,
      label: item.label,
      mainText: item.mainText,
      secondaryText: item.secondaryText,
      rawTypes: item.rawTypes,
    })),
    selected,
    reset,
    selectSuggestion,
  };
}
