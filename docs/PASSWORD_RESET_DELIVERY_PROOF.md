# Password Reset Delivery Proof

Last updated: 2026-05-23

## Code Truth

- forgot-password and reset-password routes exist
- rate limits exist
- localized subject, HTML body, and text fallback exist
- token expiry and single-use invalidation exist
- audit and security logging exist in the backend flow

## Runtime Truth

Production now mounts a transactional email provider contract and `/status` reports
`integrations.emailDelivery.mode = configured`.

However, live forgot-password delivery still fails at the SMTP authentication step.

Fresh EXEC-59 runtime proof on `openstaff-api-00021-2b7`:

- `POST /auth/password-reset/request = 200` for an existing eligible account
- `POST /auth/password-reset/request = 200` for a missing account
- the public response stayed identical and neutral for both:
  - `If an account matches that email, OpenStaff will try to deliver a secure reset link shortly. Please also check Spam or Junk.`
- Cloud Run logs recorded:
  - `password reset eligibility email=m***@gmail.com status=eligible_password_reset`
  - `password reset eligibility email=e***@openstaff.eu status=not_found`
  - `smtp transport resolved host=mail.openstaff.eu port=465 secure=true authUser=present valid=true`
  - `code = EAUTH`
  - `command = AUTH PLAIN`
  - `responseCode = 535`
  - `reason = Invalid login: 535 Incorrect authentication data`

That means this execution still cannot honestly prove:

1. real delivered reset email
2. reset-link usability from the delivered message
3. expired-token rejection from a delivered message
4. reused-token rejection from a delivered message
5. old-password failure after a successful reset
6. new-password login success after a successful reset

## Remaining Requirements

- corrected SMTP credentials or SMTP-side auth acceptance for the mounted sender at `mail.openstaff.eu:465`
- one accessible reset inbox that actually receives the message
- fresh live reset run after SMTP authentication succeeds

## EXEC-59 Revalidation

EXEC-59 closed the older parsing/eligibility uncertainty:

- the mounted SMTP runtime now resolves to a real host/port/secure/auth-user contract
- the account inventory now proves which submitted email is eligible for reset and which is not
- the public forgot-password response still does not enumerate accounts

Delivery remains blocked live because the mounted SMTP credentials are still rejected with
`EAUTH` / `AUTH PLAIN` / `535 Incorrect authentication data`.
