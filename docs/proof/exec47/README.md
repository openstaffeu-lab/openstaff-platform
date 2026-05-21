# EXEC-47 Proof

Last updated: 2026-05-21

## Verdict

`IN PROGRESS - the codebase is now closer to immediate provider activation because generic email-provider env support, real SMTP delivery, and localization phone-prefix defaults are implemented and the API is freshly promoted, but production still has no real provider secrets, so live provider-backed onboarding proof remains blocked`

## What EXEC-47 Improved

- generic `EMAIL_PROVIDER` + `EMAIL_API_KEY` activation support
- real `SMTP_URL` delivery support
- `/status` email-delivery readiness support for generic provider activation
- onboarding defaults now include `phonePrefix`
- register UX now starts with a more realistic localized phone baseline and cleaner Romanian copy

## Fresh Promotion Proof

- API build `c5ece80a-a494-4a3c-ab0c-b1d7191c16a8` promoted `openstaff-api-00013-htb`
- web build `6f5b16a0-4d7f-4d2f-9a70-2a59ebeff8e1` was created successfully, and `openstaff-web` already reports latest ready revision `openstaff-web-00014-hz9`; the last direct build-status poll still showed `WORKING` after a Cloud Build get-quota polling hit
- admin stayed on `openstaff-admin-00019-88r`

## Live Runtime Truth

`gcloud secrets list --project openstaff-platform` still exposes no:

- transactional email provider secret
- Romanian company provider URL secret
- Romanian company provider API key secret

`GET https://api.openstaff.eu/status` therefore still reports:

- `integrations.emailDelivery.mode = not_configured`

## Validation Snapshot

- `apps/admin/api -> npx.cmd prisma validate` PASS
- `apps/admin/api -> npx.cmd prisma generate` PASS
- `apps/admin/api -> npm.cmd run build` PASS
- `apps/admin/web -> npm.cmd run build` PASS
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1` PASS
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-failure-simulations.ps1` PASS

## Why EXEC-47 Cannot Be PASS

The remaining blockers are operational, not implementation blockers:

1. no real email provider secret exists to mount
2. no real Romanian provider secret exists to mount
3. provider-backed forgot-password proof cannot run live
4. provider-backed Romanian lookup proof cannot run live
5. the final browser matrix was not rerun without the live reset-password flow
