# Context Aggregation Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-34`

## Purpose

This baseline defines the minimum context packets operators should receive for daily work, incident handling, moderation review, and billing review so they do not have to reconstruct timelines and ownership from scattered surfaces.

## Current Aggregation Gaps

Operators still repeat:

1. searching for the same queue state in multiple surfaces
2. filtering backlog by age or severity manually
3. rebuilding timelines from logs, readiness state, and queue status
4. correlating support symptoms with runtime or billing state by hand

## Minimum Operational Context Packet

Every shared operational context packet should include:

1. current runtime mode: `normal`, `degraded`, or `frozen`
2. rollout band or active cohort
3. critical queue counts and aging
4. active incident or escalation summary
5. top actionable alerts
6. current owners and backup owners
7. next required operator actions
8. current freeze or escalation thresholds that are close to being crossed

## Minimum Incident Context Packet

Every incident packet should include:

1. incident title and class
2. severity
3. first detected timestamp
4. triage-start timestamp
5. current incident commander and alternate
6. impacted services, cohorts, or queues
7. blast radius summary
8. mitigation in progress
9. rollback candidate or rollback state
10. next decision point
11. communication state
12. postmortem required state

## Minimum Moderation Context Packet

Every moderation packet should include:

1. item type and current moderation status
2. age since submission
3. queue-aging class
4. trust-impact or visibility-impact note
5. owner and backup owner
6. prior related moderation history if relevant
7. current policy or explanation standard that applies
8. escalation state for unusual or disputed cases

## Minimum Billing Review Packet

Every billing packet should include:

1. upgrade request state
2. billing profile state
3. invoice state
4. payment state
5. webhook state if relevant
6. age since request or last operator action
7. owner and backup owner
8. user-facing promise currently in force
9. next required action
10. escalation note if coherence is unclear

## Context Aggregation Rules

1. packets should prefer decision context over raw logs
2. packets should show the latest known owner without requiring separate lookup
3. packets should capture the last meaningful operator action
4. packets should include aging and threshold context, not just raw counts
5. packets should reduce repeated contract explanation for `manual_only` and human-reviewed flows

## What Should Not Be Aggregated Blindly

1. final moderation decisions
2. final billing activation decisions
3. incident severity assignment without human review
4. rollback approval
5. public trust wording that depends on real case nuance

## Final Assessment

The purpose of context aggregation is not to replace judgment. It is to make judgment start from a prepared packet instead of from manual reconstruction. EXEC-34 treats context packets as the minimum contract required for a future cockpit and faster handoff discipline.
