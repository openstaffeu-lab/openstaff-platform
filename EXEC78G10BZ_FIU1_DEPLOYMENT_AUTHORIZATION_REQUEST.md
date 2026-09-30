# EXEC-78G.10BZ - FIU-1 Deployment Authorization Request

Date: 2026-09-30

Request status: `DEPLOYMENT_AUTHORIZATION_REQUEST_FORMULATED`

Request completeness: `FIU1_DEPLOYMENT_AUTHORIZATION_REQUEST_COMPLETE`

## A. Executive Gate Context

BY verdict: `EXEC-78G.10BY PASS WITH DEFERRALS`.

BY authorization-readiness classification: `FIU1_AUTHORIZATION_REQUEST_READY_WITH_MITIGATIONS`.

- BY proof commit: `c9d8bebff42cb5fb8e6f245a8cbf1090b2bee21f` - `EXISTING_EVIDENCE`.
- FIU-1 implementation commit: `8fda1b5bd9a859c4af4e1ecf4a72f52f67623456` - `EXISTING_EVIDENCE`.
- BX finalization commit: `34a4af7abf1353909b3432481cf70ff671c209ff` - `EXISTING_EVIDENCE`.

`EXEC-78G.10BZ formulates a deployment authorization request only.`

`No deployment is performed.`

`No deployment authorization is granted.`

This request is addressed to the human repository owner. BZ records no owner decision and performs no operational verification that mutates infrastructure.

## B. Deployment Target Package

| Item | Classification | Evidence or required confirmation |
|---|---|---|
| Deployment surface: backend/API only | `EXISTING_EVIDENCE` | BX records that the FIU-1 commit changes API implementation/tests only. |
| Platform: Google Cloud Run | `EXISTING_EVIDENCE` | BX and the committed API Cloud Build configuration identify Cloud Run. |
| Service: `openstaff-api` | `EXISTING_EVIDENCE` | BX, `apps/admin/api/cloudbuild.api.yaml`, and the deployment runbook name this service. |
| Build artifact: `apps/admin/api/Dockerfile` | `EXISTING_EVIDENCE` | The API Cloud Build configuration builds this Dockerfile. |
| Deployment configuration: `apps/admin/api/cloudbuild.api.yaml` | `EXISTING_EVIDENCE` | This repository configuration builds/pushes the API image and defines a Cloud Run deploy step. |
| Migration required: NO | `EXISTING_EVIDENCE` | FIU-1 adds no schema/migration change and uses existing AuditLog fields. |
| New environment variables required: NO | `EXISTING_EVIDENCE` | BX found no new FIU-1 configuration or environment-variable references. |
| Frontend deployment required: NO | `EXISTING_EVIDENCE` | FIU-1 changes no frontend or external response contract. |
| Worker deployment required: NO | `EXISTING_EVIDENCE` | FIU-1 has no worker/service code changes. |
| External API contract change: NO | `EXISTING_EVIDENCE` | BX verified the existing Project response mapping and contract are unchanged. |
| Exact live GCP project, region, and environment | `VERIFICATION_PREREQUISITE` | Confirm the actual target at execution time; repository defaults are not proof of the live target. |
| Current serving revision, image digest, and Artifact Registry destination | `VERIFICATION_PREREQUISITE` | Capture and verify against the live service before any deployment. |
| Deployment/runtime service accounts | `VERIFICATION_PREREQUISITE` | Confirm actual service identities and required authorized operator access. |

The committed deployment config and runbook contain defaults and historical topology references, including project `openstaff-platform`, region `europe-west1`, API service `openstaff-api`, and repository `openstaff-repo` - each is `EXISTING_EVIDENCE` as a repository-documented value only. These values do not establish the current live target; confirming exact values remains a `VERIFICATION_PREREQUISITE`.

## C. BX Risk Register and BY Mitigation Status

The ten BX severities and five BY mitigation classifications are preserved without upgrade.

