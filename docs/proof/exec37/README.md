# EXEC-37 Proof

Last updated: `2026-05-19`

## Scope

EXEC-37 closes the live operational assistance rollout by resolving the admin deployment blocker, promoting the updated admin revision, validating authenticated production rendering, and reviewing noise, usability, and authority-boundary behavior.

## Deployment Resolution Summary

- initial blocker: `gcloud builds submit --config apps/admin/cloudbuild.admin.yaml .` failed with `403` because `605639023972-compute@developer.gserviceaccount.com` could not read the staged Cloud Build source object
- root cause: the staged source bucket grant existed for `openstaff-build@openstaff-platform.iam.gserviceaccount.com`, but the build path from this environment used the compute service account for source-object reads
- fix: deploy was rerun with the dedicated build service account explicitly set:
  `gcloud builds submit --config apps/admin/cloudbuild.admin.yaml --service-account=projects/openstaff-platform/serviceAccounts/openstaff-build@openstaff-platform.iam.gserviceaccount.com .`
- result: build `6761661d-1f06-488a-8b72-1b106ab57c8c` succeeded
- latest ready admin revision: `openstaff-admin-00012-jj8`
- rollback safety: the fix narrowed the deploy path to the intended build identity and did not broaden runtime IAM

## Live Assistance Rendering Summary

- authenticated Chrome and Edge proof both loaded `https://backoffice.openstaff.eu/admin/production-readiness` with `httpStatus = 200`
- both browsers confirmed live rendering for:
  - assistance safety contract
  - moderation, billing, and support queue assistance
  - production readiness assistance summary
  - incident assistance surface
  - all six digest sections
  - all four correlation sections
  - source metrics snapshot
- both browsers confirmed timestamps and reasoning blocks were visible

## Assistance Safety Summary

- live rendered text explicitly states assistance is `Advisory only`
- live rendered text explicitly prohibits:
  - approval
  - rejection
  - automatic escalation
  - automatic severity assignment
  - billing activation
  - rollback triggering
  - rollout-state change
  - operator override
- queue, digest, and correlation surfaces cite visible source metrics rather than hidden scores

## Operational Noise Summary

- quiet-state browser proof did not show console noise, request failures, or warning spam
- the page remained readable in Chrome and Edge with queue, digest, and correlation cards present together
- repeated summary language stayed neutral rather than alarmist when the active snapshot was quiet
- detailed review recorded in [ASSISTANCE_NOISE_VALIDATION.md](/C:/Users/admin/Desktop/openstaff-platform/docs/ASSISTANCE_NOISE_VALIDATION.md:1)

## Operational Usability Summary

- live assistance improved operator orientation by combining readiness status, queue pressure, incident hints, digests, correlations, and source metrics on one page
- queue visibility, escalation visibility, and incident comprehension were improved without adding false authority signals
- detailed review recorded in [ASSISTANCE_USABILITY_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/ASSISTANCE_USABILITY_REVIEW.md:1)

## Runtime Performance Summary

- Chrome browser proof:
  - `domContentLoadedMs = 285`
  - `loadEventMs = 376`
  - `consoleErrors = []`
  - `pageErrors = []`
  - `failedRequests = []`
- Edge browser proof:
  - `domContentLoadedMs = 223`
  - `loadEventMs = 312`
  - `consoleErrors = []`
  - `pageErrors = []`
  - `failedRequests = []`
- no hydration regressions or fetch-loop symptoms were observed in the authenticated browser proof

## Production Smoke Summary

- `curl -sS https://api.openstaff.eu/health` returned `status = ok`
- `curl -sS https://api.openstaff.eu/status` remained healthy
- authenticated `/auth/login -> /auth/me` for the temporary proof operator returned `SUPERADMIN` successfully during validation
- `https://backoffice.openstaff.eu/admin/production-readiness` rendered the live assistance layer in Chrome and Edge
- `warnings = []` and `errors = []` remained true in the active readiness payload during proof

## Validation Summary

- `apps/admin/api -> npx.cmd prisma validate` PASS
- `apps/admin/api -> npx.cmd prisma generate` PASS
- `apps/admin/api -> npm.cmd run build` PASS
- `apps/admin/web -> npm.cmd run build` PASS
- `apps/admin -> npm.cmd run build` PASS
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1` PASS
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-failure-simulations.ps1` PASS
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-13-release-check.ps1` PASS

## Temporary Proof Hygiene

- one-off job manifest used for proof: [openstaff-api-exec37-promote-superadmin.yaml](/C:/Users/admin/Desktop/openstaff-platform/docs/proof/exec37/runtime/openstaff-api-exec37-promote-superadmin.yaml:1)
- proof job `openstaff-api-exec37-promote-superadmin` was deleted after execution
- the temporary proof account was downgraded from `SUPERADMIN` back to `PROFESSIONAL` after browser validation

## Verdict

`EXEC-37 PASS`
