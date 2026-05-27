# EXEC-76 Live AI History Proof

Date: 2026-05-27

## Status

STATUS: PARTIAL PASS

Append-only success history is live-proven. Failed-rerun append history is not live-proven through the production HTTP endpoint.

## Live Success Proof

Controlled production project: `a463d629-f9e4-467a-a6cb-ba5ec7adcfcf`

Results:

- first successful `PUT /projects/:projectId/ai-interpretation`: `200`
- current interpretation after first run: `promptVersion = exec76-success-1`
- second successful rerun: `200`
- current interpretation after second run: `promptVersion = exec76-success-2`
- `GET /projects/:projectId/ai-interpretation/history`: `200`
- history returned two `COMPLETED` runs in newest-first order
- audit log actions: two `PROJECT_AI_INTERPRETATION_RUN_APPENDED` entries

## Failed Rerun Gap

An attempted bad rerun with an invalid document reference returned `400`, and current interpretation remained on `exec76-success-2`.

This proves failed invalid input does not overwrite the last successful current interpretation, but it does not prove failed-rerun append behavior. The service catch branch that writes `PROJECT_AI_INTERPRETATION_FAILED_RUN_APPENDED` is not reachable through the safe malformed-input path because validation/document ownership errors are rejected before the append-on-catch block.

## Required Follow-Up

Add a safe production-testable failure trigger for project AI interpretation, or move the failed-run append boundary so endpoint-level rerun failures append a failed history record without corrupting current successful interpretation state.

## Evidence

Primary evidence: `docs/proof/exec76/runtime-live-proof.json`.
