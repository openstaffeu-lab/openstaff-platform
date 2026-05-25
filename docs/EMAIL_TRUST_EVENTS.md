# EXEC-65 Email Trust Events

Date: 2026-05-25

## Sender

Operational sender:

- `OpenStaff <no-reply@openstaff.eu>`

## Core Trust Email Events

Implemented or supported trust-oriented email events:

- `PASSWORD_RESET_AVAILABLE`
- `ACCOUNT_RECOVERY_REQUESTED`
- `EMAIL_OWNERSHIP_VERIFICATION_REQUESTED`
- `ACCOUNT_APPROVED`
- `ACCOUNT_REJECTED`
- `VERIFICATION_REQUESTED`
- `PROFILE_APPROVED`
- `PROFILE_REJECTED`
- `ACCOUNT_SUSPENDED`
- `PROFILE_REACTIVATED`
- `MODERATION_ESCALATED`
- `SUSPICIOUS_LOGIN_DETECTED`
- `TWO_FACTOR_SETUP_CONFIRMATION`
- `TWO_FACTOR_LOGIN_OTP_SENT`
- `TWO_FACTOR_RECOVERY_CODES_REGENERATED`

## Template Classes

Current template groups:

- password reset
- account recovery
- email ownership verification
- generic approval / moderation notices
- email OTP setup / login
- recovery-code regeneration

## Delivery Guarantees

Each trust email is represented by:

- `NotificationEvent`
- one or more `NotificationDelivery` rows

This gives:

- delivery history
- retry visibility
- event correlation
- audit-friendly trust workflow traceability

## Link Safety

Email links are:

- signed
- time-limited
- single-use
- consumption-tracked

This protects password reset, account recovery, ownership confirmation, and suspicious-login confirmation flows from replay after successful use.

For EXEC-66, OTP and recovery-email events additionally rely on:

- hashed OTP values at rest
- short-lived expiry windows
- resend throttling
- per-challenge attempt ceilings

## EXEC-67 Delivery Status

EXEC-67 closed the deployment/runtime blockers for these trust events:

- the migration backing 2FA trust events is live in production
- the new API revision is healthy in production
- public web and backoffice now run the matching trust/2FA UI revisions

Still required for final proof:

- operator-confirmed receipt of setup OTP email
- operator-confirmed receipt of login OTP email
- live proof for recovery-code regeneration notification
