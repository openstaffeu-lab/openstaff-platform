# Multi-Operator Readiness

Last updated: `2026-05-19`  
Scope: `EXEC-33`

## Purpose

This baseline defines how OpenStaff should operate when more than one operator shares moderation, billing, support, incident, and rollout responsibilities.

## Shared Ownership Expectations

1. every critical queue has a named primary owner and a named backup owner
2. every active incident has a named incident commander and a named alternate
3. no critical workflow should depend on one person remembering unwritten context

## Operator Handoff Rules

Handoffs must include:

1. current runtime mode: normal, degraded, or frozen
2. open moderation, billing, support, or incident items requiring action
3. owner and backup owner for each unresolved item
4. next action, escalation threshold, and known blockers

## Shift Continuity Expectations

1. another trained operator must be able to continue safely from the handoff alone
2. unresolved queue items should not require private memory to interpret
3. repeated confusion themes should be carried forward as operational context, not rediscovered from scratch

## Escalation Transfer Expectations

1. transferred escalations must include the classification already reached
2. the receiving operator should not have to re-triage a well-understood issue from zero
3. the transfer should name whether the problem is queue pressure, runtime degradation, trust regression, or data inconsistency

## Moderation Coordination

1. moderation owners share queue-aging rules and rejection-explanation standards
2. unusual or disputed moderation cases are escalated, not improvised independently
3. batching or sequencing decisions should be explainable to another operator

## Billing Coordination

1. billing owners share the same commercial truth for `manual_only` flows
2. upgrade request, invoice, payment, and webhook state must be visible enough for backup handling
3. no operator should need private context to know whether a user is waiting on acknowledgement, review, invoice, or reconciliation

## Incident Commander Expectations

1. assign severity, owner, and backup owner explicitly
2. decide when a degraded mode or freeze must be declared
3. keep updates short, actionable, and handoff-ready
4. preserve rollback authority and communication discipline

## Single-Operator Risk Reductions

1. duplicate critical knowledge in docs and handoff notes
2. keep queues and incident state visible in shared surfaces
3. treat missing backup coverage as an operational risk, not as normal hustle

## Knowledge Replication Requirements

1. more than one operator must understand moderation coordination
2. more than one operator must understand billing queue handling
3. more than one operator must understand runtime triage entrypoints
4. more than one operator must understand deploy, rollback, and release verification expectations

## Required Operational Redundancy

At minimum, controlled rollout should maintain redundancy for:

1. moderation
2. billing review
3. support escalation routing
4. incident command
5. release verification and rollback awareness

## Final Assessment

OpenStaff is no longer only a single-operator discipline problem. EXEC-33 makes multi-operator continuity explicit so speed can improve without replacing one hidden dependency with two confused operators.
