# EXEC-78G.10CE - Repository Integration & Execution Readiness

Date: 2026-10-01

Verdict: `EXEC-78G.10CE BLOCKED`

Execution readiness: `FIU1_EXECUTION_STILL_BLOCKED`

## A. Executive Context

- CD: `EXEC-78G.10CD BLOCKED`.
- CB human FIU-1 authorization: `GRANTED` for continuation toward execution preparation only.
- `HUMAN_DECISION = FIU1_DEPLOYMENT_AUTHORIZED`.
- `DECISION_RECORDED = YES`.
- `FIU1_DEPLOYMENT_AUTHORIZATION = GRANTED`.
- Build executed: NO.
- Deployment executed: NO.
- CE verified the manually materialized GitHub connection, linked repository, and manual-only trigger by read-only Cloud Build resource inspection. No connection/trigger was created by CE.

## B. Human Inputs

| Input | Supplied value | CE handling |
|---|---|---|
| `REPOSITORY_INTEGRATION_AUTHORIZED` | YES | Human authorized a connection/repository/manual trigger if safe; CE verified that the operator had already materialized the integration. CE did not create or modify it. |
| `OPERATOR_OF_RECORD_NAME` | Cristian Popa | Explicit human-supplied operator. |
| `OPERATOR_OF_RECORD_ROLE` | superadmin / owner / deployment manager | Exact human-supplied role. This record does not grant or infer any permissions. |
| `OPERATOR_OF_RECORD_ESCALATION_CONTACT` | cristianpopaban@gmail.com | Explicit human-supplied escalation contact. |
| `GITHUB_APP_INSTALLATION_CONFIRMED` | UNKNOWN | Human-provided state remains UNKNOWN; CE independently observed the GitHub connection installation state as COMPLETE. |
| `APP_INSTALLATION_ID` | NOT PROVIDED by human | CE read-only connection metadata exposes installation ID `129160141`; no ID was guessed. |
| `SMOKE_TEST_STRATEGY_APPROVED` | YES | Approval applies only to the documented strategy; no smoke test was run. |
| Designation date | 2026-10-01 | Date of this CE record. |

## C. Runtime Revalidation

| Item | CE read-only observation |
|---|---|
| Project | `openstaff-platform` |
| Configured run region | `europe-west1` |
| Service region | `europe-west1` |
| Environment | production, supported by `api.openstaff.eu` domain mapping to `openstaff-api` and committed production runbook |
| Service | `openstaff-api` |
| Latest ready/created revision | `openstaff-api-00036-gx2` |
| Traffic | 100% to `openstaff-api-00036-gx2` |
| Readiness | Ready, ConfigurationsReady, RoutesReady all True |
| Image/digest | `europe-west1-docker.pkg.dev/openstaff-platform/openstaff-repo/openstaff-api@sha256:5e902870ca0644d9a6543c9078e2081ff2e48ab8607db2244987ae7e1bb44169` |
| Cloud Build triggers | Dedicated manual trigger and two legacy automatic `^main$` triggers listed in `europe-west1` |
| Cloud Build connections | `openstaff-github-openstaffeu`, installation COMPLETE, app installation ID `129160141` |

Runtime observation matches CA/CD. These values are snapshots and must be revalidated before any future execution.

## D. Repository Integration Discovery

