# EXEC-45 Proof

Last updated: 2026-05-21

## Verdict

`IN PROGRESS - repo-side provider wiring is already strong, company lookup audit persistence is now explicit, and the production blockers are narrowed to missing runtime credentials/configuration for transactional email and Romanian company lookup`

## What EXEC-45 Closed

- public company lookup attempts now persist first-class audit evidence through `AuditLog`
- email delivery baseline documentation now captures the real `/status` contract and current live blocker
- Romanian company lookup documentation now captures provider envs, VIES behavior, manual fallback, and persisted lookup metadata
- proof files now separate email-provider truth from Romanian-provider truth

## Live Runtime Proof

### Active API Revision

- API build `8ce0353c-5f7a-4e56-aa9c-4282b66cdcc0` promoted `openstaff-api-00012-bz7`

### Runtime Config Inspection

`gcloud run services describe openstaff-api --region europe-west1 --project openstaff-platform --format=json` confirmed the active production runtime mounts:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`

The same live runtime does **not** mount any transactional email provider secret or Romanian company provider env.

### Live Status Inspection

`GET https://api.openstaff.eu/status` still reports:

- `integrations.emailDelivery.mode = not_configured`
- `integrations.emailDelivery.provider = not_configured`

## Live Lookup Snapshot

- Romanian trusted baseline proof PASS: `PUT /onboarding/company-lookup` with `RO12345678` returned `provider = ro-baseline`, `lookupStatus = matched`, company `Nord Build Instal SRL`
- EU trusted baseline proof PASS: `PUT /onboarding/company-lookup` with `DE123456789` returned `provider = eu-baseline`, `lookupStatus = matched`, company `NordGrid Data Infrastructure GmbH`
- EU invalid VAT proof PASS: `PUT /onboarding/company-lookup` with `DE000000000` returned `provider = eu-vies`, `lookupStatus = invalid`
- Romanian invalid VAT/VIES proof PASS: `PUT /onboarding/company-lookup` with `RO99999999` returned `provider = eu-vies`, `lookupStatus = invalid`

## Why EXEC-45 Cannot Be PASS Yet

Two production blockers remain hard blockers:

1. no transactional email provider credential is mounted in production
2. no Romanian company provider URL/API key is mounted in production

Because of those blockers, the following live proofs remain unavailable:

- delivered password reset email
- successful reset from a delivered email link
- expired delivered-link rejection
- reused delivered-link rejection
- provider-backed valid Romanian CUI lookup
- provider-backed Romanian invalid-CUI behavior
- provider-backed Romanian timeout/unavailable fallback

## Repo Validation Required After EXEC-45 Patch

The following validations passed after the lookup-audit patch and doc refresh:

- `apps/admin/api -> npx.cmd prisma validate`
- `apps/admin/api -> npx.cmd prisma generate`
- `apps/admin/api -> npm.cmd run build`
- `apps/admin/web -> npm.cmd run build`
- `apps/admin -> npm.cmd run build`
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-failure-simulations.ps1`
`powershell -ExecutionPolicy Bypass -File scripts/release/exec-13-release-check.ps1` must be rerun on a clean working tree after commit.

## Honest Next Step

The next real closure step is not another code patch. It is production configuration:

1. mount a real transactional email provider credential and sender identity
2. mount a real Romanian company provider URL/API key
3. rerun the live password-reset, Romanian lookup, VIES, browser, and smoke matrix on the fresh revision
