# EXEC-78G.10CC - FIU-1 Execution Blocker Resolution

Date: 2026-10-01

Verdict: `EXEC-78G.10CC BLOCKED`

Execution preparation classification: `FIU1_EXECUTION_PREPARATION_BLOCKED`

## A. Entry State

CB recorded `HUMAN_DECISION = FIU1_DEPLOYMENT_AUTHORIZED`, `DECISION_RECORDED = YES`, and `FIU1_DEPLOYMENT_AUTHORIZATION = GRANTED`.

CB commit: `cc517d8195dc100cc21d97fa449416343ef2578c`.

At CC entry, `FIU1_DEPLOYMENT_EXECUTION_READY = NO`. `PREREQ-12 — Committed-source build isolation` was a `CRITICAL EXECUTION BLOCKER`.

## B. Repository Preflight

| Item | Observation |
|---|---|
| Branch | `feature/work-in-progress` |
| Local HEAD | `cc517d8195dc100cc21d97fa449416343ef2578c` |
| Remote HEAD | `cc517d8195dc100cc21d97fa449416343ef2578c` |
| Divergence | ahead 0 / behind 0 |
| Staging | 0 files |
| Tracked modified | 8 known unrelated frontend files |
| Untracked | 55 pre-existing files |

CB proof was present, tracked, and its authorization/execution-blocker assertions matched the expected state.

## C. Runtime Revalidation

Read-only Cloud Run observations immediately before the authorized local configuration correction:

| Item | Observation |
|---|---|
| Project | `openstaff-platform` |
| Region | `europe-west1` |
| Environment | production, supported by live `api.openstaff.eu` mapping and committed runbook |
| Service | `openstaff-api` |
| Latest ready/created revision | `openstaff-api-00036-gx2` |
| Traffic | 100% to `openstaff-api-00036-gx2` |
| Image/digest | `europe-west1-docker.pkg.dev/openstaff-platform/openstaff-repo/openstaff-api@sha256:5e902870ca0644d9a6543c9078e2081ff2e48ab8607db2244987ae7e1bb44169` |
| Readiness | Ready, ConfigurationsReady, and RoutesReady were True |
| Service URL | `https://openstaff-api-bmv5rzc6zq-ew.a.run.app` |

Drift from CA: none observed for project, service, region, revision, traffic, image digest, or readiness. The configured workstation region differed at entry (`europe-west3`) and was corrected locally to `europe-west1` under the explicit authorization in this gate. Runtime facts remain snapshots and must be revalidated before future execution.

## D. Existing Cloud Build State

- Existing suitable trigger: NO. `gcloud builds triggers list --project=openstaff-platform` returned zero rows.
- Trigger name/source/branch-ref/config/event: NONE; no trigger exists to identify.
- Cloud Build repository connections in `europe-west1`: zero rows from the read-only connection listing.
- Repository integration: no Cloud Build repository connection capable of a committed-source trigger was established. A local Git remote alone does not prove a Cloud Build connection.
- Historical API build metadata: the inspected successful build used an uploaded Cloud Storage source archive and exposed no repository commit SHA in the inspected source metadata.
- Runbook: documents operator-workstation `gcloud builds submit` for the API.
- Committed build config: `apps/admin/api/cloudbuild.api.yaml`; the committed source was inspected with `git show HEAD:apps/admin/api/cloudbuild.api.yaml`.
- Committed `apps/admin/api/Dockerfile` builds from its supplied Cloud Build workspace/context; this does not establish that the supplied source is commit-isolated.

## E. Trigger Safety Design

No safe trigger design was formulated or created. No repository connection, committed branch/ref trigger, or safe event semantics were established.

The committed `cloudbuild.api.yaml` builds and pushes the API image, then contains a Cloud SDK step invoking `gcloud run deploy ${_API_SERVICE}`. This is an unauthorized deployment mutation under CC. Accordingly:

- Build configuration safety: `EXEC78G10CC_BUILD_CONFIG_UNSAFE`.
- Repository connection dependency: `EXEC78G10CC_REPOSITORY_CONNECTION_REQUIRED`.
- Trigger creation result: `EXEC78G10CC_TRIGGER_CREATION_BLOCKED`.
- Existing suitable trigger: NO.
- Proposed trigger name/repository/ref/event: NONE; no incomplete or unsafe trigger was created.

