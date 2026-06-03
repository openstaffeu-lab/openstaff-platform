import type { OpenStaffLocationSuggestion } from "./location-types";

export type OpenStaffCountryOption = {
  id: string;
  code?: string | null;
  name: string;
  currency?: string | null;
  vatRate?: number | null;
  regions: Array<{
    id: string;
    name: string;
    cities: Array<{ id: string; name: string }>;
  }>;
};

export type OpenStaffLocationMatch = {
  countryId: string;
  regionId: string;
  cityId: string;
  countryName: string;
  countryCode: string;
  regionName: string;
  cityName: string;
  currencyCode: string;
  vatRate: number | null;
  structured: boolean;
  message: string;
};

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isLooseMatch(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

export function matchOpenStaffLocation(
  location: OpenStaffLocationSuggestion,
  countries: OpenStaffCountryOption[],
): OpenStaffLocationMatch {
  const country =
    countries.find(
      (item) =>
        item.code?.toUpperCase() === location.countryCode.toUpperCase() ||
        isLooseMatch(item.name, location.country),
    ) ?? null;

  const region =
    country?.regions.find(
      (item) =>
        isLooseMatch(item.name, location.region) ||
        isLooseMatch(item.name, location.regionCode ?? ""),
    ) ?? null;

  const cityFromRegion =
    region?.cities.find((item) => isLooseMatch(item.name, location.locality)) ?? null;
  const cityMatchFromCountry =
    country?.regions
      .flatMap((item) => item.cities.map((city) => ({ city, region: item })))
      .find((item) => isLooseMatch(item.city.name, location.locality)) ??
    null;

  const inferredRegion = region ?? cityMatchFromCountry?.region ?? null;
  const city = cityFromRegion ?? cityMatchFromCountry?.city ?? null;
  const structured = Boolean(country && inferredRegion && city);

  return {
    countryId: country?.id ?? "",
    regionId: inferredRegion?.id ?? "",
    cityId: city?.id ?? "",
    countryName: country?.name ?? location.country,
    countryCode: country?.code ?? location.countryCode,
    regionName: inferredRegion?.name ?? location.region,
    cityName: city?.name ?? location.locality,
    currencyCode: country?.currency ?? "",
    vatRate: typeof country?.vatRate === "number" ? country.vatRate : null,
    structured,
    message: structured
      ? "Location selected and matched to structured country, region, and city data."
      : "Location selected, but structured region/city matching needs review.",
  };
}
