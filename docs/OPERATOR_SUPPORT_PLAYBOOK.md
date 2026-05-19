# Operator Support Playbook

Last updated: `2026-05-19`  
Scope: `EXEC-28`

## Purpose

This playbook standardizes first-user support responses during controlled rollout.

Use together with:

1. `docs/OPERATOR_SOP.md`
2. `docs/CONTROLLED_ROLLOUT_PLAN.md`
3. `docs/LAUNCH_MONITORING_CHECKLIST.md`
4. `STATUS.md`

## Support Principles

1. explain the real state, not the ideal future state
2. never imply automatic payment, activation, email, or SMS if the platform is still manual
3. confirm whether the issue is support, moderation, billing, technical, or security-owned before replying
4. document escalations and unresolved contradictions in the handoff

## Standard Responses

### Onboarding support

Use when:

1. a company or professional is confused about the first steps
2. a user is unsure why company data is optional or required

Operator response pattern:

1. confirm the account type
2. explain which onboarding steps are required
3. explain that public visibility may still depend on review/approval
4. direct the user to the next step, not just to the form itself

Do not say:

1. “the profile is live instantly”
2. “approval is automatic”

### Moderation responses

Use when:

1. a user asks why a post or asset is not visible
2. a user asks what `PENDING` means

Operator response pattern:

1. confirm whether the content is pending, approved, rejected, or unavailable
2. explain that pending content is intentionally hidden from public browsing
3. provide the next operator action or review expectation
4. escalate if the state in admin and public visibility disagree

### Billing clarification

Use when:

1. a user asks whether payment is automatic
2. a user asks why the plan has not activated yet

Operator response pattern:

1. confirm the current upgrade-request status
2. explain that upgrades are manually reviewed during controlled rollout
3. explain whether invoice/proforma follow-up is still pending
4. give the next operator-owned action and expected follow-up channel

Do not say:

1. “your payment is processing automatically” unless that is truly live
2. “the plan will activate in a few seconds”

### Rejection explanation

Use when:

1. a user asks why content or verification was rejected

Operator response pattern:

1. state that the item was rejected
2. give the highest-signal allowed reason available to the operator
3. explain whether resubmission is possible
4. escalate unusual or disputed decisions to the moderation owner

### Escalation handling

Escalate to moderation owner when:

1. public visibility disagrees with moderation state
2. rejected/pending content appears publicly

Escalate to billing owner when:

1. upgrade state, invoice state, and subscription state do not match
2. the user is waiting without a clear next commercial action

Escalate to technical owner when:

1. onboarding or publish flows fail technically
2. uploads fail repeatedly
3. public detail pages are unavailable unexpectedly

Escalate to security/compliance owner when:

1. abuse, impersonation, or suspicious access is reported
2. account/session boundaries appear broken

## Abuse Handling

When abuse is suspected:

1. capture the relevant account/content identifier
2. confirm whether throttling, moderation, or auth events already exist
3. avoid promising punitive action before review
4. escalate to security/compliance if the pattern is ongoing

## First-User Support Checklist

Before replying, confirm:

1. `/status` remains healthy if the issue sounds technical
2. the relevant admin queue is reachable
3. the user-facing state matches the operator-facing state
4. your reply matches the current rollout contract in `STATUS.md`

## Hard Response Rules

Never promise:

1. instant paid activation
2. automatic checkout
3. automated email delivery
4. automated SMS delivery
5. public visibility before approval
