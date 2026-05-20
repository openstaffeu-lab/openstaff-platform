# Operational Metrics Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-41`

## Purpose

This baseline defines the KPIs needed to judge whether the platform is supportable for controlled real-user onboarding, whether rollout intelligence is good enough to detect friction before it becomes invisible drift, and whether operator effort is becoming more efficient over time.

## Core KPIs

1. onboarding success rate
2. moderation turnaround
3. upgrade turnaround
4. operator backlog
5. failed uploads
6. failed auth
7. webhook failures
8. admin intervention rate
9. support escalation frequency

## Efficiency KPIs

1. moderation minutes per item
2. support minutes per ticket
3. billing minutes per request
4. rollout review time
5. release preparation time
6. operator interruption rate
7. alert-action ratio
8. dashboard usefulness ratio

## Operational Latency KPIs

1. incident acknowledgment time
2. moderation response time
3. billing review response time
4. escalation routing time
5. support first-response time
6. rollback decision time
7. operator handoff time
8. decision reconstruction time
9. escalation rediscovery time

## Metric Definitions

| Metric | Meaning |
|---|---|
| onboarding success rate | registrations that reach onboarding completion |
| moderation turnaround | time from submit/upload to approve/reject |
| upgrade turnaround | time from upgrade request creation to first operator action and to final disposition |
| operator backlog | pending moderation, billing, and support items without closure |
| failed uploads | count/rate of failed media or document uploads |
| failed auth | count/rate of login or token-related user-facing failures |
| webhook failures | failed or rejected billing webhook events |
| admin intervention rate | share of user journeys that require manual operator action |
| support escalation frequency | number of issues that move from L1 to billing, technical, or security owners |

## EXEC-29 Visibility Notes

These KPI families now have a first implementation path:

1. funnel counts and upload failures are exposed through rollout intelligence summaries in `/status`
2. failed auth bursts are visible through security telemetry summaries
3. moderation and upgrade backlog counts are visible in the same readiness surface
4. support escalation and repeated confusion can now be logged through the operational feedback loop

## EXEC-30 Decision Notes

These KPI families now also support:

1. cohort review decisions
2. adoption-readiness scorecard inputs
3. freeze or expand decisions
4. product iteration prioritization for copy, onboarding, and automation

## EXEC-32 Efficiency Notes

These KPI families must now also support:

1. human-load review
2. automation prioritization
3. operator-efficiency review
4. noise-reduction review
5. capacity-overload detection before continuity degrades
6. triage-acceleration review
7. multi-operator readiness review

## EXEC-34 Command-Surface Notes

These KPI families must now also support:

1. cockpit priority ordering
2. context-packet quality
3. incident timeline completeness
4. queue coordination health
5. alert-routing usefulness
6. session continuity quality

## EXEC-35 Assistance Notes

These KPI families must now also support:

1. incident-summary usefulness
2. queue-pressure summary usefulness
3. pattern-detection usefulness
4. digest usefulness
5. correlation usefulness
6. assistance wording safety

## EXEC-36 Surface Notes

These KPI families must now also support:

1. live production-readiness assistance rendering
2. queue-summary explainability
3. incident-assistance explainability
4. digest readability in the admin surface
5. correlation-card usefulness without hidden scoring
6. stale-summary detection through visible timestamps

## Current Baseline Use

Use these KPIs to answer:

1. are first users completing onboarding successfully
2. are moderation and billing staying within operator capacity
3. are support issues coming from product confusion or runtime instability
4. is the current controlled-rollout contract still believable at the observed scale
5. is operator time being spent on judgment or on repetition
6. are operators finding context fast enough to act and hand off safely
7. are operators seeing the same priority order, ownership state, and carryover state from the same command surface
8. is the assistance layer reducing synthesis time without creating authority confusion
9. is the response-preparation layer reducing time-to-next-action without introducing hidden escalation or approval logic
10. is the shared operational memory layer reducing repeated decision reconstruction without hiding stale or conflicting state
11. is the coordination-governance layer making ownership, accountability, and disagreement visible without creating authority theater
12. is the decision-traceability layer preserving rationale and grouped operator history without hiding the need for raw evidence

## Ownership

| Metric family | Owner |
|---|---|
| onboarding/auth/upload | engineering owner + Technical Ops |
| moderation | moderation owner |
| upgrade/billing | billing owner |
| escalation/support backlog | support owner + Technical Ops |
| efficiency and interruption metrics | Technical Ops + functional queue owner |
| triage and handoff latency | Technical Ops + functional queue owner |
| cockpit aggregation and alert-routing quality | Technical Ops + functional queue owner |
| assistance quality and wording safety | Technical Ops + functional queue owner |
| actionability and response-prep quality | Technical Ops + functional queue owner |
| shared memory and decision-support quality | Technical Ops + functional queue owner |
| coordination, accountability, and consensus visibility quality | Technical Ops + functional queue owner |

## Interpretation Notes

1. high admin intervention is expected during controlled rollout, but it must remain visible
2. moderation and billing latency matter more than raw traffic volume at this stage
3. support escalations should be treated as product-trust signals, not only support-load signals
4. efficiency gains are only valid if human review quality and truthfulness remain intact
5. better latency is only meaningful if backup operators can make sense of the same context without re-triaging it
6. better visibility is only meaningful if the same shared summary helps multiple operators reach the same safe conclusion
7. better assistance is only meaningful if operators remain the explicit authority for moderation, billing, escalation, severity, rollback, and rollout state
8. better actionability is only meaningful if operators can act faster because preparation improved, not because authority quietly moved to the system
9. better shared memory is only meaningful if a later operator can recover the same unresolved context faster without inheriting silent authority from the system
10. better coordination visibility is only meaningful if operators can see ownership, disagreement, and accountability more clearly without the system choosing winners
11. better decision traceability is only meaningful if rationale and grouped operator action history shorten reconstruction without replacing raw evidence or human approval

## EXEC-39 Response Acceleration Notes

These KPI families must now also support:

1. time-to-next-action review
2. queue acceleration usefulness
3. escalation packet quality
4. blocked-state visibility usefulness
5. stale-action detection usefulness
6. unresolved-review visibility usefulness
7. operator-load visibility usefulness

## EXEC-40 Shared Memory Notes

These KPI families must now also support:

1. operational memory usefulness
2. decision-support usefulness
3. escalation continuity quality
4. unresolved-state carryover quality
5. recurring issue summary usefulness
6. repeated-failure summary usefulness
7. operator handoff summary usefulness
8. decision reconstruction reduction
9. escalation rediscovery reduction

## Final Assessment

OpenStaff now has an explicit operational metrics baseline, a first rollout-intelligence implementation, an efficiency layer, a latency layer, a command-surface layer, an assistance layer, a response-preparation layer, and a shared-memory layer for deciding whether operators can orient, prepare, act, escalate, remember, and hand off from shared context without weakening control.

## EXEC-41 Coordination Notes

These KPI families must now also support:

1. coordination-governance usefulness
2. decision-traceability usefulness
3. accountability visibility usefulness
4. unresolved-consensus visibility usefulness
5. blocked-decision visibility usefulness
6. rationale-summary usefulness
7. grouped operator-action usefulness
8. conflict-reconstruction reduction
