# EXEC-78C.1B Location Autocomplete Proof

Date: 2026-06-02

Verdict: `PASS`

## Scope

EXEC-78C.1B adds a reusable Google Places-based location autocomplete foundation for OpenStaff public web workflows. The implementation prepares normalized city/locality data for future feed relevance, regional matching, country-specific compliance, currency defaults, VAT behavior, workforce eligibility, project discovery, and RELU AI recommendations.

Integration into existing flows is intentionally incremental and only applied where the current form structure allows it safely without introducing risk. Existing manual fields and country/region/city fallback selectors remain available.

## Google Cloud APIs Required

Enable these APIs in the Google Cloud project that owns the browser key:

- Maps JavaScript API
- Places API New

Geocoding API is not required by this implementation. It should be enabled only if a future server-side or browser-side flow explicitly needs geocode/reverse-geocode behavior outside Places details.

## Environment Variable

Browser autocomplete uses:

```text
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

This is only for the approved public Maps browser key. No key value is documented or committed. `apps/admin/web/.env.example` was updated with the empty variable name only.

## Key Restrictions

The public browser key must be restricted in Google Cloud.

HTTP referrer restrictions:

- `https://openstaff.eu/*`
- `https://www.openstaff.eu/*`
- localhost development origins only when needed for local validation, such as `http://localhost:3000/*` and `http://127.0.0.1:3000/*`

API restrictions:

- Maps JavaScript API
- Places API

Do not use this browser key for backend services, Cloud Run secrets, RELU Builder, payments, or server-side Google API calls.

## Billing And Cost Controls

Implemented controls:

- Autocomplete calls are debounced by 300 ms.
- Calls are not made on render; they start only after user input reaches the minimum length.
- A fresh `AutocompleteSessionToken` is created per user search session.
- Place details are requested only after a user selects a suggestion.
- Place details request only: `id`, `formattedAddress`, `addressComponents`, `location`, and `types`.
- Missing or failed Google loading degrades to manual entry.

Operational controls:

- Monitor Places Autocomplete and Place Details usage in Google Cloud billing.
- Keep API restrictions narrow.
- Keep referrer restrictions current for production and approved dev origins.

## Files Created

- `apps/admin/web/lib/location/location-types.ts`
- `apps/admin/web/lib/location/parseGooglePlace.ts`
- `apps/admin/web/lib/location/googleMapsLoader.ts`
- `apps/admin/web/hooks/useLocationAutocomplete.ts`
- `apps/admin/web/components/location/LocationAutocomplete.tsx`
- `docs/proof/exec78/EXEC78C1B_LOCATION_AUTOCOMPLETE.md`

## Files Modified

- `apps/admin/web/package.json`
- `apps/admin/web/package-lock.json`
- `apps/admin/web/.env.example`
- `apps/admin/web/app/register/page.tsx`
- `apps/admin/web/app/onboarding/company/page.tsx`
- `apps/admin/web/app/profile/page.tsx`
- `apps/admin/web/app/publish/page.tsx`
- `apps/admin/web/components/projects/ProjectWorkspaceForm.tsx`
- `docs/proof/exec78/README.md`
- `STATUS.md`

The working tree also contained uncommitted EXEC-78C.1 remediation files from the previous pass; they remain part of the local change set and were not reverted.

## Parsing Behavior

`parseGooglePlace` normalizes Google Places data into `OpenStaffLocationSuggestion` only. Raw Google response objects are not exposed to UI state.

Extracted fields:

- place ID
- formatted address
- locality/city
- region
- optional region code
- country
- country code
- latitude
- longitude
- sanitized raw type strings
- optional confidence

Locality fallback order:

1. `locality`
2. `postal_town`
3. `sublocality`
4. `sublocality_level_1`
5. `administrative_area_level_2`
6. `route` only if no locality-like component exists

If required fields such as place ID, formatted address, country code, or coordinates are missing, parsing returns `null`.

## Hook And Component Behavior

`useLocationAutocomplete`:

- manages query, loading, details loading, error, suggestions, selected location, and reset state
- debounces input
- creates and clears session tokens per user search session
- supports `countryBias`, `defaultCountry`, `europeanFirst`, `minLength`, and disabled state
- uses global search by default with European-first location bias
- does not hardcode Romania except where existing form defaults already do
- fetches place details only on selected suggestion

`LocationAutocomplete`:

- provides accessible label and combobox/listbox semantics
- supports keyboard up/down/enter/escape interaction
- displays loading, empty, error, and selected states
- renders only sanitized suggestion text
- supports light and dark host surfaces
- includes manual fallback guidance

## Integration Points

Implemented low-risk integrations:

- Register page: optional city/locality lookup updates country context and onboarding local state while preserving the manual country selector.
- Company onboarding: optional company locality/address lookup fills country, city, and address line 1 while preserving manual fields and VAT lookup/manual override.
- Profile workspace: optional service locality lookup fills contractor service area while preserving structured country/region/city selectors.
- Publish opportunity: optional lookup fills the existing location label while preserving manual location and structured selectors.
- Project create/edit: optional lookup fills the existing project location string while preserving manual location text.

Integration into additional flows should remain incremental and only happen where the existing form structure can safely absorb normalized location data without changing save semantics.

## Fallback Behavior

Manual entry remains available when:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is missing
- Maps JavaScript API fails to load
- Places API returns no suggestions
- place details cannot be fetched
- a user prefers country/region/city selectors or manual text

Google Places enhances localization but does not replace the existing OpenStaff country, region, city, locality, VAT, or currency fallback model.

## Validation

From `apps/admin/web`:

- `npm.cmd run build`: PASS
- `npm.cmd run lint`: PASS, 0 errors, existing warnings only

## Remaining Risks

- Production autocomplete requires a correctly restricted public Google Maps browser key.
- Browser runtime with a real key was not exercised in this task.
- Autocomplete-selected latitude/longitude is normalized client-side but not yet persisted as first-class structured data in all flows.
- Country/region/city selector matching from selected Google country/city to internal IDs remains a future incremental integration.
- Usage and billing should be monitored after enabling the key in production.