- Provider: GitHub.
- Repository identity: `openstaffeu-lab/openstaff-platform` (`https://github.com/openstaffeu-lab/openstaff-platform.git`).
- Connection: `projects/openstaff-platform/locations/europe-west1/connections/openstaff-github-openstaffeu`; provider GitHub; `installationState.stage=COMPLETE`; app installation ID `129160141`.
- Linked repository: resource `projects/openstaff-platform/locations/europe-west1/connections/openstaff-github-openstaffeu/repositories/openstaffeu-lab-openstaff-platform`; URI `https://github.com/openstaffeu-lab/openstaff-platform.git`; associated connection is `openstaff-github-openstaffeu`.
- Provider authorization account: Cloud Build connection metadata exposes the installation ID/state but no separate owner/account field. The linked repository owner is directly verified as `openstaffeu-lab`; account context is established through the complete connection’s canonical linked repository, not a separate user-identity field.
- `CONNECTION_PROVIDER = GitHub`.
- `CONNECTION_NAME = openstaff-github-openstaffeu`.
- `CONNECTION_AUTH_ACCOUNT = openstaffeu-lab` as linked repository owner context; a distinct installer/account property is not exposed by the connection resource.
- `CONNECTION_STATE = COMPLETE`; `APP_INSTALLATION_ID = 129160141` observed read-only. Human-supplied installation confirmation remains `UNKNOWN`.
- `LINKED_REPOSITORY = openstaffeu-lab/openstaff-platform`; linked resource URI is the canonical GitHub remote.
- `TRIGGER_NAME = openstaff-api-committed-source`; `TRIGGER_ID = 69ca6e82-e11b-4243-b0fe-9524c56949e8`; `TRIGGER_REGION = europe-west1`.
- `TRIGGER_EVENT = Manual invocation`; `TRIGGER_BRANCH = feature/work-in-progress`; `TRIGGER_CONFIG_PATH = apps/admin/api/cloudbuild.api.build.yaml`; `TRIGGER_SERVICE_ACCOUNT = openstaff-build@openstaff-platform.iam.gserviceaccount.com`.
- `TRIGGER_DISABLED_STATE = disabled field absent from readback; no disabled=true state observed`.
- Trigger inventory: `openstaff-api-committed-source` is present. Legacy automatic triggers `api-open-staff` and `web-open-staff` are also present and were not modified or executed.
- Result: repository integration and canonical linked repository are VERIFIED by direct read-only resource inspection. CE did not create or repair the connection/repository.

Read-back fields:

- `PROVIDER = GitHub`.
- `INTEGRATION_TYPE = Cloud Build 2nd-gen GitHub connection/repository` (resource path includes project/location/connection/repositories).
- `CONNECTION_REGION = europe-west1`.
- `CONNECTION_AUTH_ACCOUNT = openstaffeu-lab` as linked repository owner context; a distinct installing-user/account property is not exposed in the Cloud Build connection response.
- `REQUIRES_GITHUB_APP = YES`; app installation ID `129160141`, installation state COMPLETE.
- `REQUIRES_INSTALLATION_ID = NO` for an already materialized/complete connection; its ID is available in resource metadata.
- `REQUIRES_BROWSER_AUTH = NO` for CE; connection already exists and CE performed no auth flow.
- `REQUIRES_SECRET = NO` for CE; no secret creation or token use occurred.
- `REQUIRES_IAM_CHANGE = NO` for CE; no IAM change occurred.
- `REQUIRES_API_ENABLEMENT = NO` for CE; no API enablement occurred.

### Build Service Account

- Account: `openstaff-build@openstaff-platform.iam.gserviceaccount.com`.
- Exists: YES; read-only IAM service-account describe succeeded and the trigger references this account.
- Enabled: `UNVERIFIED`; the describe response did not return an explicit `disabled` field. No disabled state was observed, but CE does not infer enabled status from omission.
- Relevant project roles observed: `roles/artifactregistry.writer`, `roles/logging.logWriter`, `roles/run.admin`, `roles/secretmanager.secretAccessor`.
- Build/push capability: Artifact Registry writer and logging writer roles are present. No build was executed to test them.
- Execution-readiness assessment: `BUILD_AND_PUSH_PERMISSIONS_PRESENT_WITH_EXCESS_PRIVILEGE`; `roles/run.admin` and `roles/secretmanager.secretAccessor` are broader than the build-only steps require. CE made no IAM change. The selected build-only YAML has no deploy step, but the service-account privilege remains a deployment-control risk to review at a later authorization gate.

Explicit fields: `BUILD_SERVICE_ACCOUNT_EXISTS = YES`; `BUILD_SERVICE_ACCOUNT_ENABLED = UNVERIFIED`; `BUILD_SERVICE_ACCOUNT_RELEVANT_ROLES = artifactregistry.writer, logging.logWriter, run.admin, secretmanager.secretAccessor`; `BUILD_SERVICE_ACCOUNT_EXECUTION_READINESS = BUILD_AND_PUSH_PERMISSIONS_PRESENT_WITH_EXCESS_PRIVILEGE`.

## E. Mutation Log

No CE cloud mutations were executed. The connection, linked repository, and trigger existed when CE inspected them. No database query, build, trigger execution, deploy, or traffic change occurred.

