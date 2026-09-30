# EXEC-78G.10CA - FIU-1 Deployment Prerequisites Verification

Date: 2026-09-30

Verdict: `EXEC-78G.10CA PASS WITH GAPS`

Decision-readiness classification: `FIU1_DECISION_READY_WITH_GAPS`

## A. Executive Gate Context

BZ: `EXEC-78G.10BZ PASS`; authorization request: `FIU1_DEPLOYMENT_AUTHORIZATION_REQUEST_COMPLETE`.

CA is read-only operational verification. It performs no deployment, grants no authorization, and records no human deployment decision. The operational snapshot is time-bound to the read-only observations recorded below; execution prerequisites must be refreshed before any later deployment.

## B. Operational Inspection Environment

- Google Cloud CLI: available, version `561.0.0`.
- Active authenticated account: YES. `gcloud auth list --filter=status:ACTIVE --format="value(status)"` returned an active marker. Account identity is intentionally not recorded.
- Configured project: `openstaff-platform`; `gcloud config get-value project` and `gcloud config list` returned this value.
- Configured `run/region`: `europe-west3`. No Cloud Run services were listed in that region.
- Cloud Run read access: YES. Service listing/describe/revision/domain-mapping reads succeeded for `openstaff-platform`, `europe-west1`.
- Cloud Build metadata read access: YES. Build and trigger listing/describe commands succeeded. No trigger rows were returned.
- Cloud Logging read access: YES. Read-only API error-log queries returned exit 0 with metadata-only output; no matching FIU-1 error entry was observed.
- Cloud Monitoring read access: YES for dashboard and alert-policy metadata. Read-only listing/descriptions succeeded. This SDK does not provide the attempted `gcloud monitoring time-series` or `metrics-descriptors` command; metric data values were not queried directly.
- Cloud SQL resource metadata read access: YES for `openstaff-db`. No database connection or AuditLog row query was attempted; safe runtime data-query access is not established.
- Material limitation: the configured default region conflicts with the live service region and the repository deployment default. Live service evidence establishes `europe-west1`; deployment must explicitly use and re-verify the intended target rather than inherit the configured `europe-west3` default.

No credential, token, secret, environment-variable value, or log payload is included in this report.

## C. Verification Matrix