| Risk | BX severity | Source classification | BY mitigation classification / residual state |
|---|---|---|---|
| Additive AuditLog writes | MEDIUM | `EXISTING_EVIDENCE` | `PARTIALLY_MITIGATED_WITHOUT_CODE` |
| Audit-write latency | MEDIUM | `EXISTING_EVIDENCE` | `PARTIALLY_MITIGATED_WITHOUT_CODE` |
| AuditService availability | MEDIUM | `EXISTING_EVIDENCE` | `UNVERIFIED_OPERATIONAL_DEPENDENCY` |
| Best-effort evidence gaps | MEDIUM | `EXISTING_EVIDENCE` | `PARTIALLY_MITIGATED_WITHOUT_CODE` |
| DI registration | LOW | `EXISTING_EVIDENCE` | BY low-risk confirmation; deployment-start verification remains outstanding (`VERIFICATION_PREREQUISITE`) |
| Request metadata propagation | LOW | `EXISTING_EVIDENCE` | BY low-risk confirmation; approved evidence sample verification remains outstanding (`VERIFICATION_PREREQUISITE`) |
| AuditLog volume | MEDIUM | `EXISTING_EVIDENCE` | `UNVERIFIED_OPERATIONAL_DEPENDENCY` |
| Rollback simplicity | LOW | `EXISTING_EVIDENCE` | BY low-risk confirmation; live rollback target/access remain outstanding (`VERIFICATION_PREREQUISITE`) |
| Database compatibility | LOW | `EXISTING_EVIDENCE` | BY low-risk confirmation; target schema compatibility remains outstanding (`VERIFICATION_PREREQUISITE`) |
| Frontend compatibility | LOW | `EXISTING_EVIDENCE` | BY low-risk confirmation; API health/contract verification remains outstanding (`VERIFICATION_PREREQUISITE`) |

### BY deferrals

- Automated AuditLog volume alerting is not proven as an existing configured control - `EXISTING_EVIDENCE`. Adding/configuring an alert is a `PROPOSED_CONTROL`; confirming required configuration and alert ownership before execution is a `VERIFICATION_PREREQUISITE`. BZ creates no alert.
- Durable automatic evidence reconciliation is deferred code work - `EXISTING_EVIDENCE` of the BY deferral. It is not part of FIU-1 and is not an FIU-1 guarantee. It is not automatically a blocker for the accepted best-effort scope. Residual risk: successful Project writes may lack durable evidence, and manual correlation is not complete or guaranteed.
- No FIU-1 exactly-once guarantee exists - `EXISTING_EVIDENCE` in the BY risk assessment. Do not interpret AuditLog evidence as authoritative business state.

## D. Execution Verification Prerequisites

Each row is a `VERIFICATION_PREREQUISITE`. The repository values shown are evidence of documented defaults/history only, not verification of the live target. All execution-blocking prerequisites must be confirmed before any deployment execution.

| ID | Classification | Required evidence before execution |
|---|---|---|
| PREREQ-01 - Exact GCP project | `VERIFICATION_PREREQUISITE` | Confirm the exact project containing the target `openstaff-api`. Runbook/config document `openstaff-platform` as a default, not a live confirmation. |
| PREREQ-02 - Exact Cloud Run region | `VERIFICATION_PREREQUISITE` | Confirm the target service's actual region. Config defaults to `europe-west1`; that does not establish live placement. |
| PREREQ-03 - Target environment | `VERIFICATION_PREREQUISITE` | Explicitly identify production, staging, or other target and its approval boundary. |
| PREREQ-04 - Current serving revision | `VERIFICATION_PREREQUISITE` | Capture current Cloud Run revision, image digest, and traffic state. Runbook's EXEC-25 revision reference is historical, not current verification. |
| PREREQ-05 - Previous known-good rollback revision | `VERIFICATION_PREREQUISITE` | Verify the previous revision/image still exists, is usable, and is the approved rollback target. |
| PREREQ-06 - Rollback operational access | `VERIFICATION_PREREQUISITE` | Confirm the authorized operator can execute the approved rollback mechanism. |
| PREREQ-07 - Deployment operator ownership | `VERIFICATION_PREREQUISITE` | Identify the human/operator responsible for deployment, decision recording, and escalation. |
| PREREQ-08 - Runtime log access | `VERIFICATION_PREREQUISITE` | Confirm ability to inspect relevant Cloud Run/application errors and preserve request identifiers. |
| PREREQ-09 - AuditLog/database observation | `VERIFICATION_PREREQUISITE` | Confirm safe read-only access to inspect expected FIU-1 evidence and abnormal volume. |
| PREREQ-10 - AuditService failure observability | `VERIFICATION_PREREQUISITE` | Confirm audit persistence failures can be detected in the target runtime logs and correlated. |
| PREREQ-11 - Latency observability | `VERIFICATION_PREREQUISITE` | Confirm a usable Project-write/API latency baseline and a comparable post-deployment measurement source. |
| PREREQ-12 - Committed-source build isolation | `VERIFICATION_PREREQUISITE` | Prove a future build packages only the selected synchronized committed source and excludes this local dirty worktree: 8 unrelated tracked frontend modifications and 55 unrelated/deferred untracked files. This is CRITICAL. |
| PREREQ-13 - Safe smoke-test capability | `VERIFICATION_PREREQUISITE` | For any mutation test, confirm authorized account/context, safe target environment/data strategy, and understood business side effects. BZ creates or uses no credentials. |

