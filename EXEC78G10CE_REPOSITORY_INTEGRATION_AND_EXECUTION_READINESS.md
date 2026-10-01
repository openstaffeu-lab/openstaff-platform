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
- CE established operator ownership from explicit human input, but GitHub App installation/authorization is `UNKNOWN`; no connection or trigger was created.

## B. Human Inputs

| Input | Supplied value | CE handling |
|---|---|---|
| `REPOSITORY_INTEGRATION_AUTHORIZED` | YES | Authorization to attempt a connection/repository/manual trigger only when external provider authorization and all safety predicates are met. It does not authorize browser OAuth, app installation by Copilot, secrets, IAM, API enablement, builds, or deployment. |
| `OPERATOR_OF_RECORD_NAME` | Cristian Popa | Explicit human-supplied operator. |
| `OPERATOR_OF_RECORD_ROLE` | Superadmin / Owner / Deployment Manager | Explicit human-supplied role. This record does not grant or infer any permissions. |
| `OPERATOR_OF_RECORD_ESCALATION_CONTACT` | cristianpopaban@gmail.com | Explicit human-supplied escalation contact. |
| `GITHUB_APP_INSTALLATION_CONFIRMED` | UNKNOWN | Provider installation/approval not established. |
| `APP_INSTALLATION_ID` | NOT PROVIDED | No ID was guessed or requested through shell. |
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
| Cloud Build triggers | 0 listed |
| Cloud Build connections | 0 listed in `europe-west1` |

Runtime observation matches CA/CD. These values are snapshots and must be revalidated before any future execution.

## D. Repository Integration Discovery

- Provider: GitHub.
- Repository identity: `openstaffeu-lab/openstaff-platform` (`https://github.com/openstaffeu-lab/openstaff-platform.git`).
- Installed gcloud: supports `gcloud builds connections create github`; its help states the connection requires either manual browser installation/authorization or an already-installed app plus installation ID and authorizer token secret.
- Cloud Build connections/triggers: none observed in `europe-west1`; no trigger rows exist in the project.
- Registered repository: none established; the repository-list command requires an existing connection.
- External authorization required: YES. The installation state is UNKNOWN, no installation ID was provided, and the documented new-connection route requires manual browser authorization. CE does not perform that human/provider action, install the GitHub App, create a token/secret, or change IAM/API state.
- Result: `EXEC78G10CE_REPOSITORY_INTEGRATION_AUTHORIZATION_REQUIRED`.

## E. Mutation Log

No cloud mutations were executed. No connection, repository registration, or trigger was created. No database query, build, trigger execution, deploy, or traffic change occurred.

| Timestamp | Operation | Resource | Result |
|---|---|---|---|
| None | Cloud Build connection/repository/trigger creation | None | Not attempted; external GitHub App authorization is unresolved. |
| None | Database read query | None | Not attempted; no safe SQL client/authenticated read path was established. |
| None | Build/trigger/deployment | None | Not executed. |

## F. PREREQ-12 Completion

- Repository/config face: VERIFIED. Build-only `apps/admin/api/cloudbuild.api.build.yaml` is committed and pushed at Stage A; static comparison preserved the Docker build/push/image declarations, removed deploy, and left legacy `apps/admin/api/cloudbuild.api.yaml` unchanged.
- Cloud/source face: NOT VERIFIED. GitHub App installation is UNKNOWN; no Cloud Build connection, registered repository, or manual-only trigger exists.
- External blocker: `PREREQ12_CLOUD_FACE_BLOCKED_EXTERNAL_AUTHORIZATION`.
- Connection creation was not attempted because the necessary provider authorization is not established and the documented flow requires human browser authorization or an installed-app/token path not supplied here.
- Trigger name/ID: NONE.
- Trigger executed: NO.

`PREREQ-12 = UNVERIFIED_NO_EVIDENCE`

`PREREQ12_RESOLUTION = RESOLUTION_BLOCKED_EXTERNAL_REPOSITORY_AUTHORIZATION`

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

Strategy is documented and approved, but the required existing test identity/account and safe AuditLog inspection path have not been verified. No smoke test was executed.

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
| PREREQ-12 | Committed-source build isolation | UNVERIFIED_NO_EVIDENCE | Build-only config is committed/pushed, but GitHub App installation is UNKNOWN, no connection/repository/trigger exists, and external GitHub authorization is required. | UNVERIFIED_NO_EVIDENCE | `RESOLUTION_BLOCKED_EXTERNAL_REPOSITORY_AUTHORIZATION`; critical blocker. |
| PREREQ-13 | Safe smoke-test strategy | UNVERIFIED_NO_EVIDENCE | Human approved a synthetic, private, dedicated-account strategy; actual test account and AuditLog read path are not established. | PARTIALLY_VERIFIED | Strategy approved; account and observation path are pre-execution requirements. |

Counts: VERIFIED = 10; PARTIALLY_VERIFIED = 1; UNVERIFIED_NO_EVIDENCE = 2; total = 13.

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

PREREQ-12 remains blocked by unresolved external GitHub App/repository authorization. PREREQ-09 has no safe SQL SELECT path. PREREQ-13 has an approved strategy but an unverified live test identity and AuditLog observation path. Deployment may not begin automatically.

## O. Final CE Verdict

`EXEC-78G.10CE BLOCKED`