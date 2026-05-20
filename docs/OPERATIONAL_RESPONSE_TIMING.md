# Operational Response Timing

Last updated: `2026-05-20`  
Scope: `EXEC-39`

## Purpose

This timing baseline tracks whether response preparation is actually getting faster after orientation is complete.

## Timing KPIs

1. time-to-orientation
2. time-to-next-action
3. queue review latency
4. escalation preparation latency
5. incident review latency
6. moderation review latency
7. billing review latency

## Measurement Intent

1. time-to-orientation measures how long it takes to understand the system picture from the shared readiness surface
2. time-to-next-action measures how long it takes to identify the next specialist surface or confirmation step after orientation
3. queue review latency measures how long it takes to move from queue awareness to opening the correct item with enough context to review safely
4. escalation preparation latency measures how long it takes to prepare a handoff-ready escalation packet with ownership, unresolved state, and next checks
5. incident review latency measures how long it takes to move from incident hints to a coherent first investigation packet
6. moderation review latency measures how long it takes to move from backlog awareness to the first review that best reduces queue risk
7. billing review latency measures how long it takes to move from billing awareness to a manual-review packet that includes webhook risk and backlog age

## Success Condition

EXEC-39 is successful when these timings improve through better preparation and lower navigation cost, not through reduced human review rigor.
