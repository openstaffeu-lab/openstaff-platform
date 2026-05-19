# Scale Readiness Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-28`

## Purpose

This baseline defines what controlled scale looks like before full self-serve automation exists.

## First 10 Users

Operational expectation:

1. support remains high-touch
2. moderation remains manually triaged
3. upgrade requests remain operator-reviewed
4. unusual issues should be resolved with same-day human follow-up

Known bottlenecks:

1. moderation queue ownership
2. billing clarification and invoice follow-up
3. verification/rejection explanation

## First 100 Users

Operational expectation:

1. support remains controlled, but no longer fully ad hoc
2. queue ownership and handoff discipline become mandatory
3. backlog metrics must be watched daily
4. billing and moderation throughput become the leading constraints

Primary bottlenecks:

1. moderation turnaround
2. manual upgrade and invoice handling
3. rejection-explanation workload
4. support routing across ops, billing, and technical owners

## Bottleneck Matrix

| Area | Current scaling limit | Trigger |
|---|---|---|
| moderation | manual queue review | backlog grows faster than daily clearance |
| billing | manual approval and invoice follow-up | upgrade requests exceed same-day acknowledgement capacity |
| support | operator handoff and explanation work | repeated first-user confusion or unresolved queue ownership |
| technical ops | manual issue triage | recurring public unavailability or upload failures |

## Escalation Triggers

Escalate immediately when:

1. moderation backlog exceeds agreed SLA
2. billing request backlog loses ownership clarity
3. public visibility contradicts moderation state
4. temporary-unavailable public detail states become frequent
5. support issues repeat with the same confusing wording or workflow contradiction

## Freeze / Rollback Triggers

Freeze controlled growth when:

1. `/health` or `/status` degrade
2. admin moderation or billing surfaces stop being usable
3. support cannot explain the real user state with confidence
4. moderation or billing backlog exceeds operator capacity for the current cohort

Rollback or pause growth when:

1. approved content is no longer reliably public
2. pending/rejected content leaks publicly
3. commercial state becomes misleading or non-auditable

## Overload Thresholds

Use these as practical operator thresholds until richer automation exists:

1. moderation queue not cleared within one business day
2. upgrade requests not acknowledged within one business day
3. repeated unresolved first-user support issues across the same flow
4. public-detail temporary-unavailable states appearing often enough to affect user trust

## Final Assessment

OpenStaff is ready for controlled real-user growth, but only while moderation, billing, and support remain explicitly staffed and backlog-sensitive. The system can support the first 10 users comfortably and the first 100 users only with tighter queue discipline and escalation rigor.
