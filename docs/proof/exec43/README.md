# EXEC-43 Proof

Last updated: 2026-05-20

## Scope

EXEC-43 targets live onboarding production closure after the partial closure achieved in EXEC-42.

## Repo Changes Closed

- provider-capable password reset delivery wiring
- localized password reset email templates with anti-phishing wording
- VIES-backed company lookup plus configurable Romanian provider support
- richer onboarding company-lookup UX with provider label, trusted-source state, timestamp, and legal status
- first-class admin RELU AI onboarding visibility with confidence, taxonomy comparison, and missing-information hints
- API CORS fix for `X-Timezone` and `X-Country-Code` discovered during live browser proof

## Local Validation

- `apps/admin/api -> npx.cmd prisma validate` PASS
- `apps/admin/api -> npx.cmd prisma generate` PASS
- `apps/admin/api -> npm.cmd run build` PASS
- `apps/admin/web -> npm.cmd run build` PASS
- `apps/admin -> npm.cmd run build` PASS

## Production Promotion

- API deploy PASS: Cloud Build `9b4eeecf-085c-4ac5-aa03-e9e5218cdc0a` succeeded for the initial EXEC-43 promotion
- API CORS-fix redeploy PASS: Cloud Build `4a8de26f-8978-4e22-b9a2-0693826de305` promoted `openstaff-api-00011-ggv`
- Web deploy PASS: Cloud Build `c743e5d7-55ef-4044-81e9-eb433418e0cd` promoted `openstaff-web-00011-ngt`
- Admin deploy PASS: Cloud Build `cab6f8ff-3776-4504-b73c-6bd9b2fadffd` promoted `openstaff-admin-00017-cc4`

## Runtime Proof

- `GET https://api.openstaff.eu/health` PASS returned `status = ok`
- `GET https://api.openstaff.eu/status` PASS returned `status = ok`, `db = healthy`
- password reset request endpoint PASS returned a generic success response with `expiresInMinutes = 30`
- live VIES invalid-path proof PASS `PUT /onboarding/company-lookup` returned `provider = eu-vies`, `providerLabel = European Commission VIES`, `verifiedSource = true`, `lookupStatus = invalid`
- production ops-check PASS `scripts/release/exec-26-production-ops-check.ps1` returned `verdict = PASS`, `healthStatus = ok`, `readinessStatus = ok`, `databaseStatus = healthy`, `monitoringPolicies = 10`, `dashboards = 2`, `uptimeChecks = 7`, `recentBackups = 5`
- production failure simulations PASS `scripts/release/exec-26-failure-simulations.ps1` returned the expected `429/400/429/401/404` guard-rail responses

## Browser Proof

### Chrome desktop: COMPANY registration

- result PASS clean after the CORS fix on `openstaff-api-00011-ggv`
- `domContentLoadedMs = 242`
- `loadEventMs = 349`
- `failedRequests = []`
- `consoleErrors = []`
- `pageErrors = []`
- `scrollWidth = viewportWidth = 1280`

### Edge desktop: PROFESSIONAL registration and RELU generation

- result PASS partial functional proof
- RELU generation UI rendered and `Analyzeaza cu RELU AI` completed
- `domContentLoadedMs = 286`
- `loadEventMs = 361`
- `consoleErrors = []`
- `pageErrors = []`
- residual failed request: `GET https://api.openstaff.eu/onboarding/me`

### Mobile Chrome: company lookup

- result PASS partial functional proof
- page showed `Lookup status: matched` plus provider/trusted-source metadata
- `domContentLoadedMs = 3000`
- `loadEventMs = 3108`
- `scrollWidth = 393`
- `viewportWidth = 393`
- `consoleErrors = []`
- `pageErrors = []`
- no horizontal overflow
- residual failed requests:
  - `GET https://api.openstaff.eu/uniclass`
  - `GET https://openstaff.eu/pricing?_rsc=...`
  - `GET https://api.openstaff.eu/countries`
  - `GET https://api.openstaff.eu/esco`
  - `GET https://api.openstaff.eu/profile`
  - `GET https://api.openstaff.eu/nace`

### Chrome desktop: admin RELU onboarding visibility

- result PASS partial functional proof
- `/admin/onboarding` rendered the proof row, `Refresh RELU`, confidence, AI NACE suggestion, user-selection comparison, and missing-information hints
- `domContentLoadedMs = 244`
- `loadEventMs = 344`
- `consoleErrors = []`
- `pageErrors = []`
- `scrollWidth = viewportWidth = 1280`
- residual failed requests:
  - `GET https://backoffice.openstaff.eu/ai-config?_rsc=...`
  - `GET https://backoffice.openstaff.eu/ai-queue?_rsc=...`
  - `GET https://api.openstaff.eu/actors/stats`
  - `GET https://backoffice.openstaff.eu/favicon.ico?...`
  - `GET https://api.openstaff.eu/relu/queue`
  - `GET https://backoffice.openstaff.eu/admin/users?_rsc=...`
  - `GET https://api.openstaff.eu/jobs/stats`
  - `GET https://backoffice.openstaff.eu/ai-control?_rsc=...`

## Live Operator Proof Cleanup

- temporary proof operator was promoted to `SUPERADMIN` through one-off Cloud Run jobs captured in `docs/proof/exec43/runtime/`
- authenticated admin proof was completed
- the proof operator was demoted back to `PROFESSIONAL`
- the one-off jobs were deleted after proof

## Honest Remaining Blockers

1. production still has no mounted transactional email provider secret, so `/status` still reports `emailDelivery = not_configured`
2. no Romanian company provider URL/API key is configured in production, so the Romanian lookup path is code-ready but not provider-proven live
3. browser proof is only partially clean because Edge, mobile, and admin sessions still showed residual failed requests
4. this execution did not complete a fresh approval cycle proving pending hidden, approved public visibility, rejected hidden, and homepage/search/public-profile visibility on the promoted EXEC-43 revisions
5. full live forgot-password closure is still blocked because no provider-backed reset email was received, clicked, expired, and rejected after reuse

## Verdict Rule

`EXEC-43 PASS` still requires all of the following:

1. provider-backed password reset email delivered and completed live
2. Romanian company lookup proven live with real provider data
3. browser validation rerun without residual critical request failures
4. moderation plus homepage/public visibility proven after approval on the promoted revisions

Until then, EXEC-43 remains `IN PROGRESS` with the blockers listed above.
