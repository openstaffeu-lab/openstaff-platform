# Operational Accountability Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-41`

## Purpose

This baseline defines who owns decisions, who owns verification, who owns escalation, and how accountability remains visible across moderation, billing, incident response, rollout review, and rollback review.

## Accountability Principles

1. accountability must stay human-owned
2. accountability must stay visible across handoffs
3. shared ownership may improve resilience, but it may not erase the accountable operator
4. the platform may preserve accountability chains, but it may not assign them automatically

## Accountability Chains

### Operator accountability chain

1. the acting operator owns the current human decision
2. the next reviewing operator owns revalidation if freshness or disagreement risk exists
3. the queue or incident owner owns continuity quality across shifts and escalations

### Escalation accountability

1. the current escalation owner owns transfer clarity
2. the receiving owner owns acceptance and next review
3. unresolved transfer ambiguity remains an explicit risk until a human resolves it

### Moderation accountability

1. moderation owner owns final approve, reject, or defer decisions
2. verification owner confirms resulting visibility state when needed
3. advisory summaries may reduce repetition, but they may not approve or reject content

### Billing accountability

1. billing owner owns manual review and entitlement-related decisions
2. verification owner confirms invoice, payment, webhook, and subscription state coherence
3. platform summaries may preserve ambiguity, but may not resolve commercial authority

### Incident accountability

1. incident owner owns active coordination and incident interpretation
2. verifier owns freshness and evidence re-check when the snapshot ages
3. escalation or rollback review must remain attributable to named human action

### Release accountability

1. release owner owns the release decision path
2. verifier owns validation and blocker confirmation
3. rollback approver remains a human authority role

### Rollback accountability

1. requester owns rollback review initiation
2. approver owns rollback approval or rejection
3. verifier owns confirmation of rollback outcome or continued hold state

## Ownership Clarifications

1. decision ownership belongs to the human who confirms the action
2. verification ownership belongs to the human who checks whether the expected state actually holds
3. escalation ownership belongs to the human currently responsible for transfer or expanded review
4. rollback approval belongs to explicitly human governance
5. degraded-mode declaration belongs to explicitly human governance

## Visibility Requirements

1. accountability visibility must stay grouped and bounded
2. accountability visibility must avoid operator scoring
3. accountability visibility must avoid noisy audit spam
4. accountability visibility must remain understandable from the main readiness surface

## Final Assessment

Operational accountability is healthy when any later operator can tell who decided, who verified, who escalated, and what still lacks an accountable human owner without the system silently inventing that chain.
