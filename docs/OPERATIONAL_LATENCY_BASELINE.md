# Operational Latency Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-33`

## Purpose

This baseline defines the latency KPIs that matter for operator reaction time and coordination speed.

## Core Latency KPIs

1. incident acknowledgment time
2. moderation response time
3. billing review response time
4. escalation routing time
5. support first-response time
6. rollback decision time
7. operator handoff time

## Metric Definitions

| Metric | Meaning |
|---|---|
| incident acknowledgment time | time from first credible signal to named owner acknowledgment |
| moderation response time | time from first required moderation review to first operator action |
| billing review response time | time from upgrade or billing issue creation to first operator-owned billing action |
| escalation routing time | time from recognizing an issue as escalated to placing it with the correct owner |
| support first-response time | time from first support-visible issue to first operator response |
| rollback decision time | time from confirmed serious regression to explicit rollback versus mitigation decision |
| operator handoff time | time required to produce and consume a handoff that another operator can act on safely |

## Interpretation Notes

1. lower latency is only good if the decision remains correct and truthful
2. the goal is faster orientation, not rushed judgment
3. rollback decision time should shrink because context is clearer, not because caution is skipped

## Final Assessment

OpenStaff now has an explicit operational latency baseline. This makes reaction speed measurable without pretending that the highest-risk approvals should become thoughtless.
