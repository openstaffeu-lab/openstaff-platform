# EXEC-66 2FA Security Review

Date: 2026-05-25

## Security Properties

2FA OTP challenges are:

- randomly generated
- short-lived
- single-use
- hashed at rest
- resend-limited
- replay-protected
- audit logged

Recovery codes are:

- generated in batches
- stored only as hashes
- invalidated after one use
- rotated on regeneration

## Brute-Force Controls

Implemented protections:

- per-challenge attempt counting
- per-user failed-attempt accumulation
- temporary lockout window
- challenge invalidation after exhaustion
- security-event creation on repeated failures

## Admin Boundaries

Admins may:

- require 2FA
- clear a stuck 2FA lock with an audit note path

Admins may not:

- view OTP secrets
- view plaintext recovery codes after setup flow
- bypass 2FA without normal auth/session controls

## Remaining Risks

1. Email OTP inherits the operational strength of mailbox security and sender deliverability.
2. The platform still stores session tokens in `localStorage`, so 2FA improves account-trust posture without fully closing XSS session theft risk.
3. Production closure still depends on same-turn migration execution and real mailbox proof.

## EXEC-67 Update

The same-turn migration execution dependency is now closed:

- production migration was applied through Cloud Run job `openstaff-api-migrate-exec67`
- the new API revision started successfully after module-wiring fixes

The remaining live-security closure gap is now narrower:

- real delivered OTP proof
- real recovery-code consumption proof
- authenticated admin/browser proof for the new 2FA UX
## EXEC-68 Security Review Addendum

Date: 2026-05-25

The login OTP flow now rejects expired locally stored challenges, resends into a fresh challenge id/expiry, clears pending challenges on logout, and refreshes the active public/backoffice auth contexts before redirecting to protected pages. Remaining 2FA risk: tokens still persist in localStorage for reload continuity and should be migrated to secure httpOnly cookies in a later hardening pass.

## EXEC-69C Security Review Addendum

Date: 2026-05-25

EXEC-69C tightens the OTP surface to six numeric digits at the DTO and UI layers. OTP generation now pads leading zeroes and always returns a six-digit numeric string.

The post-OTP session race is addressed by `completeSession(...)` in public and backoffice `AuthContext`, which stores the access token, refresh token, and user before route navigation. Pending challenge state is cleared only after session hydration succeeds.

Backoffice `/two-factor` is now excluded from admin guard protection so active challenges do not bounce back to `/login`.

Residual risks:

- Real mailbox OTP delivery and reused/expired OTP proof still require a supplied test mailbox.
- Tokens still persist in localStorage.
- Recovery-code sign-in should be exposed through a separate recovery-code endpoint/UI if required after OTP DTO strictness.
