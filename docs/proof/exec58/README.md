# EXEC-58 Proof

Last updated: 2026-05-22

## Scope

EXEC-58 focused on one question only:

Why does production password reset still not deliver email even though SMTP secrets are mounted and
`/status` reports `integrations.emailDelivery.mode = configured`?

## Live Runtime Truth

- latest ready API revision after the instrumentation deploy: `openstaff-api-00017-f67`
- `/status = 200`
- `db = healthy`
- `warnings = []`
- `errors = []`
- `integrations.emailDelivery.mode = configured`

Live mount proof on `openstaff-api` now includes:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `SMTP_URL`

## Codepath Proof

EXEC-58 verified that the forgot-password flow really reaches the email sender:

1. `POST https://api.openstaff.eu/auth/password-reset/request = 200`
2. the response stayed neutral and non-enumerating:
   - `If an account matches that email, OpenStaff will try to deliver a secure reset link shortly. Please also check Spam or Junk.`
3. `queues.notifications.failed` increased from `17` to `18`
4. fresh Cloud Run logs on `openstaff-api-00017-f67` recorded:
   - `email delivery attempt provider=smtp`
   - `email delivery failed ... code=EAUTH command=AUTH PLAIN responseCode=535 reason=Invalid login: 535 Incorrect authentication data`
   - `password reset email delivery failed ... reason=email_provider_error:Invalid login: 535 Incorrect authentication data`

## What EXEC-58 Closed

- provider-mode casing is not the blocker:
  - `EMAIL_PROVIDER=SMTP` is accepted
- `smtps://` runtime wiring is not the blocker:
  - the transport reaches the SMTP authentication step
- future API deploys will no longer silently remove the email secrets:
  - `apps/admin/api/cloudbuild.api.yaml` now includes `EMAIL_PROVIDER`, `EMAIL_FROM`, and `SMTP_URL` in `--set-secrets`
- user-facing forgot-password copy is more honest:
  - it now says OpenStaff will try to deliver the link shortly and advises Spam/Junk checks

## Exact Remaining Blocker

The mounted SMTP credentials are rejected by the SMTP server:

- `code = EAUTH`
- `command = AUTH PLAIN`
- `responseCode = 535`
- `reason = Invalid login: 535 Incorrect authentication data`

This is a live authentication blocker at the SMTP boundary, not a frontend problem and not a
missing runtime-mount problem.

## What Remains Open

Because no reset email has actually been delivered yet, EXEC-58 cannot honestly prove:

1. inbox delivery
2. reset-link usability from the delivered message
3. expired-token rejection from a delivered link
4. reused-token rejection after a successful reset
5. old-password rejection after reset
6. new-password login success after reset

## Validation

- `apps/admin/api -> npx.cmd prisma validate`
- `apps/admin/api -> npx.cmd prisma generate`
- `apps/admin/api -> npm.cmd run build`
- `apps/admin/web -> npm.cmd run build`
- `apps/admin -> npm.cmd run build`
- `scripts/release/exec-26-production-ops-check.ps1`
- `scripts/release/exec-13-release-check.ps1`

## Honest Verdict

EXEC-58 remains `IN PROGRESS`.

The exact runtime blocker is:

- SMTP authentication failure on the mounted production sender credentials
