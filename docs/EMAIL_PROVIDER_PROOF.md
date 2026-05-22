# Email Provider Proof

Last updated: 2026-05-22

## Scope

This proof tracks the production truth for provider-backed transactional email delivery, with password reset as the closure-critical flow.

## Code Baseline

- `apps/admin/api/src/notifications/notification.service.ts` supports `Resend`, `SendGrid`, `Postmark`, and `Mailgun`
- `apps/admin/api/src/notifications/notification.service.ts` now also supports generic `EMAIL_PROVIDER` + `EMAIL_API_KEY` activation and real `SMTP_URL` delivery
- `apps/admin/api/src/auth/auth.service.ts` emits localized password reset subject, HTML body, and text fallback
- `apps/admin/api/src/auth/auth.controller.ts` rate limits forgot-password and reset-confirmation routes
- `apps/admin/api/src/app.service.ts` reports `/status.integrations.emailDelivery.mode = configured` only when a real provider secret is mounted

## Live Runtime Truth

On `2026-05-22`, the active production API runtime is `openstaff-api-00013-htb`.

`gcloud run services describe openstaff-api --region europe-west1 --project openstaff-platform --format=json` confirms that the live container env mounts:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`

The same live runtime does **not** mount:

- `SMTP_URL`
- `RESEND_API_KEY`
- `SENDGRID_API_KEY`
- `POSTMARK_SERVER_TOKEN`
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `EMAIL_FROM`

## Secret Manager Truth

`gcloud secrets list --project openstaff-platform` still shows no transactional email provider secret to mount into Cloud Run.

## Live Status Truth

`GET https://api.openstaff.eu/status` still reports:

- `integrations.emailDelivery.mode = not_configured`
- `integrations.emailDelivery.provider = not_configured`

## Honest Proof Outcome

Because no transactional email provider secret is mounted in production:

- forgot-password can be exercised only against the codepath that records a failed email delivery attempt
- received-email proof cannot be produced live
- reset-link click proof from a delivered message cannot be produced live
- expired-link proof from a delivered message cannot be produced live
- reused-link rejection after a delivered message cannot be produced live

## Operator Dependency

Final closure now depends on operator-supplied procurement and handoff inputs captured in:

- [PROVIDER_PROCUREMENT_CHECKLIST.md](/abs/path/C:/Users/admin/Desktop/openstaff-platform/docs/PROVIDER_PROCUREMENT_CHECKLIST.md:1)
- [EMAIL_PROVIDER_OPERATOR_HANDOFF.md](/abs/path/C:/Users/admin/Desktop/openstaff-platform/docs/EMAIL_PROVIDER_OPERATOR_HANDOFF.md:1)
- [PROVIDER_SECRET_INJECTION_PLAN.md](/abs/path/C:/Users/admin/Desktop/openstaff-platform/docs/PROVIDER_SECRET_INJECTION_PLAN.md:1)

## Remaining Closure Requirement

EXEC-52 can close this area only after production mounts a real provider credential and sender identity, followed by a fresh live password-reset run proving:

1. email delivery
2. successful reset from the delivered link
3. expired-token rejection
4. reused-token rejection
5. old-password failure
6. new-password login success

## EXEC-51 Readiness Note

The remaining gap here is no longer ambiguous implementation work. It is only:

- real provider credential procurement
- verified sender identity or domain readiness
- safe Secret Manager injection
- Cloud Run remount and smoke
- one real inbox-based reset proof sequence
