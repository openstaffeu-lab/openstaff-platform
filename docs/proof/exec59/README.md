# EXEC-59 Proof

Last updated: 2026-05-23

## Scope

EXEC-59 was not a generic provider-activation pass.

It answered three narrower production questions:

1. which OpenStaff accounts are eligible for password reset
2. whether public forgot-password still stays enumeration-safe
3. whether SMTP is failing because of mount/parsing issues or because the server rejects auth

## Live Runtime Truth

Latest ready revisions during proof:

- API: `openstaff-api-00021-2b7`
- Web: `openstaff-web-00021-v9w`
- Admin: `openstaff-admin-00019-88r`

Live status remained healthy:

- `/status = 200`
- `db = healthy`
- `warnings = []`
- `errors = []`
- `integrations.emailDelivery.mode = configured`

## Account Inventory Proof

New operator-only tooling:

- `apps/admin/api/scripts/exec-59-account-inventory.js`

Production one-off job proof:

- job: `openstaff-api-exec59-account-summary`
- execution: `openstaff-api-exec59-account-summary-cx69v`
- result:
  - `totalAccounts = 86`
  - `eligibilityCounts = { eligible_password_reset = 86 }`
  - `mydarrin.hbp@gmail.com -> eligible_password_reset`
  - `exec59-missing@openstaff.eu -> not_found`

## Public Forgot-Password Proof

Fresh live requests on `2026-05-23`:

- existing eligible account: `POST /auth/password-reset/request = 200`
- missing account: `POST /auth/password-reset/request = 200`

Both returned the same neutral response:

- `If an account matches that email, OpenStaff will try to deliver a secure reset link shortly. Please also check Spam or Junk.`

That means the public contract remains enumeration-safe while operators now have internal
eligibility visibility.

## SMTP Diagnostic Proof

New operator-only tooling:

- `apps/admin/api/scripts/exec-59-smtp-check.js`

Fresh live runtime proof on `openstaff-api-00021-2b7`:

- `EMAIL_PROVIDER=SMTP` resolves correctly
- SMTP runtime resolves to:
  - `host = mail.openstaff.eu`
  - `port = 465`
  - `secure = true`
  - `authUserPresent = true`
  - `valid = true`
- Cloud Run logs now show:
  - `smtp transport resolved host=mail.openstaff.eu port=465 secure=true authUser=present valid=true`
  - `password reset eligibility email=m***@gmail.com status=eligible_password_reset`
  - `password reset eligibility email=e***@openstaff.eu status=not_found`
  - `email delivery failed provider=smtp ... code=EAUTH command=AUTH PLAIN responseCode=535 reason=Invalid login: 535 Incorrect authentication data`
  - `password reset email delivery failed ... reason=email_provider_error:Invalid login: 535 Incorrect authentication data`

## Exact Runtime Blocker

The live SMTP boundary still rejects authentication:

- `errorCode = EAUTH`
- `responseCode = 535`
- `command = AUTH PLAIN`
- `message = Invalid login: 535 Incorrect authentication data`

So the current blocker is no longer:

- provider mode casing
- missing env mounts
- missing auth user in runtime
- missing SMTP host/port parsing

It is the actual SMTP credential acceptance at the mail server.

## Browser Scope

EXEC-59 did not complete a fresh Playwright browser matrix for `/forgot-password`,
`/reset-password`, and `/login`.

The user-facing HTTP contract was still revalidated live, but scripted browser assertions were not
completed in this execution because the local shell Playwright package/runtime wiring was not
cleanly callable for the requested scripted checks.

## Validation

- `apps/admin/api -> npx.cmd prisma validate`
- `apps/admin/api -> npx.cmd prisma generate`
- `apps/admin/api -> npm.cmd run build`
- `scripts/release/exec-26-production-ops-check.ps1`
- `scripts/release/exec-13-release-check.ps1` after commit on a clean worktree

## Honest Verdict

EXEC-59 remains `IN PROGRESS`.

It closed the eligibility/debugging ambiguity, but not the final delivery proof.