| Timestamp | Operation | Resource | Result |
|---|---|---|---|
| None during CE | Cloud Build connection `openstaff-github-openstaffeu` | Existing resource; createTime `2026-10-01T16:47:07.549708866Z` | Read-only observed COMPLETE with app installation ID `129160141`; not created by CE. |
| None during CE | Linked repository `openstaffeu-lab-openstaff-platform` | Existing resource; createTime `2026-10-01T16:49:50.501340862Z` | Read-only observed with canonical URI; not created by CE. |
| None during CE | Manual trigger `openstaff-api-committed-source` | Existing resource; createTime `2026-10-01T17:16:04.543426831Z` | Read-only observed; not created or executed by CE. |
| None | Database read query | None | Not attempted; no safe SQL client/authenticated read path was established. |
| None | Build/trigger/deployment | None | Not executed. |

## F. PREREQ-12 Completion

- Repository/config face: VERIFIED. Build-only `apps/admin/api/cloudbuild.api.build.yaml` is committed and pushed at Stage A; static comparison preserved the Docker build/push/image declarations, removed deploy, and left legacy `apps/admin/api/cloudbuild.api.yaml` unchanged.
- Cloud/source face: VERIFIED. The COMPLETE GitHub connection links the canonical repository, and the manual trigger reads back the committed build-only config and intended feature branch.
- Connection resource: `projects/openstaff-platform/locations/europe-west1/connections/openstaff-github-openstaffeu`; provider GitHub; app installation ID `129160141`; installation COMPLETE.
- Linked repository: `https://github.com/openstaffeu-lab/openstaff-platform.git`; resource is under the expected connection.
- Trigger: `openstaff-api-committed-source`; ID `69ca6e82-e11b-4243-b0fe-9524c56949e8`; region `europe-west1`; config `apps/admin/api/cloudbuild.api.build.yaml`; source ref `refs/heads/feature/work-in-progress`; service account `openstaff-build@openstaff-platform.iam.gserviceaccount.com`.
- Trigger uses GitFileSource/sourceToBuild and has no repository-event, GitHub push/PR, Pub/Sub, webhook, or trigger-template event fields. This is the manual-invocation-only trigger; it was not executed.
- `TRIGGER_EVENT = Manual invocation`, evidenced by GitFileSource/sourceToBuild and absence of automatic event configuration fields; trigger was not executed.
- `TRIGGER_REPOSITORY_GENERATION = 2nd gen`, evidenced by its connection-backed repository resource path.
- `TRIGGER_DISABLED_STATE = disabled field absent from readback; no disabled=true state observed`.
- Source is the linked remote Git repository/ref, not the local working directory; the 8 dirty frontend files and 55 untracked local files are not trigger source inputs.
- The connection API does not expose a separate GitHub authorization-account field. The linked repository owner is verified as `openstaffeu-lab`; no separate installer identity is inferred.
- No connection, repository, or trigger creation occurred in CE. No build or trigger execution occurred.

Committed-source isolation conditions at CE observation:

1. Existing repository integration is used: YES; COMPLETE GitHub connection and registered canonical repository were read back.
2. Trigger consumes committed Git source: YES; `gitFileSource` and `sourceToBuild` identify the connection-backed repository and branch ref.
3. Trigger references committed `apps/admin/api/cloudbuild.api.build.yaml`: YES; path read back from the trigger and config is committed/pushed.
4. Local working-tree contents are source input: NO; the trigger source is the remote repository/ref, not the workstation directory.
5. The 8 unrelated tracked frontend modifications can enter trigger source before commit: NO; they are local uncommitted changes, outside remote committed source.
6. The 55 pre-existing untracked files can enter trigger source: NO; they are local and untracked, not part of the remote repository source.
7. Trigger read-back confirms the intended source/ref/config and absence of automatic event fields: YES.
8. No build was executed in CE: YES.

Future invocation uses the branch ref, not a permanently pinned SHA. A later execution gate must record and revalidate the intended governed branch HEAD SHA immediately before any invocation; this does not permit using the current dirty local worktree.

`PREREQ-12 = VERIFIED`

`PREREQ12_RESOLUTION = RESOLVED_TRIGGER_CREATED_VERIFIED`

## G. PREREQ-07 Completion

Operator of record:

