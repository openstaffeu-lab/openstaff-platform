# Scale Readiness Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-30`

## Purpose

This baseline defines when controlled rollout can expand and when it must hold, freeze, or roll back.

## First 10 Users

Operational expectation:

1. support remains high-touch
2. moderation remains manually triaged
3. upgrade requests remain operator-reviewed
4. same-day human follow-up remains possible

Expansion criteria:

1. no adoption-readiness category is `red`
2. moderation oldest pending age stays under one business day
3. upgrade oldest open age stays under one business day
4. support pressure remains understandable and staffed

## First 25 Users

Operational expectation:

1. support is still personal, but not fully improvised
2. queue ownership is explicit every day
3. repeated confusion is now logged and reviewed
4. cohort review becomes mandatory before expansion

Expansion criteria:

1. cohort review ends in `expand`
2. register and publish conversion remain explainable
3. moderation and billing do not create hidden operator rescue work
4. no recurring trust/copy contradiction remains open

## First 50 Users

Operational expectation:

1. backlog metrics are actively watched
2. support routing and escalation discipline are stable
3. product iteration starts reducing repeated manual explanation
4. automation candidates become visible

Expansion criteria:

1. onboarding and publish friction are understood, not only observed
2. backlog aging does not trend upward cohort over cohort
3. operational feedback is being triaged, not merely collected
4. release freezes are used when product trust needs protection

## First 100 Users

Operational expectation:

1. support remains controlled, but no longer fully ad hoc
2. moderation and billing throughput become the main scaling constraints
3. operator handoff discipline is routine
4. adoption decisions rely on scorecard plus cohort report, not intuition

Expansion criteria:

1. no unresolved `fix-first` items remain open from the previous cohort review
2. billing/manual-commercial burden is still truthful and supportable
3. technical and operator noise do not hide real adoption signals
4. the next expansion does not depend on undisclosed operator heroics

## Bottleneck Matrix

| Area | Current scaling limit | Trigger |
|---|---|---|
| moderation | manual queue review | backlog grows faster than daily clearance |
| billing | manual approval and invoice follow-up | upgrade requests exceed same-day acknowledgement capacity |
| support | operator handoff and explanation work | repeated confusion or unresolved ownership keeps recurring |
| technical ops | manual issue triage | recurring auth, upload, webhook, or visibility failures |

## Freeze Thresholds

Freeze controlled growth when:

1. `/health` or `/status` degrade
2. moderation or billing surfaces stop being usable
3. support cannot explain the real user state with confidence
4. support or feedback pressure is rising faster than operators can absorb

## Rollback Thresholds

Roll back or pause growth when:

1. approved content is no longer reliably public
2. pending or rejected content leaks publicly
3. commercial state becomes misleading or non-auditable
4. operational truth depends on unsupported manual improvisation

## Final Assessment

OpenStaff is now ready to scale through explicit cohort bands rather than only a generic first-user model. The system can continue controlled growth when cohort reviews, backlog aging, and trust signals all remain inside the documented thresholds.
