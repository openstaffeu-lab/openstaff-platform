# Transactional Email Runtime Baseline

Last updated: 2026-05-22

## Intended Runtime Contract

The production runtime is expected to mount:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `SMTP_URL` or provider API key
- `MAILGUN_DOMAIN` if Mailgun is used

## EXEC-57 Live Runtime Truth

`openstaff-api` currently mounts only:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`

It does not currently mount:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `SMTP_URL`
- `EMAIL_API_KEY`
- `MAILGUN_DOMAIN`

## Runtime Outcome

As long as this remains true:

- `/status.integrations.emailDelivery.mode` must remain `not_configured`
- forgot-password delivery cannot be proven live
- moderation/security transactional mail cannot be claimed live