Because the committed build config itself deploys Cloud Run, it fails the required pre-creation checks `CLOUD_RUN_DEPLOY_IN_BUILD_CONFIG = NO` and `TRAFFIC_MUTATION_IN_BUILD_CONFIG = NO`. The committed config was not changed; repository configuration changes are outside CC scope.

## F. Authorized Mutation Record

| Mutation | Result |
|---|---|
| Cloud Build trigger created | NO - blocked by unsafe committed config and no established repository connection |
| Local gcloud region changed | YES - changed from `europe-west3` to `europe-west1` |
| Post-change `gcloud config get-value run/region` | `europe-west1` |
| Other cloud/repository mutation | NO |

The region correction changed workstation-local gcloud CLI configuration only. It did not modify Cloud Run, traffic, infrastructure, or repository files.

## G. PREREQ-12 Resolution

`PREREQ-12 = UNVERIFIED_NO_EVIDENCE`

The eight isolation conditions:

1. Trigger source is an existing repository integration: **NO**; no suitable Cloud Build connection/trigger was established.
2. Trigger consumes a committed Git revision: **NO**; no trigger or commit-pinned source mechanism was established.
3. Trigger references committed `cloudbuild.api.yaml`: **NO**; no trigger exists.
4. Local working-tree contents are not source input: **NO**; the current documented workstation submission path uploads local source, and no committed-source trigger was established.
5. The 8 unrelated tracked frontend modifications cannot enter trigger source until committed: **NOT ESTABLISHED**; no isolated trigger source was demonstrated.
6. The 55 pre-existing untracked files cannot enter trigger source: **NOT ESTABLISHED**; no isolated trigger source was demonstrated.
7. Trigger inspection confirms intended configuration: **NO**; no trigger exists.
8. No build was executed in CC: **YES**.

`SOURCE_IS_COMMITTED_REPOSITORY = NO`.
`BUILD_CONFIG_IS_COMMITTED = YES`.
`LOCAL_DIRTY_WORKTREE_CAN_CONTAMINATE_BUILD = YES` for a local-directory source upload; exclusion was not demonstrated.
`BUILD_EXECUTION_IN_CC = NO`.
`CLOUD_RUN_DEPLOY_IN_BUILD_CONFIG = YES`.
`TRAFFIC_MUTATION_IN_BUILD_CONFIG = YES` because the build config invokes `gcloud run deploy`, which may change the served revision/traffic.
`EXISTING_SUITABLE_TRIGGER = NO`.
`REPOSITORY_CONNECTION_VERIFIED = NO`.

No build, trigger, image, revision, or traffic operation was executed. The unresolved condition remains a `CRITICAL EXECUTION BLOCKER`.

## H. Remaining Prerequisites

- PREREQ-07 - Deployment operator ownership: `UNVERIFIED_NO_EVIDENCE`. No accountable human operator/escalation owner was established.
- PREREQ-09 - AuditLog/database observation: `UNVERIFIED_NO_EVIDENCE`. No safe table-level FIU-1 AuditLog inspection capability was established.
- PREREQ-13 - Safe smoke-test capability: `UNVERIFIED_NO_EVIDENCE`. No live identity/account context or safe data/side-effect strategy was established. No smoke test was run.

## I. Execution Preparation Classification

`FIU1_EXECUTION_PREPARATION_BLOCKED`

PREREQ-12 remains unresolved; PREREQ-07, PREREQ-09, and PREREQ-13 also remain unverified. Human FIU-1 authorization remains granted, but it does not override the technical blocker or establish execution readiness.

## J. No-Deployment Attestation

- Deployment performed: `NO`.
- Cloud Build executed: `NO`.
- Cloud Build trigger executed: `NO`.
- Cloud Run revision created by CC: `NO`.
- Cloud Run traffic changed: `NO`.
- Production database mutated: `NO`.
- Live write smoke tests performed: `NO`.

No deployment, build, trigger, Cloud Run update, traffic operation, database mutation, or live write operation was performed.

## K. Governance Non-Effect

| Governance item | Preserved state |
|---|---|
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| Human FIU-1 authorization | `GRANTED` |
| Deployment performed | NO |

CC does not establish general governance authority, change candidate readiness, authorize B4 or G.11, reconstruct BN, or create Response, Participation, acting entity, governance authority, or a compliance determination engine.
