# EXEC-38 Proof

Last updated: `2026-05-19`

## Verdict

`PASS - the first operational compression layer is live on the authenticated admin readiness surface, the unified intelligence headings render in Chrome, Edge, and mobile Chrome, and the compression layer remains advisory, source-linked, explainable, and non-authoritative`

## Deployment Resolution Summary

- admin deploy succeeded with `gcloud builds submit --config apps/admin/cloudbuild.admin.yaml --service-account=projects/openstaff-platform/serviceAccounts/openstaff-build@openstaff-platform.iam.gserviceaccount.com .`
- successful build ID: `254c35de-e994-4552-99ce-c2853bb5aa60`
- latest ready admin revision after deploy: `openstaff-admin-00013-r79`
- traffic confirmation: `100%` on `openstaff-admin-00013-r79`

## Operational Compression Summary

- the readiness page now renders a compressed operator orientation layer before the deeper queue, digest, and correlation sections
- the new layer groups operational state, queue state, rollout state, incident state, and operator-availability state
- the page now shows one explicit freshness interpretation instead of forcing operators to infer staleness from scattered timestamps
- grouped queue, rollout, and incident summaries now reduce repeated local page reconstruction before operators drill into detailed assistance cards

## Unified State Summary

- the new unified state model governs:
  - global operational state
  - queue state
  - rollout state
  - moderation state
  - billing state
  - escalation state
  - incident state
  - degraded-mode state
  - operator availability state
- source-of-truth hierarchy, timestamp ownership, stale-state handling, and conflicting-state handling are now documented in [UNIFIED_OPERATIONAL_STATE_MODEL.md](/C:/Users/admin/Desktop/openstaff-platform/docs/UNIFIED_OPERATIONAL_STATE_MODEL.md:1)

## Attention Routing Summary

- the page now renders:
  - a priority stack
  - freshness and stale-state handling
  - attention-routing cues
- urgent vs important review order is now documented in [ATTENTION_ROUTING_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/ATTENTION_ROUTING_BASELINE.md:1)
- no automatic escalation was introduced

## Intelligence Surface Summary

- new live headings confirmed in production:
  - `Compressed operator orientation`
  - `Unified operational state`
  - `Grouped operational summaries`
  - `Grouped queue summaries`
  - `Grouped rollout summaries`
  - `Grouped incident summaries`
  - `Source-of-truth and freshness rules`
  - `Integration posture`
  - `Compressed source metrics`
- detailed queue, digest, incident, and correlation cards remain visible below the new compressed layer
- raw JSON-heavy sections were replaced with grouped, source-linked summaries

## Operator Efficiency Summary

- repeated readiness-page reconstruction is reduced because operators now see:
  - first action cues
  - grouped state
  - freshness
  - grouped queue posture
  - grouped rollout posture
  - grouped incident posture
- measurement baselines are now documented in [OPERATIONAL_COMPRESSION_METRICS.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OPERATIONAL_COMPRESSION_METRICS.md:1)

## Runtime Safety Summary

- no backend authority was added
- no automatic state mutation was added
- no autonomous workflow was added
- no hidden prioritization score was introduced
- no secret exposure was introduced by the compression layer
- authority boundary remained explicit live:
  - no approve
  - no reject
  - no billing activation
  - no automatic escalation
  - no automatic incident declaration
  - no automatic severity assignment
  - no rollout-state change
  - no rollback

## Browser Validation Summary

Authenticated production proof ran on `https://backoffice.openstaff.eu/admin/production-readiness` after the EXEC-38 admin deploy.

### Chrome

- headings present: all EXEC-38 compression headings plus existing assistance headings
- timestamps visible: `true`
- reasoning visible: `true`
- stale visibility: `true`
- authority boundaries visible: `true`
- `consoleErrors = []`
- `pageErrors = []`
- `failedRequests = []`
- layout: `viewportWidth = 1440`, `scrollWidth = 1440`
- performance: `domContentLoadedMs = 249`, `loadEventMs = 381`

### Edge

- headings present: all EXEC-38 compression headings plus existing assistance headings
- timestamps visible: `true`
- reasoning visible: `true`
- stale visibility: `true`
- authority boundaries visible: `true`
- `consoleErrors = []`
- `pageErrors = []`
- `failedRequests = []`
- layout: `viewportWidth = 1440`, `scrollWidth = 1440`
- performance: `domContentLoadedMs = 234`, `loadEventMs = 335`

### Mobile Chrome

- headings present: all EXEC-38 compression headings plus existing assistance headings
- timestamps visible: `true`
- reasoning visible: `true`
- stale visibility: `true`
- authority boundaries visible: `true`
- `consoleErrors = []`
- `pageErrors = []`
- `failedRequests = []`
- layout: `viewportWidth = 424`, `scrollWidth = 424`
- performance: `domContentLoadedMs = 241`, `loadEventMs = 338`
- mobile degradation finding: no horizontal overflow was visible in the validated mobile viewport

## Production Smoke Summary

- `GET https://api.openstaff.eu/health` returned `status = ok`
- `GET https://api.openstaff.eu/status` returned `status = ok`, `db = healthy`, `warnings = []`, `errors = []`
- authenticated operator login for the temporary proof user returned `role = SUPERADMIN` during validation
- authenticated admin readiness page rendered live on `openstaff-admin-00013-r79`
- authenticated moderation/admin smoke returned:
  - `GET /admin/public-posts = 200`
  - `GET /admin/public-post-media = 200`

## Validation Summary

- local validation:
  - `apps/admin/api -> npx.cmd prisma validate` PASS
  - `apps/admin/api -> npx.cmd prisma generate` PASS
  - `apps/admin/api -> npm.cmd run build` PASS
  - `apps/admin/web -> npm.cmd run build` PASS
  - `apps/admin -> npm.cmd run build` PASS
- production ops-check:
  - `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1` PASS at `2026-05-19T17:42:10.9989068Z`
  - `healthStatus = ok`
  - `readinessStatus = ok`
  - `databaseStatus = healthy`
  - `monitoringPolicies = 10`
  - `dashboards = 2`
  - `uptimeChecks = 7`
  - `recentBackups = 5`
- failure simulations:
  - `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-failure-simulations.ps1` PASS at `2026-05-19T17:42:12.1331785Z`
  - `loginThrottleStatus = 429`
  - `webhookFailureStatus = 400`
  - `webhookThrottleStatus = 429`
  - `moderationUnauthorizedStatus = 401`
  - `storageMissingStatus = 404`

## Cleanup Proof

- one-off job manifest used for proof: [openstaff-api-exec38-promote-superadmin.yaml](/C:/Users/admin/Desktop/openstaff-platform/docs/proof/exec38/runtime/openstaff-api-exec38-promote-superadmin.yaml:1)
- proof job `openstaff-api-exec38-promote-superadmin` was deleted after execution
- temporary proof operator `exec38-1779211984738-superadmin@openstaff.eu` was downgraded from `SUPERADMIN` back to `PROFESSIONAL` after browser validation
- temporary local Playwright workspace used for proof was removed before final release-gate validation
