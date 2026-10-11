# EXEC-78G.10CG - FIU-1 AuditLog Read-Path Verification

Date: 2026-10-11

Verdict: `EXEC-78G.10CG BLOCKED - SAFE_AUDITLOG_READ_PATH_NOT_VERIFIED`

Execution readiness: `FIU1_EXECUTION_STILL_BLOCKED`

Evidence publication before CG-P1 remote verification: `PENDING`

## A. Verification Boundary

EXEC-78G.10CG verifies whether FIU-1 has a safe, existing, read-only AuditLog observation path suitable for future smoke-test evidence inspection.

CG verification work is complete with a technical verdict of BLOCKED. Evidence publication remains pending until the separate CG-P1 publication gate commits, pushes, and verifies this document on the live remote branch.

This gate is read-only. It does not perform a build, trigger invocation, deployment, Cloud Run mutation, database write, production smoke test, IAM change, secret value read, credential workaround, application-code change, schema or migration change, frontend change, reset, clean, stash, rebase, force push, or unrelated-work deletion.

## B. Repository Preflight

| Item | Observation |
|---|---|
| Origin | `https://github.com/openstaffeu-lab/openstaff-platform.git` |
| Branch | `feature/work-in-progress` |
| Entry local SHA | `f66e9a2e52108899d11ffc23fa21985f3522c1b8` |
| Entry remote SHA | `f66e9a2e52108899d11ffc23fa21985f3522c1b8` |
| Ahead / behind | 0 / 0 |
| Staged changes before CG edits | none |
| Existing tracked modifications | unrelated frontend tracked modifications preserved |
| Existing untracked files | pre-existing untracked proof/documentation and source paths preserved |

No unrelated worktree path was changed during this verification.

## C. Audit Data Model

- Authoritative model source: committed `apps/admin/api/prisma/schema.prisma`.
- Prisma provider: PostgreSQL via `DATABASE_URL`.
- Model: `AuditLog`.
- Physical table mapping: no model-level `@@map` is present, so the physical table name remains `"AuditLog"`.
- Production baseline migration contains `CREATE TABLE "AuditLog"` plus indexes for actor, target user, category, request ID, project, and entity lookup.

`AUDITLOG_MODEL_MAPPING = VERIFIED`

## D. Runtime Binding

Read-only Cloud Run inspection of `openstaff-api` in `openstaff-platform` / `europe-west1` shows:

- service: `openstaff-api`
- latest ready revision: `openstaff-api-00036-gx2`
- traffic: 100% to latest revision
- Cloud SQL instance binding: `openstaff-platform:europe-west1:openstaff-db`
- `DATABASE_URL` is supplied from Secret Manager secret `DATABASE_URL`
- service account: `605639023972-compute@developer.gserviceaccount.com`

Secret metadata for `DATABASE_URL` exists, but the secret value was not accessed.

`RUNTIME_DATABASE_BINDING = VERIFIED`

## E. Cloud SQL Metadata

Read-only Cloud SQL inspection shows:

- instance: `openstaff-db`
- project: `openstaff-platform`
- region: `europe-west1`
- database engine: PostgreSQL 16
- installed version: `POSTGRES_16_15`
- state: `RUNNABLE`
- connector enforcement: `REQUIRED`
- SSL mode: `ENCRYPTED_ONLY`
- database users listed: `openstaff_app`, `postgres`

The active gcloud account is `openstaff.eu@gmail.com`, and a read-only IAM policy check shows it has `roles/owner` on `openstaff-platform`.

`CLOUD_SQL_METADATA = VERIFIED`

## F. Candidate Read Paths

### Direct SQL path

The approved safe direct SQL probe remains:

```sql
SELECT 1 FROM "AuditLog" LIMIT 1;
```

This probe was not executed because no complete existing direct SQL session was established:

- local `psql` was not found
- local Cloud SQL Proxy was not found
- no database password, connection string, or secret value was read
- no Cloud SQL user login was proven
- no database session was opened

`DIRECT_SQL_AUDITLOG_READ_PATH = UNVERIFIED_NO_EVIDENCE`

### Application API path

Committed application code exposes AuditLog read surfaces:

- `GET /projects/:projectId/audit-logs`, guarded by JWT and project/admin access
- `GET /audit/ai-actions`, guarded by JWT plus `MANAGE_TECHNICAL_OPERATIONS`
- `GET /admin/security/audit-logs`, guarded by JWT plus `MANAGE_TECHNICAL_OPERATIONS`

These surfaces confirm application-level read logic exists, but they do not complete CG because no pre-existing authenticated test/admin identity, token, or project context was verified or used.

`APPLICATION_AUDITLOG_READ_PATH = EXISTS_BUT_UNVERIFIED_FOR_CG`

## G. PREREQ-09 Result

CG verifies the model/table mapping, runtime database binding, Cloud SQL instance metadata, database user metadata, active gcloud account, and project-level IAM role.

CG does not verify safe AuditLog SELECT execution. Metadata, IAM ownership, database-user listing, Secret Manager metadata, and application endpoint existence do not prove that a safe read-only AuditLog observation path is operational.

`PREREQ-09 = UNVERIFIED_NO_EVIDENCE`

`PREREQ09_RESOLUTION = UNRESOLVED_READ_ACCESS`

## H. PREREQ-13 Impact

The future FIU-1 smoke strategy still requires AuditLog evidence inspection. Because PREREQ-09 remains unresolved, PREREQ-13 remains only partially verified.

`PREREQ-13 = PARTIALLY_VERIFIED`

`PREREQ13_RESOLUTION = STRATEGY_DOCUMENTED_AND_APPROVED; LIVE_TEST_IDENTITY_AND_AUDITLOG_READ_PATH_REQUIRE_PREEXECUTION_CONFIRMATION`

## I. Carried-Forward Prerequisite Matrix

| Item | Status after CG |
|---|---|
| `PREREQ-07` | `VERIFIED` |
| `PREREQ-09` | `UNVERIFIED_NO_EVIDENCE` |
| `PREREQ-12` | `VERIFIED` |
| `PREREQ-13` | `PARTIALLY_VERIFIED` |
| 13 prerequisites | 11 `VERIFIED`, 1 `PARTIALLY_VERIFIED`, 1 `UNVERIFIED_NO_EVIDENCE` |
| Execution readiness | `FIU1_EXECUTION_STILL_BLOCKED` |
| Human FIU-1 deployment authorization | `GRANTED` |
| FIU-1 deployment execution readiness | NO |
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| EXEC-78G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |

## J. No-Mutation Attestation

- Cloud Build executed: NO.
- Cloud Build trigger executed: NO.
- Cloud Run deploy executed: NO.
- Cloud Run revision created by CG: NO.
- Cloud Run traffic changed: NO.
- Database connection opened: NO.
- Database query executed: NO.
- Database write executed: NO.
- Secret value accessed: NO.
- Live smoke test executed: NO.
- IAM or secret modified: NO.
- Application/schema/frontend modified: NO.

## K. Final Classification

`EXEC-78G.10CG BLOCKED - SAFE_AUDITLOG_READ_PATH_NOT_VERIFIED`

CG is blocked on operational read-path proof. FIU-1 execution remains blocked until an existing authorized direct SQL read session or an existing authenticated application read identity can safely execute and document a minimal AuditLog read without creating credentials, mutating data, or bypassing production controls.
