# Coordination Governance Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-41`

## Purpose

This baseline defines how operators share responsibility, transfer ownership, handle coordination conflicts, and keep authority visible while the platform remains advisory-only.

## Shared Ownership Rules

1. every critical queue or incident path must have a clearly understood primary owner
2. a secondary owner must be visible or implied for handoff resilience, escalation continuity, and degraded-mode coverage
3. shared ownership exists to reduce blind spots, not to erase accountability
4. grouped coordination summaries may surface the ownership shape, but they may not invent owners

## Primary vs Secondary Responsibility

### Primary operator responsibility

1. drives the current review or response path
2. confirms the next human action
3. records the current rationale or carryover summary
4. ensures unresolved blockers remain visible

### Secondary operator responsibility

1. preserves continuity when the primary owner is overloaded, unavailable, or handing off
2. verifies that unresolved state and rationale remain understandable
3. challenges stale or conflicting summaries when needed
4. does not silently inherit final authority without explicit human transfer

## Ownership Transfer Rules

### Escalation ownership transfer

1. transfer must preserve prior owner, next owner, unresolved blocker, and next check
2. transfer must remain visible as a human event, not an automatic routing outcome
3. transfer may compress notes, but it may not hide disagreement or uncertainty

### Review ownership

1. moderation, billing, escalation, rollout, and incident reviews must preserve who is actively reviewing now
2. if active review ownership is unclear, the ambiguity itself is an operational risk that should stay visible

### Queue ownership

1. queue ownership must remain explainable by role and current review path
2. queue visibility may highlight stale, blocked, or overloaded review states
3. queue visibility may not silently reprioritize human authority

### Handoff governance

1. handoff must preserve unresolved state, next check, and active caution areas
2. handoff must preserve what is known, what is assumed, and what is still disputed
3. handoff quality matters more than narrative completeness

## Coordination Conflict Handling

1. disagreements must remain attributable and timestamped
2. conflicting interpretations must remain visible until a human resolves them
3. the platform may summarize the conflict, but it may not resolve the conflict
4. if disagreement materially affects moderation, billing, escalation, rollout, or rollback safety, specialist review must stay explicit

## Authority Hierarchy

1. functional queue owner holds queue-specific review authority
2. escalation owner holds escalation-transfer authority for the active path
3. incident owner or Technical Ops lead holds incident coordination authority
4. rollback approval remains human-owned and explicitly governed
5. degraded-mode declaration remains human-owned
6. platform summaries may clarify the hierarchy, but may not assign it automatically

## Emergency Override Rules

1. emergency override remains a human coordination mechanism, not a system behavior
2. emergency override must remain attributable, timestamped, and reviewable
3. emergency override may supersede a prior review path, but it may not erase the prior trace

## Degraded-Mode Coordination

1. degraded-mode review must preserve who declared it, who verified it, and what remains unresolved
2. degraded-mode visibility must stay active until a human confirms recovery or a new state
3. the platform may surface degraded-mode pressure, but it may not declare degraded mode on its own

## Rollback Coordination

1. rollback review must preserve who requested review, who approved or denied it, and what evidence was considered
2. unresolved rollback disagreement must stay visible until a human closes it
3. the platform may suggest rollback review pressure, but it may not trigger rollback

## Release Coordination

1. release review must preserve owner, verifier, blocker visibility, and rollback readiness
2. release coordination summaries may compress validation and continuity state
3. release coordination summaries may not silently convert warnings into approval

## Final Assessment

Coordination governance succeeds when multiple operators can act from the same bounded picture of ownership, rationale, disagreement, and next checks without the system choosing winners, owners, or outcomes for them.
