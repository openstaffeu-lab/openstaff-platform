# Alert Routing Review

Last updated: `2026-05-19`  
Scope: `EXEC-34`

## Purpose

This review defines what current alerting is good at, where routing still creates friction, and how acknowledgment and suppression should behave during normal operation and maintenance windows.

## Current Routing Assessment

| Alert class | Current usefulness | Main issue |
|---|---|---|
| Cloud Run runtime alerts | actionable | still require operator synthesis with queue and cohort impact |
| Cloud SQL alerts | actionable and high-stakes | technical signal is strong, but routing must clarify recovery authority |
| auth-failure proxy alerts | actionable but contextual | need clearer correlation to support and rollout pressure |
| webhook and billing failure alerts | actionable | queue and commercial coherence context is still split |
| moderation-related operational signals | partly actionable | owner routing and trust impact need cleaner surfacing |
| duplicated correlated alerts | noisy | multiple signals may describe the same underlying failure |
| gaps where no owner is obvious | missing routing | signal may exist, but ownership is not immediately visible |

## Classification

1. actionable: alerts that should produce immediate operator orientation or action
2. noisy: alerts that are visible but too repetitive or low-context
3. duplicated: multiple alerts representing one incident shape
4. missing routing: alert exists but owner is not obvious
5. missing ownership: operator knows there is a problem but not who should take it

## Routing Expectations

Every meaningful alert should route with:

1. default owner
2. backup owner
3. issue class
4. expected first action
5. escalation threshold
6. whether degraded mode or freeze review is likely

## Escalation Routing Rules

1. runtime or database alerts route first to Technical Ops
2. billing or webhook alerts route to billing owner and Technical Ops when coherence is unclear
3. auth and upload alerts route to Technical Ops with support visibility when user pressure rises
4. moderation visibility disagreements route to moderation owner with escalation when trust impact is unclear
5. cross-service signals route to an incident commander once incident shape is credible

## Acknowledgment Rules

1. acknowledgment must name the active owner
2. acknowledgment should indicate whether triage has started
3. acknowledgment should indicate whether the signal is isolated, correlated, or already covered by an active incident
4. acknowledgment is incomplete if the next action is not clear

## Suppression Expectations

Suppress only when:

1. the alert is duplicated by a higher-signal alert
2. the issue is already covered by an active incident thread
3. the maintenance window explains the signal
4. suppression will not hide unresolved user-facing risk

Do not suppress:

1. trust-impacting moderation or visibility anomalies
2. billing-state ambiguity
3. incidents without named ownership
4. visibility gaps during active rollout decisions

## Maintenance-Window Behavior

During maintenance windows:

1. alerts should still be visible, but tagged with expected change context
2. acknowledgment should note the maintenance action in progress
3. unresolved alerts after the maintenance window should be treated as normal live signals again
4. incident state should be reopened if recovery is not validated cleanly

## Final Assessment

OpenStaff already has meaningful alert coverage. EXEC-34 improves the human routing contract around those alerts so operators spend less time deciding who should care and more time deciding what should happen next.
