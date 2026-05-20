# Decision Support Signals

Last updated: `2026-05-20`  
Scope: `EXEC-40`

## Purpose

This baseline defines the advisory signals that help operators notice recurring operational patterns and unresolved carryover before they rebuild the same reasoning again.

## Signal Rules

Every signal must remain:

1. advisory
2. explainable
3. timestamped
4. source-linked

## Repeated-Failure Indicators

Repeated-failure indicators may surface:

1. repeated auth failures
2. repeated upload failures
3. repeated webhook failures
4. repeated rate-limit bursts

## Recurring Escalation Indicators

Recurring escalation indicators may surface:

1. repeated escalation events
2. repeated transfer without closure
3. repeated dependency carryover

## Repeated-Review Indicators

Repeated-review indicators may surface:

1. moderation re-review pressure
2. billing review reconstruction pressure
3. repeated rollout-state reconstruction

## Unresolved Dependency Indicators

These indicators may surface:

1. open billing dependency
2. open queue dependency
3. open runtime dependency
4. open rollout dependency

## Operator Overload Carryover

These indicators may surface:

1. repeated confusion burden
2. high support-signal carryover
3. unresolved review volume that threatens continuity quality

## Stalled-Resolution Indicators

These indicators may surface:

1. stale unresolved state
2. unresolved transfer with no fresh action
3. repeated blockage with no visible progress

## Degraded-Response Indicators

These indicators may surface:

1. response prep older than current source state
2. queue pressure plus overload pressure together
3. unresolved warning state plus transfer pressure together

## Final Assessment

Decision-support signals should help operators notice recurring patterns and continuity risks sooner. They are safe only when they remain visible, explainable, timestamped, and clearly non-authoritative.