## E. Authorization Blocking Rule

`REQUEST_READY = YES` - this document formulates a complete decision request.

`EXECUTION_PREREQUISITES_SATISFIED = NO` - the operational prerequisites above have not been verified by BZ.

Even if the human owner later returns `FIU1_DEPLOYMENT_AUTHORIZED`, deployment execution MUST NOT begin until all execution-blocking prerequisites are verified and recorded. Human authorization does not convert an unknown target project, serving/rollback revision, committed-source build mechanism, or operational access into a verified fact.

## F. Rollback Plan Summary

No rollback action is performed or authorized by BZ.

Preferred operational rollback - each step is a `PROPOSED_CONTROL` for a separately authorized execution:

1. `PROPOSED_CONTROL` - identify and record the current pre-FIU-1 known-good Cloud Run revision/image; exact revision is a `VERIFICATION_PREREQUISITE`.
2. `PROPOSED_CONTROL` - preserve its identity before deployment.
3. `PROPOSED_CONTROL` - if rollback is required, restore/redirect service traffic using the repository/platform-approved mechanism; exact operational rollback access is a `VERIFICATION_PREREQUISITE`.
4. `PROPOSED_CONTROL` - verify backend health.
5. `PROPOSED_CONTROL` - verify Project read behavior.
6. `PROPOSED_CONTROL` - verify Project write continuity only where safely authorized.

Source rollback fallback - a `PROPOSED_CONTROL`: create a NEW FIU-1 revert commit, validate it, pass normal governance, push normally, and separately authorize redeployment. Do not rewrite history, reset, or force-push. Do not delete historical AuditLog records.

| Rollback item | Classification / result |
|---|---|
| Schema rollback required | NO - `EXISTING_EVIDENCE` |
| Migration rollback required | NO - `EXISTING_EVIDENCE` |
| AuditLog historical deletion required | NO - `EXISTING_EVIDENCE`; records are additive historical data |
| Exact previous known-good revision | `VERIFICATION_PREREQUISITE` |
| Exact operational rollback access | `VERIFICATION_PREREQUISITE` |

## G. Proposed Pre-Deployment Controls

Each item is a `PROPOSED_CONTROL`; none is executed or established as a current operational control by BZ.

1. `PROPOSED_CONTROL` - verify branch and remote synchronization for the chosen source commit.
2. `PROPOSED_CONTROL` - verify the separately governed deployment candidate and its approval state.
3. `PROPOSED_CONTROL` - verify ancestry and exact source identity of FIU-1 commit `8fda1b5bd9a859c4af4e1ecf4a72f52f67623456`.
4. `PROPOSED_CONTROL` - run targeted FIU-1 Jest; expected result is 3 suites / 13 tests, as already recorded by BX.
5. `PROPOSED_CONTROL` - build the backend/API from the selected committed source.
6. `PROPOSED_CONTROL` - run targeted ESLint and record warnings/errors.
7. `PROPOSED_CONTROL` - inspect the selected API Dockerfile and Cloud Build configuration.
8. `PROPOSED_CONTROL` - confirm exact GCP project, region, environment, and service; values remain execution prerequisites.
9. `PROPOSED_CONTROL` - capture and verify previous known-good rollback revision/image and rollback access.
10. `PROPOSED_CONTROL` - verify committed-source build isolation; exclude dirty local frontend/untracked files.
11. `PROPOSED_CONTROL` - verify the responsible operator's log, database/AuditLog, failure, and latency observation capabilities.

## H. Proposed Post-Deployment Controls

Each item is a `PROPOSED_CONTROL` for a later authorized execution; BZ performs none of these.

- `PROPOSED_CONTROL` - verify Cloud Run revision readiness and deployed artifact/revision identity.
- `PROPOSED_CONTROL` - check API service health.
- `PROPOSED_CONTROL` - perform Project read smoke.
- `PROPOSED_CONTROL` - perform Project create smoke only if explicitly authorized and safe.
- `PROPOSED_CONTROL` - perform Project update smoke only if explicitly authorized and safe.
- `PROPOSED_CONTROL` - perform permission-negative smoke only if explicitly authorized and safe.
- `PROPOSED_CONTROL` - inspect AuditLog evidence and verify only the approved allowlisted evidence is present.
- `PROPOSED_CONTROL` - observe AuditService persistence failures and Project business-write outcomes.
- `PROPOSED_CONTROL` - compare Project-write/API latency against the approved baseline.
- `PROPOSED_CONTROL` - observe AuditLog volume and database/storage pressure.
- `PROPOSED_CONTROL` - observe runtime 5xx/errors.
- `PROPOSED_CONTROL` - apply the approved stop/rollback decision gate.

