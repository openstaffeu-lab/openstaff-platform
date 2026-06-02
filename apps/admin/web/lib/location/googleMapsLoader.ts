import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { LocationAutocompleteError } from "./location-types";

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;
let optionsConfigured = false;

export type GoogleMapsLoaderResult =
  | { ok: true; places: google.maps.PlacesLibrary }
  | { ok: false; error: LocationAutocompleteError };

function getPublicMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

export async function loadGooglePlacesLibrary(): Promise<GoogleMapsLoaderResult> {
  const apiKey = getPublicMapsApiKey();

  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: "missing_api_key",
        message: "Location autocomplete is unavailable. Continue with manual location entry.",
      },
    };
  }

  try {
    if (!optionsConfigured) {
      setOptions({
        key: apiKey,
        v: "weekly",
        libraries: ["places"],
        authReferrerPolicy: "origin",
      });
      optionsConfigured = true;
    }

    placesLibraryPromise ??= importLibrary("places");
    const places = await placesLibraryPromise;

    return { ok: true, places };
  } catch {
    placesLibraryPromise = null;
    return {
      ok: false,
      error: {
        code: "loader_unavailable",
        message: "Location autocomplete could not load. Continue with manual location entry.",
      },
    };
  }
}
