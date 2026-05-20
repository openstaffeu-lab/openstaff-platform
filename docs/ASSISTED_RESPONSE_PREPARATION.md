# Assisted Response Preparation

Last updated: `2026-05-20`  
Scope: `EXEC-39`

## Purpose

This baseline defines the first safe response-preparation layer for OpenStaff.

## Allowed

The platform may:

1. summarize
2. route
3. suggest next checks
4. show relevant links
5. show timestamps
6. group evidence
7. suggest likely ownership
8. suggest relevant runbooks
9. prefill handoff-ready context

## Forbidden

The platform may not:

1. execute moderation decisions
2. execute billing activation
3. open escalations automatically
4. trigger rollback automatically
5. assign severity automatically
6. mutate production state autonomously

## Safe Preparation Domains

### Moderation Review Preparation

1. queue age
2. oldest-item orientation
3. visible upload-failure context
4. likely owner continuity checks

### Billing Review Preparation

1. oldest open review
2. webhook-failure visibility
3. grouped billing confusion signals
4. suggested manual follow-up checks

### Escalation Preparation

1. unresolved-state summary
2. visible dependency hints
3. likely owner and backup-owner checks
4. fresh-vs-stale packet cues

### Rollout Review Preparation

1. readiness warnings
2. adoption reasons
3. queue pressure context
4. suggested rollout-related runbooks and proof checks

### Incident-Response Preparation

1. visible failure bursts
2. likely affected flows
3. grouped next checks
4. rollback review reminders

### Deploy Verification Preparation

1. latest validation outputs
2. readiness and health links
3. visible current revision state
4. likely proof references

## Guardrail

Every response-preparation block must remain timestamped, explainable, source-linked, and advisory-only.

## Final Assessment

Assisted response preparation is valid only when it reduces clerical prep work while leaving final review, escalation, billing, moderation, severity, and rollback decisions explicitly human-owned.
