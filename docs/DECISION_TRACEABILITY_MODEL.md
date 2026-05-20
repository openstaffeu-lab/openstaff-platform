# Decision Traceability Model

Last updated: `2026-05-20`  
Scope: `EXEC-41`

## Purpose

This model defines how OpenStaff preserves decision context, rationale, attribution, and disagreement visibility without allowing the platform to choose an outcome, assign authority automatically, or mutate production state autonomously.

## Operational Decision Lifecycle

1. orientation: the operator reviews the freshest visible queue, readiness, incident, and carryover state
2. preparation: the platform may summarize prior actions, unresolved state, rationale fragments, and likely next checks
3. active review: the operator inspects raw evidence, specialist surfaces, and current ownership context
4. tentative decision state: a likely direction may be visible, but it remains non-authoritative until a human confirms it
5. confirmation: the accountable operator records or applies the human decision in the appropriate specialist flow
6. verification: a human confirms whether the expected queue, rollout, moderation, billing, escalation, or incident state actually changed
7. carryover: unresolved rationale, disagreement, and verification gaps remain visible for the next operator instead of being silently dropped

## Domain Traceability

### Moderation decision traceability

1. preserve who reviewed the item
2. preserve when the review happened
3. preserve why approval, rejection, or deferment was chosen
4. preserve whether any conflicting interpretation remains unresolved
5. preserve whether verification of the public or hidden state is still pending

### Escalation decision traceability

1. preserve who prepared or transferred the escalation
2. preserve current owner, prior owner, and reason for transfer
3. preserve the unresolved dependency or blocker that forced escalation
4. preserve the next human check expected after transfer
5. preserve whether the escalation path itself is still disputed

### Billing-review traceability

1. preserve who reviewed the request or invoice state
2. preserve why manual follow-up, hold, reconciliation, or escalation was chosen
3. preserve whether webhook, invoice, and entitlement state still disagree
4. preserve whether billing ambiguity remains unresolved across shifts

### Rollout-decision traceability

1. preserve who decided hold, expand, fix-first, or continue-monitoring
2. preserve the warnings, readiness reasons, and queue state seen at decision time
3. preserve whether the rollout interpretation is still fresh enough to trust
4. preserve any unresolved disagreement about rollout pressure or readiness

### Incident-response traceability

1. preserve who reviewed the incident state
2. preserve the visible warnings, affected flows, and next checks used for orientation
3. preserve whether severity interpretation or escalation path is still disputed
4. preserve what remains unverified before the next operator acts

### Rollback-decision traceability

1. preserve who recommended rollback review
2. preserve who approved or rejected rollback review
3. preserve the rationale and evidence used for that human decision
4. preserve whether rollback remained pending, rejected, or superseded by another response path

## Persistence Rules

### Rationale persistence

1. rationale summaries may preserve why a human leaned toward a decision
2. rationale summaries must stay bounded and source-linked
3. rationale summaries may not be treated as automatic truth when fresh evidence disagrees

### Timestamp ownership

1. every decision summary must remain visibly timestamped
2. freshness must be attributable to the source snapshot, not inferred optimistically
3. stale decision context must be marked as review support only

### Operator attribution

1. operator-visible actions must remain attributable to a human actor when available
2. role visibility must support accountability without turning into operator scoring
3. grouped action history may compress repeated actions, but it may not erase attribution

### Unresolved disagreement handling

1. disagreements must stay visible until a human resolves or supersedes them
2. the platform may surface conflicting interpretations, but it may not choose the correct one
3. unresolved disagreement must increase caution, not create silent consensus

### Stale-decision handling

1. stale decisions remain useful only as orientation support
2. stale rationale must trigger revalidation against live queue, warning, and owner context
3. stale decision traces may not be used to imply current authority

### Audit retention

1. decision traces must stay visible long enough to support handoff, escalation, and review reconstruction
2. compression may reduce scanning effort, but it may not erase the existence of prior human action
3. retention must favor accountability and auditability over cosmetic cleanliness

## Authority Boundaries

1. decision traceability may summarize decisions, rationale, continuity, and disagreement
2. decision traceability may not resolve conflict automatically
3. decision traceability may not assign authority automatically
4. decision traceability may not escalate automatically
5. decision traceability may not rollback automatically
6. decision traceability may not override a human decision

## Final Assessment

Decision traceability is valuable only when a later operator can understand what happened, why it happened, who owned it, and what remains unresolved without mistaking preserved context for autonomous authority.