| ID | Prerequisite | Verification Method | Evidence Class | Result | Observed Evidence / Blocking Condition |
|---|---|---|---|---|---|
| PREREQ-01 | Exact GCP project | `gcloud config get-value project`; `gcloud run services list --project=openstaff-platform --region=europe-west1`; service describe | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `VERIFIED` | Configured project is `openstaff-platform`; live `openstaff-api` is listed and described in that project. |
| PREREQ-02 | Exact Cloud Run region | `gcloud run services describe openstaff-api --project=openstaff-platform --region=europe-west1` | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `VERIFIED` | Service metadata label is `cloud.googleapis.com/location=europe-west1`. The configured default `europe-west3` had no services listed; do not rely on that default. |
| PREREQ-03 | Target environment | Live domain mapping plus committed `docs/DEPLOYMENT_RUNBOOK.md` production topology | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION`; `COMMITTED_REPOSITORY_EVIDENCE` | `VERIFIED` | Live `api.openstaff.eu` domain mapping routes to `openstaff-api` in `europe-west1`; the committed runbook identifies that API/domain/project/region combination as its current production topology. |
| PREREQ-04 | Current serving revision | `gcloud run services describe ... --format="yaml(status.url,status.latestReadyRevisionName,status.latestCreatedRevisionName,status.traffic,status.conditions,...)"`; `gcloud run revisions list` | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `VERIFIED` | At observation: `openstaff-api-00036-gx2` is latest-created and latest-ready; Ready, ConfigurationsReady, RoutesReady are True; 100% traffic to that revision. Image: `europe-west1-docker.pkg.dev/openstaff-platform/openstaff-repo/openstaff-api@sha256:5e902870ca0644d9a6543c9078e2081ff2e48ab8607db2244987ae7e1bb44169`. Service URL was `https://openstaff-api-bmv5rzc6zq-ew.a.run.app`. Revision last transition was `2026-05-29T16:48:15Z`; recheck immediately before any later deployment. |
| PREREQ-05 | Previous known-good rollback revision | Current service traffic/readiness plus `gcloud run revisions describe openstaff-api-00036-gx2` and revision list | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `VERIFIED` | The current pre-FIU-1 revision `openstaff-api-00036-gx2` exists, is Ready, and serves 100% traffic; its image digest is recorded above. It is a plausible current rollback candidate. Revalidate its health, identity, and availability immediately before deployment; this observation does not reserve it. Previous revision `openstaff-api-00035-d5r` exists and was Ready/ContainerHealthy, is now retired, and has the same image digest; age alone was not used to designate it as the rollback target. |
| PREREQ-06 | Rollback operational access | `gcloud projects get-iam-policy openstaff-platform` matched the active principal without printing identity; `gcloud iam roles describe roles/owner` | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `VERIFIED` | Active principal has a direct project `roles/owner` binding; the predefined role includes `run.services.update` and `run.services.get`. This establishes current technical service-update capability, not human deployment ownership, authorization, or an executed rollback test. |
| PREREQ-07 | Deployment operator ownership | Inspect committed `docs/DEPLOYMENT_RUNBOOK.md`, BZ proof, and read-only project/build metadata | `COMMITTED_REPOSITORY_EVIDENCE`; `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `UNVERIFIED_NO_EVIDENCE` | Runbook identifies runtime/build service accounts but no accountable human deployment owner/escalation contact. The authenticated principal is not equated with the authorized owner. |
| PREREQ-08 | Runtime log access | `gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=openstaff-api AND severity>=ERROR' --project=openstaff-platform --limit=3 --format="value(timestamp,resource.labels.location,severity)"` | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `VERIFIED` | Query succeeded with metadata-only output and no matching error rows. This verifies query access, not that errors occurred or that alerting exists. |
| PREREQ-09 | AuditLog/database observation access | `gcloud sql instances describe openstaff-db --project=openstaff-platform --format="value(name,region,state,databaseVersion)"`; inspect committed AuditService/schema | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION`; `COMMITTED_REPOSITORY_EVIDENCE` | `UNVERIFIED_NO_EVIDENCE` | Cloud SQL resource is `openstaff-db`, `europe-west1`, `RUNNABLE`, PostgreSQL 16; repository defines AuditLog. Neither proves safe runtime SELECT access to FIU-1 AuditLog records. No database connection/query was attempted. |
| PREREQ-10 | AuditService failure observability | Inspect committed `apps/admin/api/src/projects/project-write-evidence.adapter.ts` error logging and query Cloud Run error logs read-only | `COMMITTED_REPOSITORY_EVIDENCE`; `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `VERIFIED` | Adapter emits an error containing action and Project ID on audit failure; runtime error-log query access is established. The FIU-1-specific log query returned no matching entry, consistent with no FIU-1 deployment observed; no failure was induced. |
| PREREQ-11 | Latency observability | `gcloud monitoring dashboards list/describe`; `gcloud monitoring policies list/describe` for Cloud Run P95 | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION` | `VERIFIED` | Existing enabled `OpenStaff Prod - Cloud Run Latency P95` policy uses `run.googleapis.com/request_latencies` across `openstaff-api`, `openstaff-web`, and `openstaff-admin`; observed condition is P95 > 2000 ms for 600 s. Production overview dashboard has a service-wide Cloud Run P95 chart for those same services. This is generic service latency, not Project-write-specific latency. No time-series values were retrieved via this gcloud installation. |
| PREREQ-12 | Committed-source build isolation | `gcloud builds triggers list`; `gcloud builds list`; `gcloud builds describe b7d4ac09-3167-4265-81d1-567dc3ba7abf`; inspect committed `apps/admin/api/cloudbuild.api.yaml`, `apps/admin/api/Dockerfile`, and runbook | `DIRECT_READ_ONLY_OPERATIONAL_OBSERVATION`; `COMMITTED_REPOSITORY_EVIDENCE` | `UNVERIFIED_NO_EVIDENCE` | No Cloud Build trigger rows were returned. Runbook documents operator-workstation `gcloud builds submit`; historical successful API build source is a Cloud Storage source archive with no repository commit SHA in the inspected metadata. Build config uses `apps/admin/api` as local Docker context. Evidence does not prove a future build consumes a synchronized commit independently of local source; dirty frontend/root files are outside the API context, but that is not committed-source isolation. This is CRITICAL and must be resolved before execution. |
| PREREQ-13 | Safe smoke-test capability | Inspect committed BZ request, runbook, and FIU-1 local tests; no runtime write/read endpoint invoked | `COMMITTED_REPOSITORY_EVIDENCE` | `UNVERIFIED_NO_EVIDENCE` | Tests establish code-level coverage, not a safe live test account/context, target data strategy, or approved side-effect boundary. No credentials were created/used and no smoke test was run. |

## D. Verification Counts

- `VERIFIED_COUNT = 9`
- `UNVERIFIED_COUNT = 4`
- `BLOCKED_NO_ACCESS_COUNT = 0`
- `BLOCKED_COMMAND_SAFETY_COUNT = 0`
- `TOTAL = 13`

Matrix integrity: PASS. Each PREREQ-01 through PREREQ-13 appears exactly once and uses an allowed result value.

## E. Critical Evidence Summary

- GCP project: `openstaff-platform`, directly tied to live `openstaff-api` service listing - verified.
- Region: live service is in `europe-west1`; local gcloud default is `europe-west3` - verified mismatch; explicitly override/recheck for any future execution.
- Environment: live `api.openstaff.eu` mapping routes to the API and matches the committed runbook's production topology - production verified by those sources.
- Current revision: `openstaff-api-00036-gx2`, Ready and serving 100%; image digest recorded in the matrix. Observation is a snapshot and must be refreshed.
- Rollback candidate: current serving revision `00036-gx2` is the observed pre-FIU-1 candidate. Older `00035-d5r` is retired, though Ready and same image digest; it is not designated known-good solely because it is older.
- Rollback access: current active principal's direct project Owner role includes Cloud Run service update permission; this does not identify the human owner or authorize deployment.
- Runtime logs: read query access verified; no matching API error rows appeared in the query. No error was induced.
- AuditLog observation: Cloud SQL instance and schema exist, but read-only database table access is unverified.
- AuditService failure observability: code emits a server-side error and runtime log query access is available; no FIU-1 error entry was observed.
- Latency observation: an enabled service-wide Cloud Run P95 alert/dashboard exists for API, web, and admin. It does not isolate Project writes; no time-series values were retrieved.
- Build isolation: no trigger rows; historical API build used a storage source archive without inspected commit SHA; runbook uses local `gcloud builds submit`. Synchronized committed-source isolation is unverified and execution-blocking.
- Smoke capability: no live authorized test identity/context or safe data plan was established. No read/write smoke was run.

Resource existence is not operator access; repository logging code is not proof that a log entry exists; a prior revision is not automatically known-good; and BZ request completeness is not execution readiness.

## F. Decision Readiness

`FIU1_DECISION_READY_WITH_GAPS`

Read-only verification completed and identified four unverified prerequisites: deployment operator ownership, AuditLog/database row inspection, committed-source build isolation, and safe live smoke capability. Target project/service and the deployment mechanism are established sufficiently for an informed human review, but build isolation remains a critical execution blocker. The owner can review the evidence and choose authorize, deny, or defer; this classification is evidence completeness only, not deployment authorization and not `FIU1_DEPLOYMENT_EXECUTION_READY_WITH_LIMITATIONS`.

## G. Remaining Human Decision

Options remain:

- `FIU1_DEPLOYMENT_AUTHORIZED`
- `FIU1_DEPLOYMENT_DENIED`
- `FIU1_DEPLOYMENT_DEFERRED`

- Decision requested: YES
- Decision recorded: NO
- Deployment authorized: NO
- Deployment performed: NO

CA selects no option on behalf of the human owner.

## H. Governance Non-Effect

`EXEC-78G.10CA is read-only operational verification only.`

CA does not deploy FIU-1; authorize deployment; record a human deployment decision; execute Cloud Build; modify Cloud Run or traffic; mutate production/staging; change candidate readiness; authorize B4 or G.11; reconstruct BN; or create Response, Participation, acting entity, or governance authority.

| Governance item | Preserved state |
|---|---|
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| Deployment authorized | NO |
| Deployment performed | NO |
| Human decision recorded | NO |
