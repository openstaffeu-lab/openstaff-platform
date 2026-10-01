# EXEC-78G.10CD - FIU-1 Build/Deploy Separation & Committed-Source Integration

Date: 2026-10-01

Status: `IN_PROGRESS - STAGE A BUILD/DEPLOY SEPARATION`

## A. Entry State

CC result: `EXEC-78G.10CC BLOCKED`.

CB human authorization: `GRANTED` for continuation of the FIU-1 deployment sequence only.

CC commit: `e7e6d11ad7520bc50956b7c948e95690e63b6d24`.

At entry, `FIU1_EXECUTION_PREPARATION_BLOCKED`; PREREQ-12 was an unresolved `CRITICAL EXECUTION BLOCKER`.

Repository baseline at entry:

- branch: `feature/work-in-progress`
- local and remote HEAD: `e7e6d11ad7520bc50956b7c948e95690e63b6d24`
- divergence: 0 ahead / 0 behind
- tracked modified: 8 known unrelated frontend paths
- untracked: 55 pre-existing files
- staged: 0

## B. CC Blocker Decomposition

| Face | Entry evidence/state |
|---|---|
| `PREREQ12_REPOSITORY_CONFIG_FACE` | Committed `apps/admin/api/cloudbuild.api.yaml` contains Docker build and push followed by `gcloud run deploy`; it is not safe as a build-only trigger config. |
| `PREREQ12_CLOUD_SOURCE_INTEGRATION_FACE` | CC observed zero Cloud Build triggers and zero repository connections in `europe-west1`; no committed-source trigger was established. |

## C. Build/Deploy Separation Design

- Legacy config: `apps/admin/api/cloudbuild.api.yaml`.
- Legacy config modified: `NO`.
- Build-only config: `apps/admin/api/cloudbuild.api.build.yaml`.
- Build-only config contains deploy: `NO`.
- Intended scope: Docker build and image push for `openstaff-api`; no Cloud Run, traffic, database, environment, or IAM operation.
- `ORIGINAL_CONFIG_UNCHANGED = YES`.
- `BUILD_STEPS_PRESERVED = YES`; the Docker build step, Dockerfile/context, image tags, and build options were compared to the committed legacy config.
- `IMAGE_PUSH_PRESERVED = YES`; Docker push and image declarations match the legacy config.
- `DEPLOY_STEP_REMOVED = YES`.
- `CLOUD_RUN_MUTATION_PRESENT = NO`; `TRAFFIC_MUTATION_PRESENT = NO`; `DATABASE_MUTATION_PRESENT = NO`; `IAM_MUTATION_PRESENT = NO`; `NESTED_LOCAL_SOURCE_BUILD_PRESENT = NO`.
- Static/configuration checks only; the build config was not executed.
- Stage A build-only config commit/push: pending.

## D. Cloud Integration State

- Repository provider from local Git remote: GitHub (`openstaffeu-lab/openstaff-platform`). This does not establish a Cloud Build repository connection.
- Cloud Build triggers: zero listed in `openstaff-platform`.
- Cloud Build connections: zero listed in the queried `europe-west1` and `us-central1` regions.
- Repository connection: `NOT YET ESTABLISHED`.
- Manual trigger: `NOT YET ESTABLISHED`.
- Existing connection/trigger state is not sufficient to create a committed-source trigger.

## E. Mutation Log

No mutation records have yet been entered. Actual repository commit/push events and any authorized local/cloud mutations will be added after they occur; no timestamps are fabricated.

| Timestamp (UTC) | Operation | Resource | Result |
|---|---|---|---|

## F. Cloud Connection Result

Pending source-integration discovery. No connection, repository registration, or trigger has been created. Trigger creation requires a verified integration and safe manual-only semantics; provider authorization requirements are not yet established.

## G. Manual Trigger Result

No trigger exists or has been created. No build was executed.

## H. PREREQ-12 Initial Result

`PREREQ-12 = UNVERIFIED_NO_EVIDENCE`

The Stage A build-only config is being separated from the legacy deploy config. PREREQ-12 will remain unverified until both the repository-config face and committed-source cloud-integration face are proven.

## I. Remaining Prerequisites

- PREREQ-07: `UNVERIFIED_NO_EVIDENCE` - accountable human operator not established.
- PREREQ-09: `UNVERIFIED_NO_EVIDENCE` - safe AuditLog/database observation not established.
- PREREQ-13: `UNVERIFIED_NO_EVIDENCE` - safe live smoke-test strategy not established.

## J. No-Build / No-Deploy Attestation

At the start of CD Stage A:

- Cloud Build executed: `NO`.
- Cloud Build trigger executed: `NO`.
- Cloud Run deploy executed: `NO`.
- Cloud Run revision created by CD: `NO`.
- Cloud Run traffic changed: `NO`.
- Production database accessed by CD: `NO`.
- Live write smoke tests performed: `NO`.

## K. Governance Non-Effect

| Governance item | Preserved state |
|---|---|
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| Human FIU-1 authorization | `GRANTED` |
| Deployment performed | NO |

CD does not authorize B4 or G.11, change candidate readiness, reconstruct BN, or implement application/governance behavior.
