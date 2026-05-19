# Operator Workflow Consolidation

Last updated: `2026-05-19`  
Scope: `EXEC-33`

## Purpose

This review defines how operator workflows should be consolidated so moderation, billing, support, incident handling, rollout review, and release verification require less repeated context gathering.

## Current Fragmentation

Current operator work still crosses multiple surfaces:

1. `/status` and `/health` for runtime truth
2. admin moderation and billing queues for action state
3. support and feedback summaries for user-visible friction
4. dashboards and logs for incident confirmation
5. `STATUS.md` and governance docs for contract and decision context
6. proof and release scripts for verification evidence

## Repeated Friction

| Workflow | Duplicated context gathering | Repeated navigation or lookup | Fragmented surface |
|---|---|---|---|
| moderation | runtime state, queue state, public visibility expectations | moderation queue, public surface, trust/governance docs | medium |
| billing | request state, invoice state, payment state, rollout contract | billing queue, `/status`, support wording, readiness docs | high |
| rollout review | funnel counts, feedback themes, backlog, incidents, decision rules | `/status`, reports, scorecards, templates | high |
| support escalation | auth/upload/runtime state plus owner routing | support notes, `/status`, operator playbook, escalation path | high |
| incident handling | alert, runtime, owner, blast radius, rollback candidate | dashboards, logs, `/status`, incident runbook | high |
| production verification | service health, monitoring presence, backups, drift signals | scripts plus multiple operator checks | medium |
| release verification | builds, release-check, commit/push state, proof summary | local commands plus documentation update | medium |

## Ideal Consolidated Operator Workflow

An ideal operator path should let an operator answer three questions from one coordinated view:

1. what is broken or delayed
2. who owns the next action
3. what decision or escalation threshold applies

Minimum workflow shape:

1. check the shared operational context surface
2. identify affected queue, service, or cohort
3. confirm owner and backup owner
4. act, escalate, or freeze using the documented threshold
5. leave a handoff-ready summary without rebuilding the same narrative from scratch

## Required Shared Operational Context

Every operator should be able to see, without manual hunting:

1. current runtime state
2. moderation, billing, and support pressure indicators
3. current degraded mode or freeze state
4. active incident or escalation owner
5. queue aging and overload indicators
6. rollout band or cohort currently being served
7. next required operator action and fallback path

## Minimum Operator Visibility Set

The minimum shared visibility set for every active operator is:

1. `/status` runtime and rollout summaries
2. admin production-readiness summary
3. moderation backlog and aging
4. billing backlog and unresolved webhook state
5. support escalation and repeated confusion summary
6. active incident state and commander when relevant
7. handoff notes for the current monitoring window

## Final Assessment

OpenStaff already has the raw information needed for safe operations. The main remaining inefficiency is that operators still assemble the same context manually across too many surfaces before they can act with confidence.
