# Queue Coordination Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-34`

## Purpose

This baseline formalizes how OpenStaff should coordinate moderation, billing, support, escalation, rollout-review, and incident-review queues.

## Queue Inventory

The operational queues that require shared coordination are:

1. moderation
2. billing
3. support
4. escalations
5. rollout review
6. incident review

## Queue Ownership Model

Every queue requires:

1. a primary owner
2. a backup owner
3. a documented escalation threshold
4. a documented freeze threshold when relevant

## Queue Rules

| Queue | Primary owner | Backup owner expectation | First-response expectation | Aging threshold | Escalation threshold | Freeze threshold | Batching rule |
|---|---|---|---|---|---|---|---|
| moderation | moderation owner | another trained moderation-capable operator | same business day | pending older than one business day | trust-impact item unclear, backlog rising, or unusual dispute | backlog aging exceeds one business day with no safe coverage | safe for similar low-risk items, never for disputed trust decisions |
| billing | billing owner | backup billing-capable operator | same business day | upgrade or invoice item older than one business day without action | state mismatch across request, invoice, payment, or webhook | billing follow-up displaces core queue ownership or commercial truth becomes unclear | safe for acknowledgement and reminder work, not for final activation decisions |
| support | support owner | Technical Ops or trained backup operator | same business day | repeated unanswered issues across a monitoring window | same confusion family spreads or technical suspicion rises | support pressure prevents truthful response quality | safe for repeated known-answer grouping, not for unresolved trust-critical cases |
| escalations | receiving functional owner or incident commander | alternate owner named in transfer | immediate once escalation class is clear | escalation waiting across one handoff | issue unowned, misrouted, or repeatedly reclassified | escalations accumulate without ownership clarity | not a batching-first queue; prioritize by urgency |
| rollout review | Technical Ops + rollout owner | backup reviewer | end of cohort or review window | review delayed past cohort boundary | expansion decision blocked by unresolved signals | unresolved risk plus new cohort pressure | summary preparation can batch, final decision cannot |
| incident review | incident commander | alternate commander | immediate for active incidents | unresolved after the same monitoring window | severity rises, blast radius grows, or mitigation stalls | incident plus queue pressure makes safe promises impossible | updates can batch by interval, mitigation decisions cannot |

## SLA Expectations

At the current controlled-rollout stage:

1. moderation requires first action within one business day
2. billing requires acknowledgement within one business day
3. support requires first response within one business day
4. active escalations require immediate owner routing once recognized
5. active incidents require immediate command and timeline start

## Queue Aging Rules

1. aging must be visible in the shared queue view
2. same item aging across handoffs is a coordination signal, not just a volume signal
3. queue aging matters more than raw count when user trust or commercial truth is at stake

## Escalation Rules

Escalate when:

1. the queue owner is unclear
2. backup coverage is absent
3. the item crosses its aging threshold
4. the item requires cross-service or cross-queue synthesis
5. the item affects public trust, billing coherence, or incident safety

## Freeze Rules

Freeze rollout or expansion when:

1. moderation queue aging exceeds the sustainable threshold
2. billing queue coherence is not understandable
3. support pressure prevents truthful response quality
4. incident review or mitigation consumes too much active capacity
5. queue ownership gaps make safe continuity impossible

## Batching Rules

Batching is allowed only when it reduces repetition without hiding judgment.

Safe batching examples:

1. low-risk moderation reminders and sequencing
2. standard billing acknowledgements
3. repeated support issue grouping
4. report and handoff preparation

Unsafe batching examples:

1. disputed moderation decisions
2. final plan activation or billing exception handling
3. severity assignment
4. rollback approval

## Final Assessment

EXEC-34 makes queues first-class coordination objects instead of separate worklists. The key baseline is that every queue now has expected ownership, aging, escalation, freeze, and batching rules so operators can act consistently and transfer work without resetting the same reasoning.
