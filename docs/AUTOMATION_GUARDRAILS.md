# Automation Guardrails

Last updated: `2026-05-20`  
Scope: `EXEC-40`

## Purpose

This policy defines what OpenStaff may automate safely, what must remain human-reviewed, and where escalation or rollback authority can never be delegated away.

## Guardrail Principles

1. automation may reduce clerical effort before it reduces human judgment
2. automation must never create a false impression that manual-only workflows are now self-serve
3. anything that changes public trust, money state, access state, or rollout risk must remain explicitly reviewable
4. automation must preserve observability rather than hide the work it performs
5. assistance may accelerate operator understanding before it accelerates operator action
6. live assistance surfaces must keep their threshold logic and source metrics visible to operators
7. live assistance surfaces must show a visible snapshot time so operators can detect stale context
8. operational compression must reduce repeated reasoning before it reduces visible nuance
9. unified intelligence surfaces must keep grouped state explainable instead of collapsing it into opaque scoring
10. actionability layers may prepare the next step faster, but they may not silently take the step
11. response-preparation layers must keep blocked, stale, unresolved, and overload cues visible instead of burying them in hidden routing logic
12. shared operational memory may preserve prior context, but it may not convert prior context into automatic decision authority
13. decision-support layers must keep recurring issue summaries, unresolved state, and carryover cues timestamped and source-linked

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
7. imply that a recommendation is already confirmed operator intent

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
10. live readiness-page summaries that turn visible `/status` metrics into explainable operator context
11. live browser validation and usability review of assistance surfaces before calling a new assistance rollout operationally closed
12. compressed operator orientation surfaces that group visible queue, rollout, incident, and freshness state without changing production state
13. stale-state indicators, grouped state summaries, and attention-routing cues that remain source-linked and advisory-only
14. grouped next-action summaries, queue acceleration hints, escalation packets, and response-preparation prompts that remain visibly advisory
15. shared operational memory summaries, escalation continuity packets, recurring issue summaries, repeated-failure summaries, and operator handoff summaries that remain visibly advisory

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
11. accepting or rejecting live assistance recommendations shown in admin surfaces
12. deciding whether assistance wording is safe enough for operator use in production
13. accepting or rejecting compressed priority ordering shown on an operational intelligence surface
14. deciding whether a stale or conflicting summary still matches current live operator context
15. accepting or rejecting suggested next-action preparation and escalation-packet summaries
16. accepting or rejecting shared-memory carryover summaries and recurring-pattern interpretations

## What Requires Escalation

1. billing-state mismatch across request, invoice, payment, and subscription state
2. moderation/public-visibility disagreement
3. auth or storage failures visible to users
4. alert patterns suggesting a cross-service incident
5. overload thresholds reached in `docs/OPERATIONAL_CAPACITY_LIMITS.md`
6. any assistance output that surfaces billing-state ambiguity, moderation/public-visibility disagreement, or likely rollback review
7. any compressed intelligence summary that conflicts materially with specialist queue surfaces or current handoff notes
8. any response-preparation summary that suggests a blocked, stale, or unresolved state without enough visible source support
9. any shared-memory or decision-support summary that conflicts materially with live queue state, live owner context, or current readiness warnings

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
4. operators must be able to review the underlying metrics on the same surface before acting

## Authority Boundaries By Domain

1. moderation authority remains human-owned
2. billing activation authority remains human-owned
3. incident severity authority remains human-owned
4. escalation authority remains human-owned
5. rollback and recovery authority remain human-owned
6. rollout pause, freeze, and expansion authority remain human-owned
7. operational compression may route attention, but it may not route authority
8. response acceleration may prepare action, but it may not execute action
9. shared operational memory may preserve decision context, but it may not make the decision

## Final Assessment

Automation and operational assistance should remove friction around human judgment, not replace the judgment that protects public trust, commercial integrity, and operational safety.
