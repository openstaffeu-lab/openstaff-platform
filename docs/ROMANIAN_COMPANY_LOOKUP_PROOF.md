# Romanian Company Lookup Proof

Last updated: 2026-05-21

## Scope

This proof tracks the production truth for Romanian company lookup, including provider success, invalid CUI handling, provider-unavailable fallback, manual override readiness, and persisted metadata.

## Code Baseline

- `apps/admin/api/src/onboarding/onboarding.service.ts` supports:
  - `ROMANIAN_COMPANY_LOOKUP_URL`
  - `ROMANIAN_COMPANY_LOOKUP_API_KEY`
  - fallback aliases for older provider names
  - 15-second provider timeout handling
  - invalid fiscal-code validation
  - VIES fallback for Romanian VAT IDs
  - manual override fallback
- public company lookup attempts now persist first-class `AuditLog` evidence with provider, status, explanation, lookup timestamp, lookup metadata, and normalized company payload

## Live Runtime Truth

On `2026-05-21`, `gcloud run services describe openstaff-api --region europe-west1 --project openstaff-platform --format=json` confirms that the active production runtime mounts no:

- `ROMANIAN_COMPANY_LOOKUP_URL`
- `ROMANIAN_COMPANY_LOOKUP_API_KEY`
- `COMPANY_LOOKUP_PROVIDER_URL`
- `COMPANY_LOOKUP_PROVIDER_API_KEY`
- `ANAF_LOOKUP_URL`
- `ANAF_LOOKUP_API_KEY`

`gcloud secrets list --project openstaff-platform` also confirms those Romanian provider secrets do not currently exist in Secret Manager.

## Live Proof That Exists Today

Production can still prove:

- invalid-format validation for malformed fiscal codes
- trusted baseline matches such as `RO12345678`
- VIES-based invalid-path handling for Romanian/EU VAT values
- manual fallback response when no trusted provider result exists

## Live Proof That Cannot Be Claimed Yet

Because the production runtime has no Romanian provider URL/API key, EXEC-45 cannot honestly claim live proof for:

1. provider-backed valid Romanian CUI returning company name, address, city, country, and VAT state
2. provider-specific invalid CUI behavior
3. provider-unavailable fallback triggered after a real configured provider timeout or provider error
4. production proof that provider-returned Romanian metadata was persisted after a real provider lookup

## Remaining Closure Requirement

EXEC-45 can close this area only after production mounts a real Romanian provider URL/API key and a fresh live run proves:

1. valid CUI success
2. invalid CUI clean failure
3. provider-unavailable fallback
4. manual override continuity
5. persisted audit metadata from the live provider-backed lookup
