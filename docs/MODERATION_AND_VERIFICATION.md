# EXEC-65 Moderation And Verification

Date: 2026-05-25

## Human-Controlled Review

EXEC-65 keeps all final moderation actions human-controlled.

Human operators remain responsible for:

- approving accounts
- rejecting accounts
- approving profiles
- rejecting profiles
- suspending profiles
- reactivating profiles
- requesting additional information
- escalating suspicious reviews

## RELU Scope

RELU may:

- summarize profile risk
- classify missing onboarding information
- surface moderation hints
- suggest next moderation actions

RELU must not:

- auto-approve
- auto-reject
- auto-ban

## Timeline And Notes

Admin trust summary now aggregates:

- moderation timeline
- trust/security events
- notification history
- approval history
- internal note-bearing audit items

## Verification Alignment

Formal identity/company verification continues to use:

- `VerificationCase`
- `VerificationDecision`

EXEC-65 does not replace that system. It adds a surrounding trust layer so recovery, approval messaging, escalation, and trust visibility all share consistent operational handling.
