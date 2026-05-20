# Escalation Continuity Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-40`

## Purpose

This baseline defines how OpenStaff preserves escalation context between operators so transfer quality no longer depends on memory heroics or repeated rediscovery.

## Escalation Carryover Packets

Every escalation carryover packet should preserve:

1. issue class
2. current owner
3. backup owner when known
4. unresolved dependency
5. latest known next check
6. transfer timestamp
7. freshness state

## Unresolved-State Persistence

Escalation continuity must preserve unresolved state when:

1. the escalation is still open
2. the dependency is still blocking progress
3. the next operator would otherwise rebuild the same story

## Escalation Continuity Summaries

Escalation summaries should compress:

1. what already happened
2. what remains unresolved
3. what to check next
4. what dependency is blocking closure

They may not decide whether escalation should happen.

## Dependency Continuity

Dependency continuity should make visible:

1. queue dependency
2. runtime dependency
3. billing dependency
4. rollout dependency
5. owner dependency

## Ownership Continuity

Ownership continuity should show:

1. current escalation owner
2. whether backup coverage exists
3. whether a handoff note exists
4. whether current continuity depends on one operator only

## Timeline Continuity

Timeline continuity should remain bounded.

The continuity layer should preserve:

1. last visible action
2. latest transfer
3. latest unresolved blocker
4. latest recommended next check

The continuity layer should not render an infinite event history.

## Stalled-Escalation Indicators

Indicators should remain advisory, explainable, timestamped, and source-linked.

Stalled-escalation indicators include:

1. unresolved dependency with no fresh owner action
2. repeated transfer without visible progress
3. stale continuity packet
4. overload carryover that threatens explanation quality

## Final Assessment

Escalation continuity is successful when the next operator inherits the same issue picture, unresolved dependencies, and likely next checks without inheriting automatic escalation authority.
