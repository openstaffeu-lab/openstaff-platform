# Email Delivery Baseline

Last updated: 2026-05-20

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

## Operational Truth

The integration code is ready, but the live OpenStaff production environment on 2026-05-20 does not yet have any provider credential configured in Secret Manager or Cloud Run runtime env.

That means:

- reset delivery remains code-ready
- live provider-backed proof remains blocked
- `/status.integrations.emailDelivery.mode` will remain `not_configured` until a provider secret is mounted
