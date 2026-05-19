# Automation Guardrails

Last updated: `2026-05-19`  
Scope: `EXEC-35`

## Purpose

This policy defines what OpenStaff may automate safely, what must remain human-reviewed, and where escalation or rollback authority can never be delegated away.

## Guardrail Principles

1. automation may reduce clerical effort before it reduces human judgment
2. automation must never create a false impression that manual-only workflows are now self-serve
3. anything that changes public trust, money state, access state, or rollout risk must remain explicitly reviewable
4. automation must preserve observability rather than hide the work it performs
5. assistance may accelerate operator understanding before it accelerates operator action

## Allowed Assistance Layer

The assistance layer may:

1. summarize
2. highlight
3. correlate
4. suggest
5. prioritize
6. route

The assistance layer may not:

1. approve moderation
2. activate billing
3. change severity automatically
4. trigger rollback
5. override operators
6. change rollout state automatically

## What May Be Automated

1. queue summaries, reminders, and stale-item detection
2. response templates for onboarding, moderation wait states, and billing clarification
3. report drafting from known rollout metrics and admin summaries
4. release-proof collection from deterministic build and validation outputs
5. support issue classification and owner suggestion
6. alert deduplication and incident-draft preparation
7. operator digests and queue-pressure summaries
8. safe correlation summaries across logs, alerts, queues, and rollout signals
9. triage recommendations using clearly non-authoritative wording

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
10. final escalation decision where operator confirmation is still required

## What Requires Escalation

1. billing-state mismatch across request, invoice, payment, and subscription state
2. moderation/public-visibility disagreement
3. auth or storage failures visible to users
4. alert patterns suggesting a cross-service incident
5. overload thresholds reached in `docs/OPERATIONAL_CAPACITY_LIMITS.md`
6. any assistance output that surfaces billing-state ambiguity, moderation/public-visibility disagreement, or likely rollback review

## What Requires Manual Approval Forever

1. public-content publish authority
2. commercial upgrade activation
3. production secret and IAM mutations
4. cohort expansion and launch-freeze decisions
5. restore, rollback, or destructive recovery actions in production

## Operator Override Rules

1. operator judgment always supersedes assistance wording
2. assistance may not hide or replace the source evidence an operator needs
3. operators may ignore, reject, or reinterpret suggested classifications and next checks

## Authority Boundaries By Domain

1. moderation authority remains human-owned
2. billing activation authority remains human-owned
3. incident severity authority remains human-owned
4. escalation authority remains human-owned
5. rollback and recovery authority remain human-owned
6. rollout pause, freeze, and expansion authority remain human-owned

## Final Assessment

Automation and operational assistance should remove friction around human judgment, not replace the judgment that protects public trust, commercial integrity, and operational safety.
