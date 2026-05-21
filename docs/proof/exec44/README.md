# EXEC-44 Proof

Last updated: 2026-05-21

## Scope

EXEC-44 closes the remaining live browser-stability and public-visibility gaps that stayed open after EXEC-43, while preserving an honest verdict about the provider-backed blockers that still cannot be proven in production.

## Repo Changes Closed

- refresh-token bootstrap recovery on first authenticated page load for both public web and admin
- reduced public Next prefetch noise on marketplace proof surfaces
- fixed the public `/profiles/[slug]` route for Next 16 async params

## Local Validation

- `apps/admin/web -> npm.cmd run build` PASS
- `apps/admin -> npm.cmd run build` PASS

## Production Promotion

- web deploy PASS: Cloud Build `cc41fca7-399a-4063-a5f2-2024c0354f1b` promoted `openstaff-web-00013-7p6`
- admin deploy PASS: Cloud Build `c5ad3ccc-c30b-45e5-a321-232d84c15dc7` promoted `openstaff-admin-00019-88r`
- API revision remained `openstaff-api-00011-ggv` because EXEC-44 only changed web/admin behavior

## Runtime Proof

- `GET https://api.openstaff.eu/health` PASS returned `status = ok`
- `GET https://api.openstaff.eu/status` PASS returned `status = ok`, `db = healthy`
- password reset request proof PASS returned a generic success response with `expiresInMinutes = 30`
- Romanian VAT invalid-path proof PASS returned `provider = eu-vies`, `providerLabel = European Commission VIES`, `verifiedSource = true`, `lookupStatus = invalid`
- trusted EU baseline proof PASS returned `provider = eu-baseline`, `providerLabel = Trusted EU baseline`, `verifiedSource = true`, `lookupStatus = matched`
- approved visibility proof PASS confirmed pending hidden, approved visible, rejected hidden, homepage/jobs visibility, professionals visibility, and live public profile reachability through the API-side proof cohort
- production ops-check PASS `scripts/release/exec-26-production-ops-check.ps1` returned `verdict = PASS`, `healthStatus = ok`, `readinessStatus = ok`, `databaseStatus = healthy`, `monitoringPolicies = 10`, `dashboards = 2`, `uptimeChecks = 7`, `recentBackups = 5`
- production failure simulations PASS `scripts/release/exec-26-failure-simulations.ps1` returned the expected `429/400/429/401/404` guard-rail responses

## Browser Proof

Fresh browser proof was rerun on `2026-05-21` after promoting `openstaff-web-00013-7p6` and `openstaff-admin-00019-88r`.

### Chrome desktop: COMPANY onboarding company step

- `httpStatus = 200`
- `failedRequests = []`
- `badResponses = []`
- `consoleErrors = []`
- `pageErrors = []`
- `Lookup status: invalid` rendered cleanly for the VIES invalid-path proof

### Edge desktop: PROFESSIONAL onboarding completion + RELU AI

- `httpStatus = 200`
- `failedRequests = []`
- `badResponses = []`
- `consoleErrors = []`
- `pageErrors = []`
- `Suggested by RELU AI` rendered cleanly after live analysis

### Mobile Chrome: company lookup

- `httpStatus = 200`
- `failedRequests = []`
- `badResponses = []`
- `consoleErrors = []`
- `pageErrors = []`
- `Lookup status: matched` plus `Provider label: Trusted EU baseline` rendered cleanly
- mobile viewport remained clean with no horizontal overflow

### Chrome desktop: admin onboarding RELU visibility

- `httpStatus = 200`
- `failedRequests = []`
- `badResponses = []`
- `consoleErrors = []`
- `pageErrors = []`
- proof row rendered `Refresh RELU`, `Confidence`, missing-information hints, and user-selection comparison cleanly

### Chrome desktop: public visibility surfaces

All public proof routes returned clean browser health:

1. homepage `https://openstaff.eu`
2. jobs listing `https://openstaff.eu/jobs`
3. professionals listing `https://openstaff.eu/professionals`
4. approved public profile `https://openstaff.eu/profiles/exec44-1779353515775-pro-profile`

For all four routes:

- `httpStatus = 200`
- `failedRequests = []`
- `badResponses = []`
- `consoleErrors = []`
- `pageErrors = []`

The approved EXEC-44 project and professional listing were visible live on the expected public surfaces, and the public-profile `500` discovered during the first rerun was closed by fixing the Next 16 `params` handling on `/profiles/[slug]`.

## Live Operator Proof Cleanup

- the temporary EXEC-44 proof operator was promoted to `SUPERADMIN` through a one-off Cloud Run job using the live API image and live production database source of truth
- authenticated admin proof was completed successfully
- the same one-off job was updated to demote the proof operator back to `PROFESSIONAL`
- the one-off Cloud Run job was deleted after cleanup
- direct live login proof after cleanup returned `role = PROFESSIONAL`

## Honest Remaining Blockers

1. production still has no mounted transactional email provider secret, so `/status` still reports `emailDelivery = not_configured`
2. no Romanian company provider URL/API key is configured in production, so the Romanian lookup path is still code-ready but not provider-proven live
3. full live forgot-password closure is still blocked because no provider-backed reset email was received, clicked, expired, and rejected after reuse

## Verdict Rule

`EXEC-44 PASS` still requires all of the following:

1. provider-backed password reset email delivered and completed live
2. Romanian company lookup proven live with real provider data

Until then, EXEC-44 remains `IN PROGRESS` with the blockers listed above.
