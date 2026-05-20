# Operational Response Signals

Last updated: `2026-05-20`  
Scope: `EXEC-39`

## Purpose

This baseline defines the response signals that matter once orientation is complete and the operator is deciding whether work is blocked, stalled, overloaded, or stale.

## Response Signals

### Blocked-State Signals

1. readiness blockers
2. webhook failures that can stall billing review prep
3. upload failures that can distort moderation intake and publish triage
4. simultaneous support pressure and escalation pressure

### Stalled-Review Signals

1. oldest moderation item beyond review threshold
2. oldest billing review beyond review threshold
3. unresolved warnings and errors with no visible closure

### Overloaded-Operator Signals

1. high support backlog signals
2. repeated confusion reports
3. repeated escalations
4. multiple active queues with aging pressure

### Stale-Incident Signals

1. stale snapshot age
2. old handoff notes that may not match current pressure
3. unresolved risk statements with no fresh source confirmation

### Degraded-Response Signals

1. blockers plus queue pressure
2. queue pressure plus missing continuity
3. warnings plus overload indicators

### Escalation Saturation Signals

1. repeated escalation volume
2. unresolved escalation carryover
3. support pressure plus dependency ambiguity

### Rollout-Pressure Signals

1. readiness warnings
2. adoption-readiness reasons
3. queue pressure that undermines a nominally healthy rollout snapshot

## Guardrail

These signals may inform routing and preparation. They may not trigger automatic mitigation, escalation, or rollback.
