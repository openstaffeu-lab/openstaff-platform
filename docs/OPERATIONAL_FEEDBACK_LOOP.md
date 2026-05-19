# Operational Feedback Loop

Last updated: `2026-05-19`  
Scope: `EXEC-29`

## Purpose

This baseline defines how controlled rollout feedback is captured before support pain becomes invisible drift.

## Feedback Categories

1. onboarding friction
2. moderation confusion
3. billing confusion
4. support pain point
5. failed flow
6. operator escalation
7. repeated user confusion

## Collection Model

Operational feedback is now captured through `POST /ops/feedback` and stored as system operational events.

Implementation rules:

1. feedback is lightweight and non-blocking
2. summaries should describe the friction, not dump secrets or raw personal data
3. repeated confusion is treated as a product-truth signal, not only a support burden
4. operator escalations are logged as first-class operational signals

## Minimum Usage Expectations

Operators should record feedback when:

1. a user gets stuck in onboarding despite a healthy runtime
2. moderation states are technically correct but confusing to a real person
3. billing requests require repeated clarification
4. uploads or publish flows fail in a way the user can perceive
5. the same support question appears multiple times in a short window
6. a first-user issue needs escalation outside normal L1 support ownership

## Ownership

| Feedback type | Primary owner |
|---|---|
| onboarding friction | support owner + engineering |
| moderation confusion | moderation owner |
| billing confusion | billing owner |
| failed flows | engineering + Technical Ops |
| escalations | Technical Ops |

## Review Cadence

1. daily during active rollout windows
2. before closing any PASS verdict that claims improved adoption readiness
3. after any incident or visible user-facing regression

## Current Baseline Verdict

OpenStaff now has an explicit operational feedback loop. The next maturity step is adding routine operator review discipline so the loop becomes habitual instead of event-driven only.
