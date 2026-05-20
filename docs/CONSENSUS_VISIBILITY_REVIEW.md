# Consensus Visibility Review

Last updated: `2026-05-20`  
Scope: `EXEC-41`

## Purpose

This review defines how OpenStaff may surface agreement, disagreement, blocked review state, and stale consensus without pretending that a summary is equivalent to a human decision.

## Visibility Principles

1. all consensus visibility must remain advisory
2. all consensus visibility must remain explainable
3. all consensus visibility must remain timestamped
4. all consensus visibility must remain operator-attributed when attribution exists
5. missing consensus is itself an operational state and should not be hidden

## Agreement Indicators

1. operator agreement may be inferred only from visible aligned human actions or consistent recent review direction
2. agreement indicators must stay bounded and reversible when fresher evidence appears
3. agreement indicators may not be displayed as final authority

## Unresolved-Review Indicators

1. unresolved review indicators should remain visible when moderation, billing, escalation, rollout, or incident review is still pending
2. unresolved review indicators should make caution visible without implying blame
3. unresolved review indicators should help the next operator recover the open decision space faster

## Conflicting-Review Indicators

1. conflicting-review indicators should appear when visible human actions or interpretations no longer point in the same direction
2. conflict indicators should preserve both the disagreement and the need for human resolution
3. conflict indicators may not rank operators or choose the correct interpretation

## Stale-Consensus Indicators

1. stale-consensus indicators should appear when the visible decision context is old enough that current operator trust should drop
2. stale consensus should be treated as orientation support only
3. stale consensus must not be reused as if it were fresh operational truth

## Pending-Escalation Indicators

1. pending-escalation indicators should remain visible when transfer, dependency, or ownership clarity is incomplete
2. pending escalation should increase continuity pressure, not create automatic routing

## Blocked-Decision Indicators

1. blocked-decision indicators should remain visible when evidence, ownership, verification, or dependency gaps prevent a safe human decision
2. blocked-decision indicators should preserve what is missing, not just that a block exists
3. blocked-decision indicators should not silently convert into automatic escalation or rollback

## Dangerous Consensus Patterns

Consensus visibility becomes dangerous when:

1. timestamps are missing
2. attribution is missing but confidence language remains strong
3. disagreement is compressed away
4. stale context looks fresh
5. a grouped summary hides the raw queue or warning evidence operators still need

## Raw Evidence Requirements

Operators still require raw evidence when:

1. moderation approval or rejection is pending
2. billing state is ambiguous across request, invoice, payment, and entitlement state
3. escalation routing or ownership is disputed
4. rollout hold vs continue interpretation is disputed
5. incident or rollback interpretation materially affects trust, safety, or public behavior

## Final Assessment

Consensus visibility is useful only when it shortens reconstruction time while keeping disagreement, attribution, freshness, and raw evidence access visible enough for a human to make the real decision.
