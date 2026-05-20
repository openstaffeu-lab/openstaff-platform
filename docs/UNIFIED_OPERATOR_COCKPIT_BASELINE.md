# Unified Operator Cockpit Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-40`

## Purpose

This baseline defines the first unified operational cockpit shape for OpenStaff so operators can orient, triage, coordinate, and hand off from one shared command surface instead of rebuilding the same operational picture across many tools.

## Why A Unified Cockpit Is Needed

OpenStaff already has:

1. rollout visibility
2. production readiness visibility
3. moderation and billing action surfaces
4. incident and alert governance
5. handoff and continuity rules

The remaining gap is that these truths still live across fragmented surfaces. EXEC-38 closed the first part of that gap by introducing a compressed orientation layer inside the live readiness page. EXEC-39 closed the next part by adding response-preparation guidance on the same surface. EXEC-40 closes the next part by adding shared operational memory and bounded decision-support on the same surface. The cockpit baseline is therefore no longer only a target model; it now also includes a first implemented intelligence slice, a first implemented actionability slice, and a first implemented continuity slice.

## Target Cockpit Sections

The unified cockpit should present the following sections in one operator-facing model:

1. operational state banner
2. priority work queue summary
3. incident and alert summary
4. rollout and adoption summary
5. queue aging and latency summary
6. ownership and coordination summary
7. action log and handoff summary
8. compressed operator orientation layer
9. response-preparation layer
10. shared operational memory and decision-support layer

## Priority Ordering

The cockpit should order information by action urgency, not by system ownership.

1. current operational mode: `normal`, `degraded`, `frozen`
2. active critical or urgent incidents
3. unresolved moderation, billing, support, and escalation pressure
4. auth, upload, and webhook failure signals
5. rollout and adoption pressure indicators
6. production readiness and monitoring posture
7. handoff and continuity notes
8. freshness and stale-state visibility
9. grouped next-action preparation
10. operational memory and carryover visibility

## Compression Layer

The first live cockpit-aligned implementation is a compressed operator orientation layer on `/admin/production-readiness`.

It must show:

1. a priority stack
2. a unified operational state block
3. grouped operational summaries
4. grouped queue summaries
5. grouped rollout summaries
6. grouped incident summaries
7. freshness and stale-state handling
8. quick orientation
9. queue acceleration
10. escalation readiness
11. blocked-state indicators
12. stale-action indicators
13. unresolved-review indicators
14. grouped next-action summaries
15. operational memory summaries
16. escalation continuity
17. unresolved-state carryover
18. recurring issue summaries
19. repeated-failure summaries
20. operator handoff summaries
21. grouped operational history

It exists to reduce re-triage, not to replace deeper queue or incident review.

## Required Sections

### 1. Operational State Banner

Must show:

1. runtime status from `/status` and `/health`
2. current operational mode
3. current rollout band or active cohort
4. whether a freeze is active
5. whether an incident commander is assigned

### 2. Priority Work Queue Summary

Must show:

1. moderation backlog and aging
2. billing backlog, unresolved invoice state, and webhook failures
3. support escalation pressure
4. upgrade aging
5. incident review and rollout review backlog

### 3. Incident And Alert Summary

Must show:

1. active incidents by severity
2. top actionable alerts
3. duplicated or suppressed alert context when relevant
4. whether degraded mode has been declared
5. current rollback candidate or rollback state when relevant

### 4. Rollout And Adoption Summary

Must show:

1. onboarding funnel signals
2. auth-failure and upload-failure pressure
3. support confusion themes
4. moderation aging and upgrade aging
5. adoption-readiness and rollout-decision signals

### 5. Queue Aging And Latency Summary

Must show:

1. moderation response time
2. billing review response time
3. support first-response time
4. incident acknowledgment time
5. escalation routing time
6. operator handoff time

### 6. Ownership And Coordination Summary

Must show:

1. primary and backup owner for each critical queue
2. active incident commander and alternate
3. escalations in transfer
4. unresolved items without owner coverage
5. current handoff package status
6. whether shared memory carryover is fresh enough to trust for a new shift

### 7. Action Log And Handoff Summary

Must show:

1. last operator-visible state changes
2. open blockers
3. next required actions
4. carryover items for next session
5. proof and audit references when relevant
6. bounded operational history and shared carryover state

## Operator Personas

The cockpit should work for these operator personas:

1. Technical Ops: runtime, incidents, alert routing, rollback, readiness
2. moderation owner: queue backlog, aging, unusual cases, public-visibility risk
3. billing owner: upgrade queue, invoice/payment coherence, webhook risk
4. support owner: repeated confusion, escalation pressure, first-response risk
5. incident commander: severity, blast radius, owner routing, mitigation, freeze state
6. release verifier: readiness, guard rails, validation status, unresolved risks

## Role-Specific Visibility

| Persona | Must see first | Secondary context |
|---|---|---|
| Technical Ops | incidents, alerts, runtime mode, rollback state | rollout pressure, queue impact |
| moderation owner | moderation aging, trust-impact items, unusual cases | runtime mode, support pressure |
| billing owner | upgrade aging, invoice/payment coherence, webhook failures | rollout contract, support pressure |
| support owner | support backlog, repeated confusion, escalation routing | auth/upload issues, rollout impact |
| incident commander | severity, blast radius, owners, degraded mode, mitigation state | queue disruption, freeze pressure |
| release verifier | readiness, validation state, incident/freeze state | queue pressure and continuity risk |

## Escalation Visibility

The cockpit must make escalation visible without opening separate narrative threads.

It should show:

1. issue class
2. current severity or priority
3. escalation owner
4. time since escalation
5. transfer state
6. next action
7. escalation threshold that was crossed

## Coordination Visibility

The cockpit must support coordinated multi-operator execution by showing:

1. who is actively handling what
2. where backup ownership is missing
3. which items are safe to batch
4. which items are blocked on escalation
5. which queues are approaching freeze conditions
6. whether handoff notes are current enough for session change

## Minimum Cockpit Contract

The first baseline does not require a single implemented UI yet. It requires that the operating model converge on one shared command-surface contract:

1. one shared operational state
2. one shared queue-priority view
3. one shared incident timeline model
4. one shared owner-and-backup model
5. one shared handoff package model
6. one shared freshness model for compressed operational summaries
7. one shared carryover model for unresolved state and handoff continuity

## Final Assessment

EXEC-34, EXEC-38, EXEC-39, and EXEC-40 together define the current unified operator cockpit baseline. The most important change is not cosmetic centralization. It is giving every operator the same operational picture, priority ordering, freshness state, coordination state, carryover state, and next-action preparation fast enough to reduce re-triage, repeated decision reconstruction, and response friction without weakening review, trust, or rollback discipline.
