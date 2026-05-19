# Operational Priority Matrix

Last updated: `2026-05-19`  
Scope: `EXEC-34`

## Purpose

This matrix defines shared priority classes for operational work so incidents, queue items, and support-visible failures are ordered consistently across operators.

## Priority Classes

| Priority | Meaning | Expected handling posture |
|---|---|---|
| critical | immediate risk to service safety, trust, or operational control | active owner now, commander if incident-shaped, freeze likely |
| urgent | meaningful risk to user trust, queue stability, or commercial coherence | route immediately, act in current session |
| important | bounded issue that still affects operator throughput or user experience | act within the normal SLA window |
| informational | visible but not action-blocking | track, summarize, and review in normal reporting |
| deferred | accepted non-urgent work or optimization | document and revisit intentionally |

## Scenario Mapping

| Scenario | Default priority | Why |
|---|---|---|
| simultaneous auth failures affecting multiple users or admin access | critical | blocks access and may require incident command |
| isolated auth failures with bounded user impact | urgent | trust-impacting but may not require freeze |
| billing-state mismatch across request, invoice, payment, and webhook | critical | commercial truth is unclear and requires escalation |
| normal manual billing backlog inside SLA | important | expected for controlled rollout while `manual_only` |
| moderation backlog rising past aging threshold | urgent | trust and queue health at risk |
| disputed moderation or visibility inconsistency | critical | public trust and policy correctness at risk |
| upload failures affecting multiple users or approved delivery | urgent | impacts publish flow and user trust |
| isolated upload failure with known workaround | important | bounded but still user-facing |
| repeated webhook failures or throttle bursts with invoice ambiguity | urgent | billing coherence and support pressure rise together |
| rollout regressions that challenge expand/hold confidence | urgent | decision-making quality is degraded |
| active incident with degraded mode or freeze under review | critical | coordination and blast radius dominate |
| support escalation showing repeated confusion but no runtime failure | important | product-trust signal, not necessarily incident |
| monitoring gap that removes confidence during active operations | urgent | visibility loss weakens safe decision-making |
| known noisy alert with no new action value | informational | should be tracked and improved, not treated as live fire |
| future tooling or reporting improvements | deferred | valuable, but not live operational work |

## Priority Override Rules

Increase priority when:

1. more than one queue is affected
2. backup coverage is unclear
3. public trust wording could become untruthful
4. degraded mode or freeze may be required
5. another operator would need to re-triage from zero

Decrease priority only when:

1. blast radius is clearly bounded
2. owner and next action are already assigned
3. user-facing truth remains intact
4. queue aging stays inside threshold

## Final Assessment

EXEC-34 establishes one priority language for runtime issues, queue work, and operator coordination. The point is not rigid taxonomy. It is making sure two operators looking at the same issue do not silently apply different urgency models.
