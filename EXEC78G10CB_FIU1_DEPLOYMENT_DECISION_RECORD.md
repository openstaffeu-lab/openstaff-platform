# EXEC-78G.10CB - FIU-1 Deployment Decision Record

Date: 2026-10-01

CB result: `FIU1_DEPLOYMENT_AUTHORIZATION_RECORDED`

## A. Executive Gate Context

CA result: `EXEC-78G.10CA PASS WITH GAPS`.

CA classification: `FIU1_DECISION_READY_WITH_GAPS`.

CA commit: `4c4b4c69ee49c5802ca8aa566b2e257fbed82e71`.

CA verified 9 prerequisites; 4 remain unresolved: PREREQ-07, PREREQ-09, PREREQ-12, and PREREQ-13. `PREREQ-12 — Committed-source build isolation` remains a `CRITICAL EXECUTION BLOCKER`.

`EXEC-78G.10CB is a documentation-only human governance decision recording gate.` CB does not deploy FIU-1, resolve execution blockers, execute operational remediation, or start another gate.

## B. Human Owner Decision

`HUMAN_DECISION = FIU1_DEPLOYMENT_AUTHORIZED`

`DECISION_RECORDED = YES`

`FIU1_DEPLOYMENT_AUTHORIZATION = GRANTED`

The human repository owner authorizes continuation of the FIU-1 deployment sequence toward execution preparation. No human identity or additional rationale is asserted.

## C. Authorization Boundary

`FIU1_DEPLOYMENT_EXECUTION_READY = NO`

Reason: `PREREQ-12 — Committed-source build isolation` remains unresolved and is a critical execution blocker.

deployment performed = `NO`
- The decision does not authorize immediate deployment, Cloud Build execution, Cloud Run changes, or traffic changes.
- The decision does not waive any unresolved prerequisite, including PREREQ-12.

## D. Verified Deployment Context

These are CA-time read-only observations, not assertions that mutable runtime facts remain current.

| Item | CA observation |
|---|---|
| Project | `openstaff-platform` |
| Region | `europe-west1` |
| Environment | `production` |
| Service | `openstaff-api` |
| Serving revision | `openstaff-api-00036-gx2` |
| Traffic | `100%` |
| Image digest | `sha256:5e902870ca0644d9a6543c9078e2081ff2e48ab8607db2244987ae7e1bb44169` |
| Technical rollback capability | `VERIFIED AT CA` |
| Runtime log access | `VERIFIED AT CA` |
| AuditService failure observability | `VERIFIED AT CA` |
| Latency observability | `VERIFIED AT CA - SERVICE-WIDE`; not Project-write-specific |

All mutable runtime facts, revision identity/health, traffic, image, access, and region require immediate revalidation before any future deployment execution.

## E. Remaining Execution Gaps

| Prerequisite | CA result | CB state |
|---|---|---|
| PREREQ-07 - Deployment operator ownership | `UNVERIFIED_NO_EVIDENCE` | Unresolved; CB does not establish an owner. |
| PREREQ-09 - AuditLog/database observation access | `UNVERIFIED_NO_EVIDENCE` | Unresolved; Cloud SQL existence does not establish safe table-level inspection. |
| PREREQ-12 - Committed-source build isolation | `UNVERIFIED_NO_EVIDENCE - CRITICAL EXECUTION BLOCKER` | Unresolved; no build-source isolation is established. |
| PREREQ-13 - Safe smoke-test capability | `UNVERIFIED_NO_EVIDENCE` | Unresolved; no safe live identity/data/side-effect strategy is established. |

## F. Build Isolation Boundary

- Committed-source isolation established: `NO`.
- Current dirty-worktree deployment proven safe: `NO`.
- `gcloud builds submit .` from the current dirty worktree permitted: `NO`.
- Blocker resolution required before deployment: `YES`.

CA observed no Cloud Build triggers and a historical API build from an uploaded Cloud Storage source archive without an inspected commit SHA; the committed runbook documents operator-workstation `gcloud builds submit`. CA did not establish that the intended future build consumes a synchronized committed revision independently of local source.

At CB entry the intended committed revision is `4c4b4c69ee49c5802ca8aa566b2e257fbed82e71`, or a later specifically governed commit created solely to resolve the blocker. A future gate must establish a source/build mechanism derived from that intended committed revision and prove it excludes the 8 unrelated tracked frontend modifications, 55 pre-existing untracked files, unrelated local artifacts, and deferred governance artifacts. CB does not implement this mechanism.

## G. Next Permitted Activity

`EXECUTION_BLOCKER_RESOLUTION_GATE_REQUIRED`

The next permitted activity is a separate gate to resolve committed-source build isolation and other execution-preparation gaps. CB does not execute or begin that gate automatically.

## H. Governance Non-Effect

The authorization applies only to continuation of the FIU-1 deployment sequence. It does not authorize B4 or G.11, change candidate readiness, or reconstruct BN.

| Governance item | Preserved state |
|---|---|
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| Response implementation | NO |
| Participation implementation | NO |
| Acting entity established | NO |
| Governance authority established | NO |
| Deployment performed | NO |

CB does not close governance blockers or create Response, Participation, acting entity, governance authority, enforcement semantics, or a compliance determination engine.
