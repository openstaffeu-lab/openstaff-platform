# Shared Operational Memory Model

Last updated: `2026-05-20`  
Scope: `EXEC-40`

## Purpose

This model defines how OpenStaff may preserve operational context, unresolved state, prior reasoning, and handoff-ready carryover without turning memory into hidden authority.

## Memory Lifecycle

The shared operational memory lifecycle is:

1. source capture from visible queue, readiness, incident, rollout, and operator-action surfaces
2. compression into bounded operator-readable summaries
3. carryover persistence for unresolved and handoff-relevant state
4. freshness review against timestamps and current source-of-truth hierarchy
5. operator confirmation, correction, or rejection
6. retirement when the underlying issue is resolved or stale enough to lose trust

## Memory Domains

### Incident Memory

Incident memory may preserve:

1. affected systems
2. likely impacted flows
3. prior mitigations checked
4. unresolved blockers
5. next recommended checks
6. current owner and backup owner

Incident memory may not:

1. assign severity automatically
2. declare an incident automatically
3. trigger rollback automatically

### Escalation Memory

Escalation memory may preserve:

1. escalation reason
2. transfer owner
3. unresolved dependency
4. timeline continuity
5. latest known next step
6. stalled or stale transfer indicators

Escalation memory exists to reduce rediscovery, not to open, route, or close escalations automatically.

### Moderation Memory

Moderation memory may preserve:

1. queue aging
2. repeated confusion patterns
3. oldest unresolved item class
4. recent review actions
5. carryover notes for unusual or blocked cases

Moderation memory may not approve or reject content automatically.

### Rollout Memory

Rollout memory may preserve:

1. adoption-readiness reasons
2. recent rollout warnings
3. repeated friction themes
4. prior review conclusions
5. unresolved rollout blockers

Rollout memory may not change rollout state automatically.

### Billing Review Memory

Billing review memory may preserve:

1. open review pressure
2. oldest unresolved review age
3. webhook failure carryover
4. prior follow-up attempts
5. unresolved coherence risks across request, invoice, payment, and subscription state

Billing review memory may not activate billing automatically.

## Unresolved-State Persistence

Shared memory should persist unresolved state only when the unresolved item still affects safe operator review.

Shared memory should preserve:

1. unresolved moderation review
2. unresolved billing review
3. unresolved escalation dependency
4. unresolved incident warning
5. unresolved rollout blocker

Shared memory should drop resolved state once:

1. the underlying queue item is resolved
2. the warning condition clears
3. the escalation transfer closes
4. the carryover item becomes stale enough to require full revalidation

## Carryover Persistence

Carryover persistence exists so a later operator can recover the same operational picture without rebuilding it from scratch.

Carryover packets should preserve:

1. what changed last
2. what remains unresolved
3. what dependency is blocking progress
4. who owns the next check
5. when the memory was last refreshed

## Operator Handoff Persistence

Handoff persistence must support shift changes and temporary ownership transfers.

Handoff memory should make visible:

1. last visible operator action
2. unresolved item set
3. next recommended checks
4. freshness age
5. owner continuity risk

## Freshness Rules

1. memory derived from the active `/status` snapshot inherits that snapshot timestamp
2. memory under `15m` old is `fresh`
3. memory `16m` to `60m` old is `aging`
4. memory older than `60m` is `stale`
5. stale memory remains orientation support only until a newer source snapshot is confirmed

## Stale-Memory Handling

When memory is stale:

1. show that state visibly
2. keep the summary advisory-only
3. require revalidation against source surfaces
4. prevent stale carryover from sounding like confirmed current truth

## Conflict Resolution

The source-of-truth hierarchy is:

1. current visible queue and readiness source surfaces
2. current authenticated operator actions
3. compressed memory summaries
4. older handoff notes

If memory conflicts with live source state, operators must trust the live source state and either refresh or discard the stale memory.

## Authority Ownership

Shared operational memory may:

1. summarize
2. preserve context
3. compress prior reasoning
4. surface unresolved state
5. suggest likely next checks

Shared operational memory may not:

1. make decisions automatically
2. assign severity automatically
3. approve moderation automatically
4. activate billing automatically
5. escalate automatically
6. rollback automatically
7. mutate production state autonomously

## Audit Visibility

Shared memory must remain audit-visible by keeping:

1. visible timestamps
2. visible source linkage
3. visible unresolved-state cues
4. visible prior-action references when available
5. visible authority boundaries

## Final Assessment

The shared operational memory layer exists to preserve operator context between reviews, sessions, and shifts. It is useful only when it reduces repeated reasoning while leaving judgment, authority, and production mutation fully human-owned.
