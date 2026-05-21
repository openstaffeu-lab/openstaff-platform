# EXEC-46 Proof

Last updated: 2026-05-21

## Verdict

`IN PROGRESS - production provider-backed onboarding proof is still blocked by absent provider secrets, not by missing codepaths, release health, or deploy capability`

## What Was Revalidated

- Secret Manager inventory still contains no transactional email provider secret
- Secret Manager inventory still contains no Romanian company provider secret
- active production API runtime still mounts no provider env for email or Romanian lookup
- `/status` still reports `integrations.emailDelivery.mode = not_configured`
- API remains healthy on `openstaff-api-00012-bz7`
- Romanian trusted baseline, EU trusted baseline, and VIES invalid-path checks still behave as expected

## Secret Inventory Proof

`gcloud secrets list --project openstaff-platform --format="value(name)"` returned only:

- `DATABASE_URL`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`
- `JWT_REFRESH_SECRET`
- `JWT_SECRET`
- `STRIPE_WEBHOOK_SECRET`

No transactional email provider secret and no Romanian provider secret exists to mount from this environment.

## Runtime Mount Proof

`gcloud run services describe openstaff-api --region europe-west1 --project openstaff-platform --format=json` confirms the active `openstaff-api-00012-bz7` revision still mounts only the existing production core secrets and no provider env such as:

- `SMTP_URL`
- `RESEND_API_KEY`
- `SENDGRID_API_KEY`
- `POSTMARK_SERVER_TOKEN`
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `ROMANIAN_COMPANY_LOOKUP_URL`
- `ROMANIAN_COMPANY_LOOKUP_API_KEY`

## Live API Proof

- `/health = 200`
- `/status = 200`
- `/status.integrations.emailDelivery.mode = not_configured`

Company lookup snapshots:

- `RO12345678` -> `provider = ro-baseline`, `lookupStatus = matched`
- `DE123456789` -> `provider = eu-baseline`, `lookupStatus = matched`
- `DE000000000` -> `provider = eu-vies`, `lookupStatus = invalid`
- `RO99999999` -> `provider = eu-vies`, `lookupStatus = invalid`

## Why EXEC-46 Cannot Be PASS

EXEC-46 requires real mounted production credentials. Those values are not available in this environment and are not present in the project Secret Manager inventory, so the following closure items remain impossible to prove honestly:

1. delivered password reset email
2. successful reset from delivered email link
3. expired-link rejection after delivered email
4. reused-link rejection after delivered email
5. provider-backed Romanian valid CUI response
6. provider-backed Romanian invalid-CUI response
7. provider-backed Romanian timeout/unavailable fallback

## Browser Matrix Truth

This execution did not rerun the full Chrome / Edge / mobile browser matrix because the provider-backed password-reset flow could not be exercised without real mounted provider credentials. The latest clean browser proof remains the EXEC-44 run on `2026-05-21` for:

- `openstaff-web-00013-7p6`
- `openstaff-admin-00019-88r`

## Honest Next Step

The next step is operational, not code-level:

1. create the real provider secrets in Secret Manager
2. mount them into `openstaff-api`
3. rerun password-reset live proof, Romanian provider proof, EU fallback proof, and the full browser matrix
