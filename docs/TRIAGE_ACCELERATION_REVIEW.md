# Triage Acceleration Review

Last updated: `2026-05-19`  
Scope: `EXEC-33`

## Purpose

This review documents where triage is fast enough today and where detection, classification, escalation, or recovery decision-making still loses time.

## Triage Path Review

| Scenario | Detection time | Classification time | Escalation time | Recovery-decision time | Main friction |
|---|---|---|---|---|---|
| auth failures | medium | medium | medium | medium | signals exist, but operator still correlates alerts, `/status`, and user-facing impact manually |
| moderation incidents | medium | medium | medium | medium | queue state and public-visibility expectations still require cross-checking |
| upload failures | medium | medium | medium | medium | operator often moves between runtime, storage, and public-surface symptoms |
| webhook failures | medium | medium | medium | medium | billing state coherence still requires inspection across queue and runtime context |
| rollout regressions | medium | high | medium | high | the signal exists, but deciding whether it is friction, trust drift, or runtime regression still takes synthesis |
| support escalations | medium | medium | medium | low to medium | ownership is documented, but repeated reclassification still costs time |
| Cloud Run incidents | low | medium | medium | medium | alerts help early, but rollback versus mitigation still depends on human synthesis |
| Cloud SQL incidents | low | medium | medium | high | signals are visible, but restore versus wait versus rollback remains high-stakes judgment |

## Slowest Triage Paths

1. rollout regressions because they blend product friction, support pressure, and possible runtime issues
2. Cloud SQL incidents because the technical signal is clear but the recovery decision has high blast radius
3. billing and webhook issues because queue state and commercial truth must be reconciled together

## Missing Operational Context

1. one consolidated owner-and-backup view for active issues
2. faster visibility into whether an issue is already being handled by another operator
3. cleaner linkage between repeated support confusion and the relevant queue or incident
4. a more explicit triage summary for webhook and billing-state mismatches

## Avoidable Investigation Steps

1. checking multiple surfaces to confirm whether a degraded state is already declared
2. re-reading the same contract wording for manual billing or moderation expectations
3. rebuilding queue age and escalation urgency manually from scattered signals
4. re-confirming owner routing when the issue shape is already known

## Acceleration Opportunities

1. shared issue summaries with owner, backup owner, current state, and next action
2. quicker routing hints for auth, upload, billing, moderation, and support issue categories
3. stronger queue-aging visibility tied to escalation thresholds
4. incident and degraded-mode status surfaced alongside operator queues

## Final Assessment

OpenStaff's triage is no longer blind, but it is still slower than it should be because operators spend time proving what kind of issue they are looking at before they can decide who should move next.
