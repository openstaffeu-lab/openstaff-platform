# Escalation Compression Model

Last updated: `2026-05-20`  
Scope: `EXEC-39`

## Purpose

This model defines the minimum packet needed to transfer an escalation in under 60 seconds without hiding uncertainty.

## Escalation Packet

Each packet should contain:

1. issue class
2. visible source timestamp
3. unresolved-state summary
4. current owner or owner gap
5. likely impacted flow
6. next checks
7. dependency hints
8. stale-state cue

## Escalation Snapshots

The response-prep layer may create a compact snapshot showing:

1. why the issue is still open
2. what is blocked
3. what changed recently
4. what still needs confirmation

## Incident Carryover

Carryover should preserve:

1. latest visible state
2. unresolved risks
3. already-completed checks
4. next intended check
5. owner continuity

## Freshness Rules

1. stale packets must be visibly marked
2. stale packets may orient, but may not be treated as final transfer truth
3. fresh packets still require operator confirmation

## Final Assessment

Escalation compression succeeds when the next operator can understand what is open, what is blocked, and what to check next in under a minute without inheriting false confidence or hidden authority.
