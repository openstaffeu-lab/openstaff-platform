# Localization Autofill Baseline

Last updated: 2026-05-21

## Scope

This baseline captures the production-ready onboarding defaults that can be inferred safely before the user starts editing profile and company details.

## Current Defaults Contract

`GET /onboarding/defaults` now returns:

- `country`
- `countryCode`
- `language`
- `currency`
- `vatMode`
- `timezone`
- `city`
- `phonePrefix`
- `inferredFrom`
- `explanation`

## Current Inference Sources

The current production-ready code infers defaults from:

- browser language
- browser timezone
- request country header when present
- request city header when present

## UX Behavior

The register page now uses these defaults to:

- prefill country
- prefill language
- prefill timezone
- prefill phone with the inferred international prefix when the field is still empty

## Current Limitation

This baseline improves real-user onboarding, but it is still not a full geolocation product:

- there is no guaranteed live IP geolocation provider mounted for onboarding defaults
- city inference depends on available request headers
- users can always override every inferred value manually
