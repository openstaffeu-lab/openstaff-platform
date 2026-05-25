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
