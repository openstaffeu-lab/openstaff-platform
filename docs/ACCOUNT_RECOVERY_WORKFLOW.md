# EXEC-65 Account Recovery Workflow

Date: 2026-05-25

## Scope

Account recovery now extends beyond basic password reset.

Supported flows:

- password reset
- full account recovery
- email ownership verification
- suspicious login confirmation
- two-factor challenge recovery through one-time recovery codes

## Recovery Entry Points

Public auth endpoints:

- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`
- `POST /auth/account-recovery/request`
- `POST /auth/account-recovery/complete`

Trust endpoints:

- `POST /trust/email-ownership/request`
- `POST /trust/email-ownership/confirm`
- `POST /trust/suspicious-login/confirm`

## Security Properties

- one-time trust links
- signed token payloads
- HMAC verification
- expiry enforcement
- replay prevention through consumption tracking
- session revocation on password reset / account recovery
- security-event logging on suspicious recovery cases
- recovery-code invalidation after single use
- 2FA challenge lockout after repeated invalid attempts

## Abuse Controls

- existing auth rate-limit guards remain active
- neutral responses continue to reduce enumeration risk
- compromised or suspicious recovery requests create security events for follow-up

## UX Notes

Public web now supports:

- password reset mode
- full account recovery mode
- trust confirmation landing page

Profile owners can request a new email ownership verification message directly from the profile workspace.

## Relationship To 2FA

EXEC-66 does not replace password reset or account recovery with 2FA. Instead:

- password reset remains the credential-recovery entry point
- account recovery remains the higher-trust remediation flow
- recovery codes provide a constrained 2FA fallback after successful primary credential entry
- suspicious-login confirmation remains a parallel trust-control path for unfamiliar devices
