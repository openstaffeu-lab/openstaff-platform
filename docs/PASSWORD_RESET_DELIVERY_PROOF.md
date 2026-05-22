# Password Reset Delivery Proof

Last updated: 2026-05-22

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

Fresh EXEC-58 runtime proof on `openstaff-api-00017-f67`:

- `POST /auth/password-reset/request = 200`
- neutral user response remained intact
- `queues.notifications.failed` increased from `17` to `18`
- Cloud Run logs recorded:
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

- corrected SMTP credentials or SMTP-side auth acceptance for the mounted sender
- one accessible reset inbox that actually receives the message
- fresh live reset run after SMTP authentication succeeds

## EXEC-57 Revalidation

EXEC-58 closed the older runtime-mounting blocker, but delivery remains blocked live because the
mounted SMTP credentials are rejected with `EAUTH` / `535 Incorrect authentication data`.
