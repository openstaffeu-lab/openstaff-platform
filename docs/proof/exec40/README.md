# EXEC-40 Proof

Last updated: `2026-05-20`

## Scope

EXEC-40 closes the first shared operational memory and decision-support layer for OpenStaff.

This proof tracks:

1. shared operational memory summary
2. decision-support summary
3. escalation continuity summary
4. operational memory compression summary
5. runtime safety summary
6. browser validation summary
7. production smoke summary
8. validation summary
9. deploy summary
10. cleanup summary

## Shared Operational Memory Summary

- `docs/SHARED_OPERATIONAL_MEMORY_MODEL.md` now defines the operational memory lifecycle, incident/escalation/moderation/rollout/billing memory, unresolved-state persistence, carryover persistence, handoff persistence, freshness, stale-memory handling, conflict resolution, authority ownership, and audit visibility
- the live readiness page now renders `Operational memory summaries`, `Unresolved-state carryover`, `Operator handoff summaries`, and `Grouped operational history`
- the memory layer remains advisory-only and does not change moderation, billing, escalation, severity, rollback, or production state automatically

## Decision-Support Summary

- `docs/DECISION_SUPPORT_REVIEW.md` now captures repeated operator decisions, repeated escalation reasoning, repeated rollout decisions, repeated moderation reasoning, repeated billing-review reconstruction, and repeated incident-response reconstruction
- the live readiness page now renders `Decision-support summaries`, `Recurring issue summaries`, and `Repeated-failure summaries`
- decision-support remains explainable and source-linked rather than opaque or autonomous

## Escalation Continuity Summary

- `docs/ESCALATION_CONTINUITY_BASELINE.md` now defines escalation carryover packets, unresolved-state persistence, dependency continuity, ownership continuity, timeline continuity, and stalled-escalation indicators
- the live readiness page now renders `Escalation continuity`
- authenticated production proof confirmed the continuity layer renders on revision `openstaff-admin-00015-p92`

## Operational Memory Compression Summary

- `docs/OPERATIONAL_MEMORY_COMPRESSION.md` now defines compressed operational timelines, recurring issue summaries, repeated failure grouping, repeated queue patterns, recurring moderation patterns, recurring billing patterns, and recurring rollout friction
- the live readiness page uses bounded summaries instead of raw log dumps or infinite history feeds

## Runtime Safety Summary

- no backend authority path was added for moderation approval, billing activation, escalation, severity assignment, rollback, or production mutation
- `docs/AUTOMATION_GUARDRAILS.md` now extends the boundary model to shared memory and decision-support
- the live page remains explicitly advisory-only and browser proof confirmed the authority-boundary text still renders

## Browser Validation Summary

- authenticated Chrome validation on `https://backoffice.openstaff.eu/admin/production-readiness` returned `domContentLoadedMs = 262`, `loadEventMs = 386`, `failedRequests = []`, `consoleErrors = []`, `pageErrors = []`
- authenticated Edge validation returned `domContentLoadedMs = 340`, `loadEventMs = 504`, `failedRequests = []`, `consoleErrors = []`, `pageErrors = []`
- authenticated mobile Chrome validation returned `domContentLoadedMs = 323`, `loadEventMs = 504`, `failedRequests = []`, `consoleErrors = []`, `pageErrors = []`, `scrollWidth = viewportWidth = 424`
- all three browsers rendered `Operational memory summaries`, `Decision-support summaries`, `Escalation continuity`, `Unresolved-state carryover`, `Recurring issue summaries`, `Repeated-failure summaries`, `Operator handoff summaries`, and `Grouped operational history`

## Production Smoke Summary

- `GET https://api.openstaff.eu/health` returned `status = ok`, `environment = production`
- `GET https://api.openstaff.eu/status` returned `status = ok`, `db = healthy`, `warnings = []`, `errors = []`
- authenticated `GET /admin/public-posts = 200`
- authenticated `GET /admin/public-post-media = 200`
- authenticated browser proof confirmed live rendering of the EXEC-40 memory and continuity sections on the promoted admin revision

## Validation Summary

- `apps/admin/api -> npx.cmd prisma validate` passed
- `apps/admin/api -> npx.cmd prisma generate` passed
- `apps/admin/api -> npm.cmd run build` passed
- `apps/admin/web -> npm.cmd run build` passed
- `apps/admin -> npm.cmd run build` passed
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1` passed at `2026-05-20T08:16:25.3402957Z`
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-failure-simulations.ps1` passed at `2026-05-20T08:16:26.8669910Z`

## Deploy Summary

- admin build `255d53c6-28b8-4d2b-a152-56dd49a66b1e` succeeded
- `gcloud run services describe openstaff-admin --region europe-west1` reported `latestReadyRevisionName = openstaff-admin-00015-p92`
- the service kept `100%` traffic on the latest ready revision after deployment

## Cleanup Summary

- the temporary EXEC-40 proof operator was promoted through one-off job `openstaff-api-exec40-promote-superadmin`
- execution `openstaff-api-exec40-promote-superadmin-28lg5` completed successfully
- the proof operator was downgraded back to `PROFESSIONAL` after browser and smoke validation
- the one-off Cloud Run job was deleted after proof
- the temporary Playwright workspace `tmp-exec40-playwright` was removed after browser validation
