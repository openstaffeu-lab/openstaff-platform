# Production Activation Checklist

Last updated: 2026-05-22

## Purpose

This is the single operator-safe sequence for activating the missing onboarding providers in production.

## Exact Missing Secret Matrix

Email provider:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- one of:
  - `EMAIL_API_KEY`
  - `SMTP_URL`
- `MAILGUN_DOMAIN` if Mailgun is selected

Romanian provider:

- `ROMANIAN_COMPANY_LOOKUP_URL`
- `ROMANIAN_COMPANY_LOOKUP_API_KEY`

## Runtime Dependency Map

Password recovery depends on:

- mounted email provider secret
- mounted sender identity
- `openstaff-api` redeploy
- accessible reset inbox

Romanian autofill depends on:

- mounted Romanian provider URL/API key
- approved valid and invalid test values
- `openstaff-api` redeploy

Final browser/product proof depends on:

- password recovery working live
- provider-backed autofill working live
- company and professional test accounts
- admin validation path

## Deploy Impact Map

Only `openstaff-api` requires a provider-activation redeploy unless new UI changes are made later.

Expected non-impacted areas:

- existing Cloud SQL configuration
- existing storage configuration
- billing webhook behavior
- moderation auth protections
- public web and admin deployments, unless new code changes are introduced

## Activation Sequence

1. confirm the chosen email provider, verified sender, and DNS readiness
2. confirm the chosen Romanian provider, approved fields, and approved test values
3. create or update the required Secret Manager secrets
4. verify latest secret versions are enabled
5. update `openstaff-api` to mount the chosen secrets
6. wait for the new ready API revision
7. verify `/health` and `/status`
8. verify `/status.integrations.emailDelivery.mode = configured`
9. verify no unexpected readiness warnings or errors
10. run password-reset proof
11. run Romanian provider-backed lookup proof
12. rerun RELU/profile/browser/public-visibility proof on the same revision set
13. run ops-check, failure simulations, and release check

## Browser Verification Order

1. Chrome desktop
2. Edge desktop
3. Mobile Chrome

## Rollback Order

1. stop using the new provider-backed path if health or readiness regresses
2. return `openstaff-api` traffic to the previous ready revision or remove the new secret mounts
3. recheck `/health` and `/status`
4. leave secrets in Secret Manager for later investigation, but do not keep the broken mount active
5. document the failure mode before another activation attempt

## EXEC-52 Entry Rule

EXEC-52 should start only when all required secrets and test data are available.
