# Transactional Email Runtime Baseline

Last updated: 2026-05-23

## Intended Runtime Contract

The production runtime is expected to mount:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `SMTP_URL` or provider API key
- `MAILGUN_DOMAIN` if Mailgun is used

## EXEC-59 Live Runtime Truth

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

The future deploy path now preserves these secrets as well, and the runtime now exposes safe
operator diagnostics through:

- `apps/admin/api/scripts/exec-59-smtp-check.js`
- `apps/admin/api/scripts/exec-59-account-inventory.js`

## Runtime Outcome

The mount contract is no longer the blocking layer.

Fresh EXEC-59 live proof shows:

- `EMAIL_PROVIDER=SMTP` resolves correctly to provider mode `smtp`
- the runtime now parses `SMTP_URL` to:
  - `host = mail.openstaff.eu`
  - `port = 465`
  - `secure = true`
  - `authUserPresent = true`
  - `valid = true`
- `nodemailer.verify()` fails with:
  - `errorCode = EAUTH`
  - `responseCode = 535`
  - `command = AUTH PLAIN`
  - `message = Invalid login: 535 Incorrect authentication data`

So the current blocker is SMTP authentication acceptance by the server, not missing env mounts,
provider-mode casing, or SMTP URL parsing.
