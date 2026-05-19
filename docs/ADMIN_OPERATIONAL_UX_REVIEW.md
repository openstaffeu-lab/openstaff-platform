# Admin Operational UX Review

Last updated: `2026-05-19`  
Scope: `EXEC-34`

## Purpose

This review assesses how well the current admin operational UX supports triage, queue work, escalation, and coordinated multi-operator operation.

## Review Criteria

The review focuses on:

1. discoverability
2. navigation depth
3. queue clarity
4. action clarity
5. status clarity
6. escalation clarity
7. overload risk

## UX Assessment

| Surface or flow | Assessment | Main friction |
|---|---|---|
| production readiness page | strong base summary | not yet a full command surface for queue and incident state |
| moderation queue flow | usable but fragmented | queue work still requires cross-checking aging, trust impact, and handoff state |
| billing flow | highest-friction area | commercial truth is spread across request, invoice, payment, webhook, and wording context |
| support and escalation visibility | partial | repeated confusion and escalation transfer state are not yet centralized enough |
| incident visibility | partial | runtime and alert signals exist, but admin UX does not yet centralize active incident command state |
| rollout review visibility | partial | rollout and adoption signals exist, but still require synthesis across summaries and docs |

## Highest-Friction Flows

1. billing review because operators still piece together request, invoice, payment, and webhook state manually
2. escalation transfer because ownership and already-reached classification are not centralized enough
3. incident orientation because operators still move between readiness, dashboards, and logs to build one story

## Highest-Risk Confusion Surfaces

1. any place where manual billing truth must be restated from memory
2. any queue item that does not show age, owner, and next action together
3. any incident-shaped problem where degraded mode or freeze state is not visible in the same surface
4. any support issue that looks isolated but is actually part of a repeated confusion family

## Future Cockpit Candidates

The strongest candidates for future unified cockpit implementation are:

1. readiness plus queue pressure banner
2. active incident and alert summary
3. shared ownership and handoff module
4. billing coherence summary
5. moderation aging and trust-impact summary
6. support and escalation pressure summary

## Final Assessment

The current admin UX is operationally usable, but it is still shaped like several good specialist tools rather than one coordinated command surface. EXEC-34 defines the next UX target: lower navigation depth, clearer action ordering, and shared visibility for coordination state.