- Name: Cristian Popa
- Role: Superadmin / Owner / Deployment Manager
- Escalation contact: cristianpopaban@gmail.com
- Designation date: 2026-10-01

These fields were explicitly supplied by the human. No identity or role was inferred from Git, gcloud, or IAM.

`PREREQ-07 = VERIFIED`

`PREREQ07_RESOLUTION = RESOLVED_OPERATOR_RECORDED`

## H. PREREQ-09 Completion

Repository evidence establishes PostgreSQL and maps Prisma `AuditLog` to the physical table `AuditLog`: `schema.prisma` defines the model without a custom `@@map`, and the committed production baseline migration contains `CREATE TABLE "AuditLog"`. The Cloud SQL instance is `openstaff-db`, PostgreSQL 16, `RUNNABLE`; the active principal has project Owner/Cloud SQL connect/login permissions, but the principal is not listed as a database user. There is no installed `psql` client or Cloud SQL Proxy. No database connection or query was attempted.

`PREREQ-09 = UNVERIFIED_NO_EVIDENCE`

`PREREQ09_RESOLUTION = UNRESOLVED_READ_ACCESS`

Reason: metadata/technical connect permission and table mapping do not establish safe SQL SELECT access. The approved read-only strategy, once an existing authorized SQL client/authenticated DB user is available, is a single `SELECT 1 FROM "AuditLog" LIMIT 1` against the explicitly verified production database, after confirming the service's database binding. No client, credential, proxy, network configuration, or database mutation is created by CE.

## I. PREREQ-13 Completion

`SMOKE_TEST_STRATEGY_APPROVED = YES` - explicit human approval, recorded for strategy only.

Proposed future controlled smoke strategy:

- Identity: a pre-existing, dedicated test Employer account only; identify and verify its account context before execution. No credentials or accounts are created by CE. The actual account is not presently identified.
- Test data: one synthetic, clearly prefixed Project in the explicitly authorized target; use no customer or real-user content.
- FIU-1 operations: create a minimal DRAFT/PRIVATE Project; read it back; update only a harmless synthetic title/name while keeping it unpublished/private; read the expected `PROJECT_CREATED` and `PROJECT_UPDATED` evidence by Project ID and request correlation where available.
- Permission-negative case: use a separately pre-existing non-owner test principal, if available, to attempt an update and confirm rejection/no evidence; do not use an unknown production identity.
- Evidence inspection: use only a separately verified safe read-only AuditLog query path; PREREQ-09 currently prevents claiming that capability.
- Side-effect containment: synthetic prefix, one dedicated test Project, no publish/visibility transition, no unrelated child objects, and no real-user data.
- Cleanup: operator of record owns cleanup; after evidence capture, archive the isolated synthetic Project only if that update is separately confirmed safe and authorized. Preserve generated AuditLog rows as historical evidence; do not delete them.
- Stop conditions: unexpected permission result, failed write/read, missing/unexpected evidence, sensitive data in evidence, abnormal latency, or service instability; stop and escalate without further writes.

Strategy is documented and explicitly approved, but the required pre-existing test identity/account and safe AuditLog inspection path have not been verified. No smoke test was executed.

`PREREQ-13 = PARTIALLY_VERIFIED`

`PREREQ13_RESOLUTION = STRATEGY_DOCUMENTED_AND_APPROVED; LIVE_TEST_IDENTITY_AND_AUDITLOG_READ_PATH_REQUIRE_PREEXECUTION_CONFIRMATION`

## J. 13-Prerequisite Re-Verification Matrix

