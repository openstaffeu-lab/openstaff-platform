# Admin Tooling Gap Review

Last updated: `2026-05-19`  
Scope: `EXEC-33`

## Purpose

This review identifies where admin and operator tooling is still thin relative to the speed and coordination required for sustainable multi-operator operations.

## Tooling Gaps

| Area | Classification | Notes |
|---|---|---|
| moderation batching | important | queue sequencing and repeated actions still rely on item-by-item handling |
| approval queue filtering | important | stronger filters for aging, repeated submitter friction, and escalation state would reduce triage time |
| billing review tooling | critical | billing-state coherence and unresolved follow-up still need faster review surfaces |
| escalation tooling | critical | owner assignment, transfer state, and next-action visibility are still too implicit |
| incident visibility | critical | active incident, degraded mode, and freeze state should be easier to consume alongside operator queues |
| audit searchability | important | audit trails exist, but faster retrieval would reduce repeated manual lookup |
| support tooling | important | repeated confusion, first-response state, and escalation aging need cleaner shared visibility |
| rollout review tooling | future optimization | structured review inputs exist, but more automation can prepare them faster |

## Highest-Priority Gaps

1. billing review tooling
2. escalation tooling
3. incident visibility

These are highest priority because they compound both reaction-time and coordination problems.

## Important But Secondary Gaps

1. moderation batching
2. approval queue filtering
3. audit searchability
4. support tooling

## Future Optimization

1. rollout review preparation tooling
2. richer batch reporting and proof assembly helpers

## Final Assessment

OpenStaff's governance is ahead of its operator tooling. The next major leverage comes from making the operator surfaces easier to navigate and easier to share, not from weakening the required reviews.
