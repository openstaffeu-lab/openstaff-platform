# Transactional Email Runtime Baseline

Last updated: 2026-05-22

## Intended Runtime Contract

The production runtime is expected to mount:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `SMTP_URL` or provider API key
- `MAILGUN_DOMAIN` if Mailgun is used

## EXEC-58 Live Runtime Truth

`openstaff-api` now mounts:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`
- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `SMTP_URL`

The live API status contract now reports:

- `/status.integrations.emailDelivery.mode = configured`
- `/status.readiness.warnings = []`
- `/status.readiness.errors = []`

The future deploy path now preserves these secrets as well, because
`apps/admin/api/cloudbuild.api.yaml` has been updated to pass `EMAIL_PROVIDER`,
`EMAIL_FROM`, and `SMTP_URL` through `--set-secrets`.

## Runtime Outcome

The runtime contract is no longer the blocking layer.

Fresh EXEC-58 live proof shows:

- the password-reset request reaches the email delivery path
- the failed notification count increases when the request runs
- Cloud Run logs capture `EAUTH` / `535 Incorrect authentication data` at `AUTH PLAIN`

So the current blocker is SMTP authentication, not missing env mounts or provider-mode parsing.
