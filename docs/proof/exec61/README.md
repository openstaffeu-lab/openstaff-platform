# EXEC-61 Proof

Date: 2026-05-23

## Scope

EXEC-61 closes the remaining EXEC-60 blockers:

1. RELU onboarding-assistant continuity
2. taxonomy and geography persistence
3. durable GCS-backed profile media persistence
4. subcontractor public-feed visibility
5. branch/push recovery confirmation

## Deploy Proof

- API build: `ef3bee3b-fe55-42be-b955-aa82d259d5d1`
- latest ready API revision: `openstaff-api-00028-4bk`
- Web build: `a2dde3f2-05a4-4d70-8709-0755ccd41973`
- latest ready web revision: `openstaff-web-00023-6b6`
- latest ready admin revision: `openstaff-admin-00019-88r`

## Runtime Proof

- proof run id: `exec60-1779554181293`
- runtime script: `apps/admin/api/scripts/exec-60-runtime-check.js`
- live status during proof:
  - `emailDelivery.mode = configured`
  - `warnings = []`
  - `errors = []`

## Proven Live

- `POST /relu/onboarding-assistant` no longer returned `INTERNAL_ERROR`
- three real account shapes still registered, logged in, onboarded, uploaded, relogged, and reached moderated public visibility before cleanup
- geography and taxonomy selections persisted through `/profile` and survived relogin
- `/countries` returned `count = 1`
- legacy `/esco` returned `count = 20`
- profile proof assets persisted as `storage.provider = gcs`, `storage.bucket = openstaff-platform-production`
- the approved subcontractor/company-looking-for-projects item appeared in the public feed summary

## RELU Runtime Note

The onboarding-assistant path is now continuity-safe, but upstream Gemini quota is depleted. The assistant therefore returns advisory fallback guidance instead of surfacing a product-breaking internal error.

## Browser Proof

Fallback Playwright shell proof on `openstaff-web-00023-6b6` covered Chrome desktop, Edge desktop, and mobile Chrome.

Results:

- `consoleErrors = []`
- `pageErrors = []`
- `badResponses = []`
- no mobile horizontal overflow

The only remaining request failures were navigation-aborted background requests while the scripted proof moved to the next page.

## Cleanup

The temporary proof posts were deleted and the temporary proof profiles were returned to `OFFLINE` after validation. Fresh checks now return `403` for the temporary proof profile slugs, so no internal EXEC/test labels remain public.
