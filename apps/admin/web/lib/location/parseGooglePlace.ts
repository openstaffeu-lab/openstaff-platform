import type { OpenStaffLocationSuggestion } from "./location-types";

type AddressComponentLike = {
  longText?: string | null;
  shortText?: string | null;
  long_name?: string | null;
  short_name?: string | null;
  types?: string[] | null;
};

type LatLngLike = {
  lat?: number | (() => number);
  lng?: number | (() => number);
};

type GooglePlaceLike = {
  id?: string | null;
  place_id?: string | null;
  formattedAddress?: string | null;
  formatted_address?: string | null;
  addressComponents?: AddressComponentLike[] | null;
  address_components?: AddressComponentLike[] | null;
  location?: LatLngLike | null;
  geometry?: {
    location?: LatLngLike | null;
  } | null;
  types?: string[] | null;
};

function readText(component: AddressComponentLike | undefined, mode: "long" | "short") {
  if (!component) {
    return "";
  }

  return (
    (mode === "long" ? component.longText ?? component.long_name : component.shortText ?? component.short_name) ??
    component.longText ??
    component.long_name ??
    ""
  ).trim();
}

function findComponent(components: AddressComponentLike[], type: string) {
  return components.find((component) => component.types?.includes(type));
}

function readCoordinate(value: number | (() => number) | undefined) {
  return typeof value === "function" ? value() : value;
}

function sanitizeTypes(types?: string[] | null) {
  return Array.isArray(types)
    ? types.filter((type) => typeof type === "string").slice(0, 12)
    : undefined;
}

export function parseGooglePlace(place: GooglePlaceLike): OpenStaffLocationSuggestion | null {
  const components = place.addressComponents ?? place.address_components ?? [];
  const location = place.location ?? place.geometry?.location ?? null;
  const latitude = readCoordinate(location?.lat);
  const longitude = readCoordinate(location?.lng);
  const country = findComponent(components, "country");
  const region = findComponent(components, "administrative_area_level_1");
  const adminLevel2 = findComponent(components, "administrative_area_level_2");
  const locality =
    findComponent(components, "locality") ??
    findComponent(components, "postal_town") ??
    findComponent(components, "sublocality") ??
    findComponent(components, "sublocality_level_1") ??
    adminLevel2 ??
    findComponent(components, "route");
  const placeId = (place.id ?? place.place_id ?? "").trim();
  const formattedAddress = (place.formattedAddress ?? place.formatted_address ?? "").trim();
  const normalizedLocality = readText(locality, "long");
  const normalizedRegion = readText(region ?? adminLevel2, "long");
  const normalizedCountry = readText(country, "long");
  const countryCode = readText(country, "short").toUpperCase();

  if (
    !placeId ||
    !formattedAddress ||
    !normalizedCountry ||
    !countryCode ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return null;
  }

  return {
    placeId,
    formattedAddress,
    locality: normalizedLocality || formattedAddress,
    region: normalizedRegion,
    regionCode: readText(region, "short") || undefined,
    country: normalizedCountry,
    countryCode,
    latitude,
    longitude,
    source: "google_places",
    rawTypes: sanitizeTypes(place.types),
    confidence: normalizedLocality ? 0.95 : 0.75,
  };
}
