export type OpenStaffLocationSource = "google_places";

export type OpenStaffLocationSuggestion = {
  placeId: string;
  formattedAddress: string;
  locality: string;
  region: string;
  regionCode?: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  source: OpenStaffLocationSource;
  rawTypes?: string[];
  confidence?: number;
};

export type LocationAutocompleteError = {
  code:
    | "missing_api_key"
    | "loader_unavailable"
    | "places_unavailable"
    | "suggestions_failed"
    | "details_failed";
  message: string;
};
