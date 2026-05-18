# OpenStaff Operator SOP

Last updated: 2026-05-18

## Purpose

This SOP defines the operator runbook for the controlled public rollout.

Use together with:

- `docs/CONTROLLED_ROLLOUT_PLAN.md`
- `docs/LAUNCH_MONITORING_CHECKLIST.md`
- `docs/LAUNCH_CHECKLIST.md`
- `STATUS.md`

## Operator Roles

- moderation owner
- billing owner
- support owner
- technical owner
- security/compliance owner

## Public Posts: Approve / Reject

### Approve

1. Open admin posts queue in backoffice.
2. Review post content, attached metadata, and moderation status.
3. Confirm the post meets launch, policy, and compliance expectations.
4. Approve the post.
5. Confirm the post becomes publicly visible.

### Reject

1. Open the pending or flagged post.
2. Review reason for rejection.
3. Reject the post when it fails moderation standards.
4. Confirm it remains hidden from public listing/detail.
5. Record unusual or disputed cases in the audit trail or support notes.

## Media / Documents Review

1. Open admin media/documents queues.
2. Review each pending asset for relevance, legitimacy, and compliance.
3. Approve only assets that match the published content and pass policy review.
4. Reject assets that are invalid, unsafe, or unsupported.
5. Confirm approved assets are visible with approved public content and rejected assets remain hidden.

## Upgrade Requests

1. Review incoming request from the public pricing path.
2. Confirm plan intent and account identity.
3. Confirm billing profile exists or request completion.
4. Decide whether to approve, defer, or reject.
5. If approved, continue with invoice/proforma handling.
6. Ensure the user is not promised instant activation while billing remains `manual_only`.

## Manual Invoice / Payment Handling

1. Open admin billing workflows.
2. Create or review invoice/proforma associated with the approved upgrade.
3. Confirm line items and user/account linkage are correct.
4. Share payment follow-up manually through the approved support path.
5. Reconcile payment manually or through a verified webhook-backed event where applicable.
6. Mark invoice/payment state accurately in admin.
7. Re-check subscription state after billing action.

## Security / Compliance Alerts

1. Open admin security dashboard.
2. Review suspicious login, permission, throttling, or compliance events.
3. Triage severity:
   - low: monitor and document
   - medium: assign owner and follow up same day
   - high: escalate immediately to technical or security owner
4. If access abuse or auth anomaly is ongoing, pause affected operation and escalate.

## Support Triage

### Typical Categories

- registration/login issue
- onboarding confusion
- post or asset moderation question
- upgrade request question
- invoice/payment status question
- security or compliance concern

### Triage Flow

1. Acknowledge the issue.
2. Classify owner: support, moderation, billing, technical, or security.
3. Check `/status` and relevant admin queue before responding.
4. Resolve or escalate within the shift SLA.
5. Document unresolved items in handoff notes.

## First User Journey Proof

Operators should be ready to run or confirm proof for:

- public registration
- login
- onboarding start
- profile creation
- publish post
- upload media/document
- admin moderation approve/reject
- public visibility after approval
- messaging/contact if used in the tested cohort
- upgrade request
- operator billing follow-up

## Escalation Guidance

Escalate to technical owner when:

- `/health` or `/status` degrade
- admin UI cannot load essential operational pages
- uploads fail repeatedly
- auth failures spike

Escalate to billing owner when:

- upgrade requests are waiting without action
- invoice state is unclear
- payment reconciliation is inconsistent

Escalate to security/compliance owner when:

- repeated suspicious logins appear
- admin permission boundaries appear broken
- compliance queue is blocked

## Do Not Promise

Operators must not promise:

- automatic checkout
- instant paid activation
- automated email delivery
- automated SMS delivery

Unless the production contract changes and `STATUS.md` is updated accordingly.
