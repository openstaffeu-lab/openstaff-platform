# EXEC-78G.10CD - FIU-1 Build/Deploy Separation & Committed-Source Integration

Date: 2026-10-01

Verdict: `EXEC-78G.10CD BLOCKED`

Execution readiness: `FIU1_EXECUTION_STILL_BLOCKED`

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
- Build-only config committed and pushed: YES; Stage A commit `21ad9be3371df6f45a6e29908d78c002b6160a95`.

## D. Repository Integration Discovery

- Repository provider from local Git remote: GitHub (`openstaffeu-lab/openstaff-platform`). This does not establish a Cloud Build repository connection.
- Cloud Build triggers: zero listed in `openstaff-platform`.
- Cloud Build connections: zero listed in the queried `europe-west1`, `europe-west3`, and `us-central1` regions.
- Cloud Build repository inventory: could not be listed without a connection; no connection exists to supply.
- Repository connection: NONE ESTABLISHED.
- Registered repository: NONE ESTABLISHED.
- Manual trigger: NONE.
- Installed CLI supports a manual trigger command with a GitHub repository reference, but no project repository integration/authorization was established by read-only inspection.
- Trigger creation classification: `EXEC78G10CD_REPOSITORY_CONNECTION_REQUIRED` and `EXEC78G10CD_TRIGGER_CREATION_BLOCKED`.
- Required human/provider action: establish or authorize a Cloud Build GitHub repository integration for `openstaffeu-lab/openstaff-platform`. The provider-specific approval/installation step and accountable administrator were not established; no connection was attempted or created.

## E. Trigger Safety Design

No trigger design is safe to instantiate until an existing authorized repository integration is established and its source/ref semantics are verified. The CLI documents a manual GitHub trigger form, but no usable project connection or registered repository was observed. Therefore no exact trigger configuration was created or inferred.

- `REPOSITORY_CONNECTION_VERIFIED = NO`.
- `REGISTERED_REPOSITORY_VERIFIED = NO`.
- `BUILD_ONLY_CONFIG_COMMITTED_REMOTE = YES` after Stage A.
- `BUILD_ONLY_CONFIG_CONTAINS_DEPLOY = NO`.
- `TRIGGER_AUTOMATIC_EVENT = NOT APPLICABLE`; no trigger exists.
- `LOCAL_WORKTREE_SOURCE = NOT ESTABLISHED` for a repository trigger because no integration exists.
- `TRIGGER_CREATION_EXECUTES_BUILD = NOT TESTED`; no trigger was created or executed.

Trigger creation remains blocked by `EXEC78G10CD_REPOSITORY_CONNECTION_REQUIRED`. No source upload, build, or trigger action was attempted.

## F. Mutation Log

Only the authorized Stage A repository commit/push occurred. The push command output did not include a timestamp; none is inferred.

| Timestamp (UTC) | Operation | Resource | Result |
|---|---|---|---|
| `2026-10-01T16:42:05+03:00` (commit metadata) | Stage A commit `21ad9be3371df6f45a6e29908d78c002b6160a95` | `feature/work-in-progress` | Committed the exact four authorized paths. |
| Not captured by command output (`2026-10-01`) | `git push origin feature/work-in-progress` | `origin/feature/work-in-progress` | PASS; remote advanced `e7e6d11..21ad9be`. |
| No timestamp recorded | Cloud Build connection/repository/trigger creation | None | Not attempted; blocked by missing established repository integration and authorization. |

## G. Cloud Connection Result

`RESOLUTION_BLOCKED_MISSING_REPO_CONNECTION`

No connection or repository registration exists in the queried locations. The local Git remote identifies GitHub, and the installed gcloud documents a manual GitHub trigger form, but this does not establish a usable Cloud Build repository connection or provider authorization. Human/provider integration approval is required before a trigger can be considered.

## H. Manual Trigger Result

`EXEC78G10CD_TRIGGER_CREATION_BLOCKED`

Trigger name: NONE. Trigger ID: NONE. Repository/config/event binding: NONE. No trigger was created or executed; no build was run.

## I. PREREQ-12 Final Result

`PREREQ-12 = UNVERIFIED_NO_EVIDENCE`

Repository-config face: PASS. The build-only config is committed and pushed; build/push and image declarations are preserved; the legacy build+deploy config is unchanged; the build-only config contains no deployment or other prohibited mutation.

Cloud-integration face: BLOCKED. There is no established repository connection, registered repository, manual-only trigger, or trigger read-back.

Isolation conditions:

1. Existing repository integration: NO.
2. Trigger consumes a committed Git revision: NO TRIGGER / NOT PROVEN.
3. Trigger references committed `apps/admin/api/cloudbuild.api.build.yaml`: NO TRIGGER.
4. Local working-tree content excluded as source: NOT ESTABLISHED.
5. Eight unrelated tracked frontend modifications excluded from trigger source: NOT ESTABLISHED.
6. Fifty-five pre-existing untracked files excluded from trigger source: NOT ESTABLISHED.
7. Trigger inspection confirms intended configuration: NO TRIGGER.
8. No build was executed in CD: YES.

`PREREQ12_RESOLUTION = RESOLUTION_BLOCKED_MISSING_REPO_CONNECTION`

## J. Remaining Prerequisites

- PREREQ-07: `UNVERIFIED_NO_EVIDENCE` - accountable human operator not established.
- PREREQ-09: `UNVERIFIED_NO_EVIDENCE` - safe AuditLog/database observation not established.
- PREREQ-13: `UNVERIFIED_NO_EVIDENCE` - safe live smoke-test strategy not established.

## K. Execution Preparation Classification

`FIU1_EXECUTION_STILL_BLOCKED`

PREREQ-12 remains unverified. Human FIU-1 authorization does not resolve this technical blocker.

## L. No-Build / No-Deploy Attestation

Final CD attestation:

- Cloud Build executed: `NO`.
- Cloud Build trigger executed: `NO`.
- Cloud Run deploy executed: `NO`.
- Cloud Run revision created by CD: `NO`.
- Cloud Run traffic changed: `NO`.
- Production database accessed by CD: `NO`.
- Live write smoke tests performed: `NO`.

## M. Governance Non-Effect

| Governance item | Preserved state |
|---|---|
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| Human FIU-1 authorization | `GRANTED` |
| Deployment performed | NO |

CD does not authorize B4 or G.11, change candidate readiness, reconstruct BN, or implement application/governance behavior.