| ID | Prerequisite | Prior state | CE evidence | CE final classification | Residue |
|---|---|---|---|---|---|
| PREREQ-01 | Exact GCP project | VERIFIED | Current gcloud project and live service query identify `openstaff-platform`. | VERIFIED | Reconfirm at execution. |
| PREREQ-02 | Exact Cloud Run region | VERIFIED | Service metadata identifies `europe-west1`; local run region is `europe-west1`. | VERIFIED | Reconfirm at execution. |
| PREREQ-03 | Target environment | VERIFIED | Live `api.openstaff.eu` mapping routes to `openstaff-api`; committed runbook identifies production topology. | VERIFIED | Reconfirm target environment at execution. |
| PREREQ-04 | Current serving revision | VERIFIED | Current latest-ready `openstaff-api-00036-gx2`, Ready, 100% traffic, digest `sha256:5e902870ca0644d9a6543c9078e2081ff2e48ab8607db2244987ae7e1bb44169`. | VERIFIED | CA/CE-time snapshot; refresh immediately before execution. |
| PREREQ-05 | Previous known-good rollback revision | VERIFIED | Current pre-FIU-1 serving revision remains `openstaff-api-00036-gx2`, Ready and serving 100%. | VERIFIED | Revalidate existence/health before execution. |
| PREREQ-06 | Rollback technical access | VERIFIED | Current principal's direct project Owner role includes `run.services.update`/`get`. | VERIFIED | Technical capability only; not deployment/governance authorization. |
| PREREQ-07 | Operator ownership | UNVERIFIED_NO_EVIDENCE | Human explicitly supplied Cristian Popa, Superadmin / Owner / Deployment Manager, `cristianpopaban@gmail.com`, designation date 2026-10-01. | VERIFIED | Human-supplied accountable operator record. |
| PREREQ-08 | Runtime log access | VERIFIED | Read-only Cloud Logging query succeeds for `openstaff-api` metadata; no payload copied. | VERIFIED | No matching error row required for access verification. |
| PREREQ-09 | AuditLog/database observation | UNVERIFIED_NO_EVIDENCE | PostgreSQL 16, AuditLog table mapping, Cloud SQL metadata and connect/login IAM permission observed; no matching SQL user, psql, proxy, or safe SELECT path. | UNVERIFIED_NO_EVIDENCE | Do not query until existing safe read access is available and verified. |
| PREREQ-10 | AuditService failure observability | VERIFIED | Committed adapter emits server error; Cloud Logging query capability rechecked. | VERIFIED | No failure induced. |
| PREREQ-11 | Latency observability | VERIFIED | Existing enabled Cloud Run P95 policy covers API/web/admin; service-wide only. | VERIFIED | Not Project-write-specific. |
| PREREQ-12 | Committed-source build isolation | UNVERIFIED_NO_EVIDENCE | Direct read-only inspection verified the COMPLETE GitHub connection, canonical linked 2nd-gen repository, and manual trigger `openstaff-api-committed-source` on `refs/heads/feature/work-in-progress`, referencing committed `apps/admin/api/cloudbuild.api.build.yaml`; no automatic event fields are present; no build executed. | VERIFIED | Remote committed source, not local workspace. Before any execution, verify the intended branch HEAD SHA and revalidate trigger/source/config. Connection metadata does not expose a separate installer account field; linked canonical repository owner is `openstaffeu-lab`. |
| PREREQ-13 | Safe smoke-test strategy | UNVERIFIED_NO_EVIDENCE | Human approved a synthetic, private, dedicated-account strategy; actual test account and AuditLog read path are not established. | PARTIALLY_VERIFIED | Strategy approved; account and observation path are pre-execution requirements. |

Counts: VERIFIED = 11; PARTIALLY_VERIFIED = 1; UNVERIFIED_NO_EVIDENCE = 1; total = 13.

## K. No-Build / No-Deploy Attestation

- Cloud Build executed: NO.
- Cloud Build trigger executed: NO.
- Cloud Run deploy executed: NO.
- Cloud Run revision created by CE: NO.
- Cloud Run traffic changed: NO.
- Database writes: NO.
- Live smoke test executed: NO.

## L. Repository Preservation

- Tracked unrelated frontend modifications remain: 8.
- Pre-existing untracked files remain: 55.
- Staging remains empty before CE documentation staging.
- No application/configuration/cloud mutation was performed by CE.

## M. Governance Non-Effect

| Governance item | Preserved state |
|---|---|
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| FIU-1 human authorization | `GRANTED` |
| Deployment performed | NO |

CE does not authorize deployment execution, close governance blockers, change candidate readiness, authorize B4/G.11, reconstruct BN, or create Response, Participation, acting entity, or governance authority.

## N. Execution Readiness

`FIU1_EXECUTION_STILL_BLOCKED`

PREREQ-12 is verified from the existing committed-source manual trigger. PREREQ-09 still has no safe SQL SELECT path, and PREREQ-13 is only partially verified because no live test identity is identified. Deployment may not begin automatically.

## O. Final CE Verdict

`EXEC-78G.10CE BLOCKED`