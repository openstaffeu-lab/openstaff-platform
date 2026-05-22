# EXEC-52 Proof

Last updated: 2026-05-22

## Scope

EXEC-52 is the intended provider-backed production activation and final live onboarding proof.

This execution did not proceed into provider activation because the required operator-supplied credentials and test data are still missing from production and from the current execution context.

## Required Inspection Completed

The following were re-inspected before any activation attempt:

- `STATUS.md`
- `docs/proof/exec51/README.md`
- `docs/PRODUCTION_ACTIVATION_CHECKLIST.md`
- `docs/PROVIDER_SECRET_INJECTION_PLAN.md`
- `docs/ONBOARDING_PROVIDER_TEST_DATA.md`
- GCP Secret Manager inventory
- `openstaff-api` Cloud Run secret mounts

## Current Secret Manager Truth

`gcloud secrets list --project openstaff-platform --format="value(name)"` still returns only:

- `DATABASE_URL`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`
- `JWT_REFRESH_SECRET`
- `JWT_SECRET`
- `STRIPE_WEBHOOK_SECRET`

The required onboarding-provider secrets are still absent:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `EMAIL_API_KEY` or `SMTP_URL`
- `MAILGUN_DOMAIN` if Mailgun is chosen
- `ROMANIAN_COMPANY_LOOKUP_URL`
- `ROMANIAN_COMPANY_LOOKUP_API_KEY`

## Current Cloud Run Runtime Truth

`gcloud run services describe openstaff-api --region europe-west1 --project openstaff-platform --format=json` confirms the latest ready API revision is still:

- `openstaff-api-00013-htb`

The live runtime still mounts only:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`

The live runtime still mounts none of the required provider-backed onboarding secrets.

## Blocked Activation Areas

Because the required secrets and test data are still missing, EXEC-52 cannot honestly perform:

1. provider secret injection
2. provider secret mounting
3. API redeploy for provider activation
4. `/status` transition to `emailDelivery.mode = configured`
5. real forgot-password email delivery proof
6. real reset-password proof
7. provider-backed Romanian CUI lookup proof
8. final Chrome / Edge / Mobile provider-backed browser reruns
9. final RELU/profile/public-visibility reruns on the activated revision set

## Exact Missing Inputs

Still missing:

1. `EMAIL_PROVIDER`
2. `EMAIL_FROM`
3. one of `SMTP_URL`, `RESEND_API_KEY`, `SENDGRID_API_KEY`, `POSTMARK_SERVER_TOKEN`, or `MAILGUN_API_KEY`
4. `MAILGUN_DOMAIN` if Mailgun is chosen
5. `ROMANIAN_COMPANY_LOOKUP_URL`
6. `ROMANIAN_COMPANY_LOOKUP_API_KEY`
7. one accessible password-reset inbox
8. one approved valid Romanian CUI/VAT value
9. one approved invalid Romanian CUI/VAT value
10. one company onboarding test account
11. one professional onboarding test account
12. one admin or SUPERADMIN validation path

## Honest Verdict

`EXEC-52 IN PROGRESS`

Exact blocker:

`blocked by missing operator-supplied provider credentials and test data`
