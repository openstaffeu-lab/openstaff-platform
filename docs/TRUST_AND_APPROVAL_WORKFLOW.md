# EXEC-65 Trust And Approval Workflow

Date: 2026-05-25

## Objective

EXEC-65 unifies password reset, account recovery, email ownership verification, account approval, profile approval, moderation escalation, and trust notifications around a single operational workflow centered on `no-reply@openstaff.eu`.

## Architecture Summary

The implementation uses an orchestration layer in `apps/admin/api/src/trust/trust.service.ts`.

Existing platform primitives are reused deliberately:

- `NotificationEvent`: canonical trust token/event record
- `NotificationDelivery`: delivery history for trust emails
- `AuditLog`: immutable action trail
- `SecurityEvent`: suspicious activity, escalation, and recovery traceability
- `VerificationCase` / `VerificationDecision`: review history for formal verification workflows
- `ReluClassificationResult` / `ReluRecommendation`: moderation-assist signals only

## Unified Flow Areas

The trust layer now covers:

- password reset
- full account recovery
- email ownership verification
- suspicious login/device confirmation
- email-based two-factor authentication
- admin-enforced two-factor requirements
- recovery-code regeneration
- account approval signaling
- profile approval signaling
- moderation escalation

## Trust Lifecycle States

Public-safe trust lifecycle states:

- `PENDING_REVIEW`
- `VERIFIED`
- `APPROVED`
- `SUSPENDED`
- `REJECTED`

Derivation rules combine:

- user approval status
- user account status
- profile moderation status
- profile lifecycle status
- identity verification status

## Admin Trust Actions

Backoffice trust actions:

- `APPROVE_ACCOUNT`
- `REJECT_ACCOUNT`
- `REQUEST_MORE_INFO`
- `APPROVE_PROFILE`
- `REJECT_PROFILE`
- `SUSPEND_PROFILE`
- `REACTIVATE_PROFILE`
- `ESCALATE_REVIEW`
- `REQUIRE_2FA`
- `CLEAR_2FA_LOCK`

Every action:

- updates account/profile state where applicable
- writes audit history
- emits trust notifications
- can include an internal operator note

## Public-Safe Rendering

Public profile trust output is intentionally limited to:

- derived trust badge
- safe verification posture

The public route does not expose:

- internal moderation notes
- escalation reasons
- security-event details
- private approval history
- raw OTP values
- recovery code hashes
- internal 2FA lock reasoning

Unavailable profiles still render a moderation-safe fallback instead of leaking internal state.

## 2FA Extension

EXEC-66 extends the trust layer with:

- short-lived email OTP setup and login challenges
- backup recovery codes
- suspicious-login escalation linkage
- admin-enforced 2FA
- 2FA lockout and replay protection

2FA final actions remain human or user controlled:

- users enable/disable their own 2FA
- admins can require 2FA or clear a stuck lock
- RELU can only advise and summarize
