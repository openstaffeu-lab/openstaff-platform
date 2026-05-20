# Company Autofill Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-42`

## Purpose

This baseline defines how company data may be suggested from a fiscal or VAT code without turning lookup results into hidden truth.

## Current Baseline

The onboarding service now exposes:

1. `GET /onboarding/defaults`
2. `PUT /onboarding/company-lookup`

The lookup response returns:

1. raw fiscal code
2. normalized fiscal code
3. country code
4. provider name
5. lookup status
6. verification status
7. explanation
8. normalized company data payload

## Lookup Modes

### Matched

Use when the provider or known baseline mapping returns a company result that can populate:

1. company name
2. legal name
3. registration number
4. VAT id
5. country
6. city
7. address
8. VAT payer status
9. VAT mode

### Manual required

Use when:

1. the fiscal code format is plausible
2. no trusted provider result is available
3. the user should continue with manual entry

### Invalid

Use when the code format does not pass normalization or minimum validation.

### Provider unavailable

Use when the lookup layer cannot produce a result and the user must continue manually without losing progress.

## Safety Rules

1. autofill must always be editable
2. lookup status must stay visible
3. provider source must stay visible
4. failure must degrade to manual entry, not block onboarding
5. lookup may enrich profile data but may not approve a company automatically

## Current Implementation Notes

The first EXEC-42 version includes:

1. Romanian normalization support
2. EU-style normalization support
3. deterministic baseline matches for representative Romanian and EU company cases
4. an abstraction ready for live provider integration

## Remaining Work

1. connect live Romanian registry or equivalent trusted provider
2. connect live VIES verification where production access is available
3. persist first-class lookup audit fields in the domain schema instead of only deriving them from onboarding and audit events
