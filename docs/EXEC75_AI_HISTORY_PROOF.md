# EXEC-75 AI History Proof

Date: 2026-05-26

## Status

STATUS: PASS LOCALLY

EXEC-75 replaces overwrite-only project AI interpretation behavior with append-only run history.

## Implementation

Added:

- `ProjectAIInterpretationRun`
- `GET /projects/:projectId/ai-interpretation/history`
- audit logging for successful appended runs
- audit logging for failed appended runs

The existing `ProjectAIInterpretation` row remains the current interpretation pointer for application reads.

## Success Rerun Behavior

When a project AI interpretation succeeds:

- a new `ProjectAIInterpretationRun` row is created
- extracted JSON, document ids, model name, model version, prompt version, confidence, status, and reviewer are persisted in that run
- the current `ProjectAIInterpretation` row is updated to the latest successful interpretation
- an audit event records that history was appended

## Failed Rerun Behavior

When a project AI interpretation fails:

- a failed `ProjectAIInterpretationRun` row is created
- error data is retained in the failed run
- the current successful `ProjectAIInterpretation` row is not overwritten
- an audit event records the failed appended run

## Test Proof

`apps/admin/api/src/projects/project-ai-interpretations.service.spec.ts` proves:

- successful reruns append history and update current state
- failed reruns append failed history and do not overwrite a prior success

## Remaining Production Verification

After deploy, run one successful interpretation and one intentionally failed rerun against a controlled project, then confirm:

- history count increases for both attempts
- current interpretation still points to the latest successful result
- failed rerun payload does not replace successful extracted JSON
