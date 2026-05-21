# Email Delivery Baseline

Last updated: 2026-05-21

## Supported Transactional Providers

The API now supports provider-backed transactional delivery through environment-driven integrations:

- Resend via `RESEND_API_KEY`
- SendGrid via `SENDGRID_API_KEY`
- Postmark via `POSTMARK_SERVER_TOKEN`
- Mailgun via `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`

Optional sender fields:

- `EMAIL_FROM`
- `OPENSTAFF_EMAIL_FROM`
- `POSTMARK_FROM_EMAIL`

## Password Reset Delivery Contract

Password reset delivery now expects:

1. HTML body
2. text fallback
3. anti-phishing wording
4. expiry wording
5. audit trail through `NotificationEvent`, `NotificationDelivery`, and security audit logs
6. rate limiting from the auth controller

## Runtime Status Contract

`/status.integrations.emailDelivery.mode` now reports:

- `configured` when the runtime mounts any of `SMTP_URL`, `RESEND_API_KEY`, `SENDGRID_API_KEY`, `MAILGUN_API_KEY`, or `POSTMARK_SERVER_TOKEN`
- `not_configured` otherwise

On `2026-05-21`, production still reports `not_configured`.

## Secret Inventory Truth

On `2026-05-21`, `gcloud secrets list --project openstaff-platform` still exposes no transactional email provider secret at all. The production secret inventory remains limited to:

- `DATABASE_URL`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`
- `JWT_REFRESH_SECRET`
- `JWT_SECRET`
- `STRIPE_WEBHOOK_SECRET`

## Operational Truth

The integration code is ready, but the live OpenStaff production environment on `2026-05-21` still does not have any provider credential configured in Secret Manager or the active Cloud Run runtime env.

That means:

- reset delivery remains code-ready
- live provider-backed proof remains blocked
- `/status.integrations.emailDelivery.mode` will remain `not_configured` until a provider secret is mounted
