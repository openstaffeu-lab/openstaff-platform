# Automation Guardrails

Last updated: `2026-05-19`  
Scope: `EXEC-32`

## Purpose

This policy defines what OpenStaff may automate safely, what must remain human-reviewed, and where escalation or rollback authority can never be delegated away.

## Guardrail Principles

1. automation may reduce clerical effort before it reduces human judgment
2. automation must never create a false impression that manual-only workflows are now self-serve
3. anything that changes public trust, money state, access state, or rollout risk must remain explicitly reviewable
4. automation must preserve observability rather than hide the work it performs

## What May Be Automated

1. queue summaries, reminders, and stale-item detection
2. response templates for onboarding, moderation wait states, and billing clarification
3. report drafting from known rollout metrics and admin summaries
4. release-proof collection from deterministic build and validation outputs
5. support issue classification and owner suggestion
6. alert deduplication and incident-draft preparation

## What Must Remain Human-Reviewed

1. final moderation approval or rejection
2. final upgrade approval and entitlement activation
3. IAM changes, secret changes, and auth-permission changes
4. suspicious access investigation
5. retention-policy or public-delivery policy changes
6. incident severity assignment
7. traffic rollback decision
8. production freeze or hotfix approval
9. cohort expansion decisions and scorecard interpretation

## What Requires Escalation

1. billing-state mismatch across request, invoice, payment, and subscription state
2. moderation/public-visibility disagreement
3. auth or storage failures visible to users
4. alert patterns suggesting a cross-service incident
5. overload thresholds reached in `docs/OPERATIONAL_CAPACITY_LIMITS.md`

## What Requires Manual Approval Forever

1. public-content publish authority
2. commercial upgrade activation
3. production secret and IAM mutations
4. cohort expansion and launch-freeze decisions
5. restore, rollback, or destructive recovery actions in production

## Final Assessment

Automation should remove friction around human judgment, not replace the judgment that protects public trust, commercial integrity, and operational safety.
