# EXEC-66 Two-Factor Authentication Baseline

Date: 2026-05-25

## Scope

EXEC-66 adds email-based two-factor authentication as a trust-layer extension.

Included:

- email OTP login challenge
- email OTP setup confirmation
- backup recovery codes
- suspicious-login escalation linkage
- admin-enforced 2FA
- user-managed enable / disable

Not included:

- SMS 2FA
- authenticator-app TOTP
- RELU-driven auto-enablement or bypass

## Data Model

Persistent state is stored in:

- `UserTwoFactorSettings`
- `UserTwoFactorChallenge`

This supports:

- durable enabled/enforced state
- lockout tracking
- single-use challenges
- hashed recovery-code storage

## API Surface

Authenticated:

- `GET /auth/2fa/status`
- `POST /auth/2fa/setup`
- `POST /auth/2fa/verify-setup`
- `POST /auth/2fa/disable`
- `POST /auth/2fa/recovery-codes/regenerate`

Public challenge endpoints:

- `POST /auth/2fa/challenge/verify`
- `POST /auth/2fa/challenge/resend`

Login behavior:

- `POST /auth/login` now returns `challengeRequired` when 2FA applies

## UX Surface

Public web:

- `/two-factor`
- `/security`

Backoffice:

- `/two-factor`
- admin users trust controls and 2FA visibility

## EXEC-67 Rollout Status

EXEC-67 moved the 2FA baseline from local-only readiness to production runtime readiness:

- the EXEC-66 Prisma migration was applied successfully in production
- the API startup blockers were fixed and the healthy live API revision is now `openstaff-api-00033-ssp`
- public web and backoffice were also redeployed successfully

Final end-to-end 2FA product proof is still `IN PROGRESS` until a real mailbox-backed OTP journey, recovery-code journey, and authenticated browser proof are captured.
## EXEC-68 Update - Login Challenge Continuity

Date: 2026-05-25

The public and backoffice two-factor login challenge now carries an absolute `expiresAt` value in sessionStorage, clears stale token state when a challenge is required, refreshes the active auth context after OTP verification, and clears pending challenge state on logout or successful verification. This closes the broken redirect where password login succeeded, OTP verification stored tokens, but the protected page guard still saw an unauthenticated in-memory context.