## I. Qualitative Stop and Rollback Conditions

Each condition is a `PROPOSED_CONTROL`, not an existing production alert. No numeric production threshold is established. If later authorization adopts a numeric threshold, label it `PROPOSED_THRESHOLD_FOR_DEPLOYMENT_AUTHORIZATION`.

A future deployment should enter stop/rollback evaluation under these `PROPOSED_CONTROL` conditions:

- Cloud Run revision unhealthy or artifact/revision mismatch;
- material new FIU-1-associated 5xx behavior;
- Project create/update regression or permission regression;
- sensitive evidence leakage or dependency-injection failure;
- repeated AuditService persistence failure or unexplained material evidence loss;
- material Project-write latency regression;
- unexpected AuditLog growth or database/storage pressure.

The operator must stop further rollout progression, preserve relevant revision/request/error identifiers, determine business-write impact, and use the separately approved rollback/escalation procedure. These are proposed actions, not actions performed by BZ.

## J. Best-Effort Semantics and Safe Smoke Boundary

`BEST_EFFORT_WITH_ERROR_VISIBILITY` - `EXISTING_EVIDENCE` from FIU-1/BX.

FIU-1 does not guarantee durable exactly-once governance evidence. A successful Project business write may remain successful when evidence persistence fails. This is the accepted FIU-1 design boundary. Repeated or material evidence loss is an operational escalation/rollback-evaluation condition. AuditLog evidence is additive and is not authoritative business state.

Smoke-test boundaries:

- Read-only health/read smoke - `PROPOSED_CONTROL` for a later authorized gate only.
- Controlled Project write smoke - `PROPOSED_CONTROL`; requires verified target, authorized account/context, and safe data strategy (`VERIFICATION_PREREQUISITE`).
- Negative-permission smoke - `PROPOSED_CONTROL`; requires explicit authorization and safe test context (`VERIFICATION_PREREQUISITE`).
- Destructive testing or production AuditService fault injection - not authorized and not proposed for this request.

BZ performs none of these tests.

## K. Human Deployment Authorization Decision Requested

The human repository owner is requested to return exactly ONE of:

- `FIU1_DEPLOYMENT_AUTHORIZED`
- `FIU1_DEPLOYMENT_DENIED`
- `FIU1_DEPLOYMENT_DEFERRED`

Decision recorded by BZ: `NO`.

- `FIU1_DEPLOYMENT_AUTHORIZED` means approval to proceed to a separate execution-prerequisite verification/deployment gate. It does not waive unresolved technical prerequisites.
- `FIU1_DEPLOYMENT_DENIED` means no FIU-1 deployment execution may proceed.
- `FIU1_DEPLOYMENT_DEFERRED` means deployment remains pending; no execution may proceed until a later human decision.

BZ requests the decision and does not make it. `FIU1_DEPLOYMENT_AUTHORIZED` is separate from `B4 AUTHORIZED`; even after a human FIU-1 deployment authorization, B4 and G.11 remain `BLOCKED - NOT AUTHORIZED` unless separately authorized.

## L. Governance Non-Effect

`EXEC-78G.10BZ is a deployment authorization request formulation only.`

It does not deploy FIU-1; authorize deployment; execute Cloud Build; modify Cloud Run or traffic; activate governance authority; change candidate readiness; authorize B4 or G.11; reconstruct BN; create Response, Participation, acting entity, or governance authority; or create a compliance determination engine.

| Governance item | Preserved state |
|---|---|
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| Deployment performed | NO |
| Deployment authorized | NO |
| Decision requested | YES |

## M. Request Completeness and BZ Verdict

`FIU1_DEPLOYMENT_AUTHORIZATION_REQUEST_COMPLETE`

The request includes deployment scope and evidence classifications, all ten BX risks and unchanged severities, all five BY mitigation classifications, BY deferrals, 13 execution prerequisites, rollback plan, proposed pre/post controls, qualitative stop conditions, best-effort semantics, safe smoke boundaries, human decision options, and governance non-effect.

`EXEC-78G.10BZ PASS`

PASS means `DEPLOYMENT_AUTHORIZATION_REQUEST_FORMULATED`. It does not mean `DEPLOYMENT_AUTHORIZED`. No operational prerequisite is represented as satisfied unless the cited committed evidence supports it; live execution prerequisites remain unverified.
