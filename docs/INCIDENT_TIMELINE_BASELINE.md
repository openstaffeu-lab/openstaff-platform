# Incident Timeline Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-34`

## Purpose

This baseline standardizes how operational incidents should be represented so every operator sees the same timeline, ownership state, and recovery state.

## Standard Incident Stages

Every incident should move through these stages:

1. incident detected
2. triage started
3. escalation triggered
4. mitigation applied
5. recovery validated
6. postmortem required or explicitly waived

## Required Timeline Fields

Every incident timeline should record:

1. incident identifier
2. incident title
3. severity
4. detection source
5. incident commander
6. alternate owner
7. current coordination state
8. current rollback state
9. current operational mode
10. queue and cohort impact

## Required Timestamps

At minimum, record:

1. `detectedAt`
2. `triageStartedAt`
3. `escalatedAt`
4. `mitigationStartedAt`
5. `recoveryValidatedAt`
6. `postmortemRequiredAt` or `postmortemWaivedAt`
7. `lastOperatorUpdateAt`

## Severity Markers

Severity must be explicit, not implied:

1. `SEV-1`: active severe service or trust disruption, freeze likely
2. `SEV-2`: significant degradation or cross-queue disruption, escalation required
3. `SEV-3`: bounded issue with operator-managed mitigation
4. `SEV-4`: informational or low-impact issue tracked for visibility

## Coordination State

Each incident should show one coordination state:

1. `awaiting_owner`
2. `triage_in_progress`
3. `escalated`
4. `mitigating`
5. `watching_recovery`
6. `resolved_pending_postmortem`
7. `closed`

## Rollback State

Each incident should show one rollback state:

1. `not_considered`
2. `candidate_identified`
3. `under_review`
4. `approved`
5. `executed`
6. `not_needed`

## Ownership Rules

1. every active incident has a named commander
2. every active incident has a named alternate
3. ownership transfers must update the timeline rather than live only in chat or memory
4. the next action should be clear after every meaningful state change

## Queue And Cohort Impact Rules

The incident timeline should state:

1. whether moderation is affected
2. whether billing is affected
3. whether support pressure is rising
4. whether rollout should pause
5. whether a freeze has been declared

## Minimum Update Cadence

The timeline should be updated when:

1. ownership changes
2. severity changes
3. degraded mode is declared or lifted
4. mitigation starts or completes
5. recovery is validated
6. a postmortem requirement is established

## Final Assessment

EXEC-34 defines a shared incident timeline contract so operators no longer have to infer the stage, owner, or rollback posture of an incident from scattered notes. This reduces re-triage and makes incident carryover safer across operators and sessions.
