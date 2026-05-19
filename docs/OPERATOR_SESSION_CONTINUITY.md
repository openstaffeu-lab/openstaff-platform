# Operator Session Continuity

Last updated: `2026-05-19`  
Scope: `EXEC-34`

## Purpose

This baseline defines how one operator session should continue into the next so unresolved work, active incidents, and queue pressure do not depend on private memory.

## Session Continuity Principles

1. another operator must be able to continue safely from the handoff alone
2. unresolved items must retain their current classification and next action
3. carryover should preserve context, not recreate it
4. continuity should expose ownership gaps early

## Minimum Handoff Package

Every session handoff should include:

1. current runtime mode
2. active incidents and commander state
3. unresolved moderation items
4. unresolved billing items
5. unresolved support or escalation items
6. queue-aging risks
7. current freeze or degraded-mode state
8. next actions and blockers
9. owner and backup owner for critical work

## Shift Continuation Rules

1. handoff notes should be readable without opening multiple other narratives first
2. the incoming operator should know what is already classified
3. the incoming operator should know which items are waiting on another owner
4. the incoming operator should know which thresholds are close to crossing

## Incident Carryover

For unresolved incidents, carry over:

1. severity
2. incident commander and alternate
3. current coordination state
4. current rollback state
5. mitigation in progress
6. next decision point

## Moderation Carryover

For moderation carryover, include:

1. oldest unresolved items
2. unusual or disputed items
3. trust-impacting public-visibility concerns
4. queue-aging trend
5. whether batching is safe or not

## Billing Carryover

For billing carryover, include:

1. oldest unresolved upgrade requests
2. invoice or payment coherence risks
3. unresolved webhook follow-up
4. promised user follow-up still pending
5. whether backup billing coverage is active

## Escalation Carryover

For escalation carryover, include:

1. issue class already reached
2. who currently owns the escalation
3. whether the escalation is blocked, transferred, or active
4. what evidence has already been gathered
5. the next action expected from the receiving owner

## Session Failure Signals

Treat the session continuity model as failing when:

1. incoming operators re-triage known issues from zero
2. unresolved items lose owner clarity across handoff
3. queue aging grows during session changes
4. private memory is required to continue safely

## Final Assessment

EXEC-34 turns session continuity into a first-class operational baseline. The main goal is not more documentation for its own sake. It is making sure every session starts from a shared carryover packet instead of a fresh reconstruction exercise.
