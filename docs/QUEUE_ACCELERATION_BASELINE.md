# Queue Acceleration Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-39`

## Purpose

This baseline defines how queue handling time may be reduced without weakening review quality.

## Queue Acceleration Rules

1. highlight SLA risk using visible age and backlog signals
2. orient operators toward the oldest actionable item first
3. show grouped queue actions before deeper queue traversal
4. make stale-review risk visible
5. make repeated-review risk visible
6. show handoff and operator-load context where available

## Required Visibility

### SLA-Risk Highlighting

1. moderation backlog age
2. billing review age
3. support and escalation pressure
4. whether queue age implies review drift rather than only high demand

### Aging Acceleration

1. oldest visible item age
2. aging bucket
3. whether the queue is quiet, active, or overloaded

### Grouped Queue Actions

1. likely first item to open
2. likely first validation to perform
3. whether specialist queue traversal is needed immediately or only after packet review

### Stale-Review Visibility

1. stale snapshot risk
2. stale queue-age risk
3. repeated-confusion risk that may invalidate old notes

### Repeated-Review Detection

1. unresolved queue state
2. repeated escalation or repeated confusion indicators
3. queue stories likely being rebuilt by multiple operators

## Final Assessment

Queue acceleration is not faster approval. It is faster preparation for safe review.
