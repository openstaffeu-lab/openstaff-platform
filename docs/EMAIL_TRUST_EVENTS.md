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

## Template Classes

Current template groups:

- password reset
- account recovery
- email ownership verification
- generic approval / moderation notices

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
