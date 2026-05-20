# Conflict Resolution Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-41`

## Purpose

This baseline defines how OpenStaff handles conflicting moderation outcomes, escalation paths, rollout interpretations, incident interpretations, and billing-review outcomes without autonomous conflict resolution.

## Conflict Principles

1. conflict must stay visible until a human resolves it
2. conflict summaries may compress the disagreement, but may not erase the disagreement
3. conflict handling must preserve attribution, timestamps, and raw evidence access
4. the platform may never choose the correct operator, correct rationale, or correct outcome automatically

## Conflict Types

### Conflicting moderation outcomes

1. visible disagreement about approve, reject, or defer state
2. conflicting interpretation of policy or evidence
3. unresolved visibility verification after action

### Conflicting escalation paths

1. disagreement about whether escalation is needed
2. disagreement about the correct receiving owner or queue
3. disagreement about whether the blocker is technical, operational, billing, or moderation-led

### Conflicting rollout interpretations

1. disagreement about hold, continue, or fix-first posture
2. disagreement about whether current queue pressure is acceptable
3. disagreement about whether current warnings are blocking or informational

### Conflicting incident interpretations

1. disagreement about incident scope or urgency
2. disagreement about whether current warnings represent a true incident
3. disagreement about whether rollback review is warranted

### Conflicting billing-review outcomes

1. disagreement about reconciliation state
2. disagreement about whether manual follow-up is complete
3. disagreement about whether the next path is queue review, escalation, or hold

## Tie-Break Governance

1. tie-break authority remains human-owned
2. tie-break path should follow the accountable domain owner or incident/release governance owner
3. tie-break actions must preserve the prior disagreement in the trace, even after resolution

## Escalation Path

1. unresolved functional disagreement should move to the accountable queue owner
2. unresolved cross-domain disagreement should move to the designated escalation owner or Technical Ops lead
3. unresolved release or rollback disagreement should move to release governance authority

## Freeze Conditions

Freeze review is required when:

1. disagreement materially affects public trust
2. disagreement materially affects billing or entitlement integrity
3. disagreement materially affects incident or rollback safety
4. the source snapshot is stale enough that no safe consensus can be claimed

## Rollback Conditions

Rollback review should remain explicit when:

1. disagreement exists about whether current live state is safe
2. conflicting interpretations affect rollback risk directly
3. verification after a change remains incomplete or contradictory

## Review Escalation

1. unresolved conflict may require additional specialist review
2. additional review may clarify evidence, owner, or rationale
3. additional review may not be automated by the platform without explicit human action

## Final Assessment

Conflict resolution becomes safer when the platform helps humans see disagreement, ownership, and unresolved blockers faster, but it remains unsafe the moment the platform starts choosing outcomes or suppressing dissent automatically.
