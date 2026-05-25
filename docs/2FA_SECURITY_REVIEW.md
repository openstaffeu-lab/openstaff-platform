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
