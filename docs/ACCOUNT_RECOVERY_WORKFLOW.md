# EXEC-65 Account Recovery Workflow

Date: 2026-05-25

## Scope

Account recovery now extends beyond basic password reset.

Supported flows:

- password reset
- full account recovery
- email ownership verification
- suspicious login confirmation

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
