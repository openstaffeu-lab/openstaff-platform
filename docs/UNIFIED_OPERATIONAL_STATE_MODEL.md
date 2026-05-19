# Unified Operational State Model

Last updated: `2026-05-19`  
Scope: `EXEC-38`

## Purpose

This model defines the first shared operational state contract for OpenStaff. Its purpose is to reduce repeated operator reconstruction of the same runtime, queue, rollout, billing, escalation, and incident picture while keeping every meaningful decision human-owned.

## State Families

The unified operational state is composed of these visible families:

1. global operational state
2. queue state
3. rollout state
4. moderation state
5. billing state
6. escalation state
7. incident state
8. degraded-mode state
9. operator availability state

## State Definitions

### 1. Global Operational State

This is the top-level operator orientation label.

It summarizes whether the current platform posture appears:

1. `steady`
2. `watch closely`
3. `degraded attention`

It is derived from visible readiness warnings, readiness errors, queue pressure, failure bursts, and rollout-readiness reasons. It is advisory only.

### 2. Queue State

Queue state summarizes whether critical operator queues appear:

1. quiet
2. active review
3. overloaded

The first EXEC-38 implementation focuses on moderation, billing review, and support/escalation signals rather than pretending every queue is equally mature.

### 3. Rollout State

Rollout state summarizes whether the current rollout picture appears:

1. controlled rollout ready
2. hold and review
3. freeze review required

This state may orient review order, but it may not pause rollout, expand rollout, or change rollout mode automatically.

### 4. Moderation State

Moderation state summarizes:

1. pending volume
2. oldest pending age
3. aging bucket
4. confusion signals

It exists to compress review orientation, not to approve, reject, reprioritize, or route moderation work automatically.

### 5. Billing State

Billing state summarizes:

1. open review count
2. oldest open review age
3. webhook failure pressure
4. billing confusion signals

It may expose manual review pressure, but it may not activate billing, reconcile invoice state, or approve upgrades automatically.

### 6. Escalation State

Escalation state summarizes:

1. support backlog pressure
2. operator escalation count
3. repeated confusion
4. failed-flow pressure

It may orient attention, but it may not open or route escalations automatically.

### 7. Incident State

Incident state summarizes whether the current snapshot suggests:

1. no clear active incident signal
2. needs operator interpretation
3. urgent review

It may correlate and compress signals, but it may not declare an incident automatically or assign severity automatically.

### 8. Degraded-Mode State

Degraded-mode state shows whether the current snapshot suggests:

1. not indicated
2. review degraded-mode posture

This state exists only to reduce discovery overhead. It does not declare degraded mode automatically.

### 9. Operator Availability State

Operator availability state summarizes whether current visible signals suggest:

1. no visible overload hint
2. coverage pressure visible
3. overload review required

This state is intentionally derived from visible support, queue, and escalation indicators rather than hidden staffing models.

## Source-Of-Truth Hierarchy

The unified operational state must always respect this hierarchy:

1. active `/status` payload and visible `/health` response
2. specialist queue surfaces and authenticated admin state
3. current operator action history and handoff notes
4. historical reports and prior-session summaries

If a higher-priority source conflicts with a lower-priority source, the higher-priority source wins for orientation purposes.

## State Freshness Rules

The first operational compression layer uses the `/status.timestamp` field as its shared summary clock.

Freshness labels:

1. `fresh`: snapshot age `<= 15m`
2. `aging`: snapshot age `16m - 60m`
3. `stale`: snapshot age `> 60m`
4. `unknown`: timestamp unavailable or unparsable

Every compressed summary must remain visibly tied to the same snapshot time so operators can detect stale context quickly.

## Timestamp Ownership

Timestamp ownership rules:

1. the API owns the `/status.timestamp`
2. the admin compression layer may format that timestamp, but may not invent a newer summary time
3. specialist cards derived from `/status` inherit the same snapshot clock unless they render a stronger source explicitly
4. operator notes and handoff notes must preserve their own timestamps rather than being merged silently into the shared state clock

## Stale-State Handling

If the unified state becomes `aging`, the surface should:

1. keep rendering
2. show a visible freshness warning
3. keep wording advisory
4. encourage source re-check before escalation, severity, rollback, or rollout-state discussion

If the unified state becomes `stale`, the surface should:

1. show a stronger visible stale-state indicator
2. stop implying that summary ordering is current truth
3. direct operators back to `/health`, `/status`, and active queue surfaces
4. remain visible as orientation history rather than hiding the stale summary

## Conflicting-State Handling

Conflicts are expected and must be visible rather than hidden.

Examples:

1. queue pressure is quiet, but readiness errors are present
2. rollout looks ready, but billing webhook failures are climbing
3. auth failures are visible, but adoption conversion remains stable
4. support pressure is high, but incident posture is still unclear

Conflict-handling rules:

1. surface the conflict explicitly
2. preserve the higher-priority source of truth
3. avoid collapsing conflict into one opaque score
4. avoid stronger urgency wording than the visible evidence supports
5. require human interpretation before any escalatory action

## Authority Boundary

The unified state model may:

1. summarize
2. compress
3. correlate
4. prioritize
5. orient
6. route attention

It may not:

1. approve
2. reject
3. activate billing
4. escalate automatically
5. declare incidents automatically
6. assign severity automatically
7. change rollout state
8. perform rollback
9. modify production state autonomously

## Final Assessment

EXEC-38 introduces a shared operational state model so operators can see one coherent, timestamped, source-linked picture first and then drill into specialist surfaces second. The intent is compression without authority transfer.
