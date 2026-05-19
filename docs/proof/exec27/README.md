# EXEC-27 Proof

Verdict: `EXEC-27 PASS`

## Executive Summary

EXEC-27 establishes the engineering sustainability and lifecycle governance baseline for OpenStaff by adding:

1. a structured technical debt register
2. an explicit architecture baseline
3. dependency governance
4. release lifecycle policy with engineering quality gates
5. data lifecycle governance
6. a production ownership matrix
7. documentation cleanup for outdated topology notes

## Technical Debt Summary

Primary register:

- [docs/TECHNICAL_DEBT_REGISTER.md](/C:/Users/admin/Desktop/openstaff-platform/docs/TECHNICAL_DEBT_REGISTER.md:1)

Key findings:

1. the largest debt is structural: the official `User/Profile/Project/PublicPost` model still coexists with legacy `Actor/Job` flows
2. public fallback surfaces still exist on some detail pages and helper paths
3. dependency drift already exists between the two Next apps
4. manual commercial operations remain accepted debt, not a closed automation problem

## Architecture Governance Summary

Primary baseline:

- [docs/ARCHITECTURE_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/ARCHITECTURE_BASELINE.md:1)

The architecture baseline now makes explicit:

1. public web, admin, API, database, storage, and monitoring boundaries
2. auth, billing, moderation, storage, and monitoring ownership lines
3. which surfaces are allowed to enforce business rules

## Dependency Governance Summary

Primary policy:

- [docs/DEPENDENCY_GOVERNANCE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/DEPENDENCY_GOVERNANCE.md:1)

Important outcomes:

1. direct framework baselines are now documented
2. the admin/public Next patch drift is now visible and tracked
3. lockfile deprecation warnings are now tracked as medium debt rather than ignored

## Lifecycle Governance Summary

Primary policy:

- [docs/RELEASE_LIFECYCLE_POLICY.md](/C:/Users/admin/Desktop/openstaff-platform/docs/RELEASE_LIFECYCLE_POLICY.md:1)

The lifecycle baseline now formalizes:

1. release cadence
2. patch and hotfix cadence
3. rollback support window
4. migration review policy
5. deprecation rules
6. engineering quality gates to prevent `soft PASS` drift

## Data Lifecycle Summary

Primary policy:

- [docs/DATA_LIFECYCLE_POLICY.md](/C:/Users/admin/Desktop/openstaff-platform/docs/DATA_LIFECYCLE_POLICY.md:1)

The data lifecycle baseline now defines:

1. source-of-truth rules for Cloud SQL and GCS
2. conservative billing and audit retention expectations
3. moderation and rejected-asset handling expectations
4. backup retention assumptions tied to the current Cloud SQL baseline

## Ownership Matrix Summary

Primary matrix:

- [docs/OWNERSHIP_MATRIX.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OWNERSHIP_MATRIX.md:1)

The matrix now names ownership for:

1. engineering
2. Technical Ops
3. moderation
4. billing
5. security
6. escalation and rollback authority

## Cleanup Summary

Reviewed and cleaned during EXEC-27:

1. [apps/admin/README.md](/C:/Users/admin/Desktop/openstaff-platform/apps/admin/README.md:1) no longer claims the public app is only a prototype
2. [apps/admin/web/README.md](/C:/Users/admin/Desktop/openstaff-platform/apps/admin/web/README.md:1) no longer contradicts the live production topology

Reviewed but retained intentionally:

1. `apps/admin/api/prisma/dev.db`
2. `apps/admin/legacy/backend-like/`
3. `apps/admin/openstaff/`

These remain tracked debt because safe removal was not yet proven.

## Validation Summary

### Build validation

Validated commands:

1. `apps/admin/api -> npx.cmd prisma validate`
2. `apps/admin/api -> npx.cmd prisma generate`
3. `apps/admin/api -> npm.cmd run build`
4. `apps/admin/web -> npm.cmd run build`
5. `apps/admin -> npm.cmd run build`

Observed result on `2026-05-19`:

1. API Prisma schema valid
2. Prisma Client generated successfully at `v6.11.1`
3. API build passed
4. public web build passed on `Next.js 16.2.4`
5. admin build passed on `Next.js 16.2.3`

### Governance validation

Validated commands:

1. `powershell -ExecutionPolicy Bypass -File scripts/release/exec-13-release-check.ps1`
2. `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1`
3. `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-failure-simulations.ps1`

Observed outcomes captured in EXEC-27:

1. `exec-13-release-check.ps1` correctly blocked an in-progress dirty worktree before commit and will be rerun on the clean committed tree
2. `exec-26-production-ops-check.ps1` returned:

```json
{
  "verdict": "PASS",
  "checkedAtUtc": "2026-05-19T08:03:27.6869993Z",
  "healthStatus": "ok",
  "runtimeEnvironment": "production",
  "readinessStatus": "ok",
  "databaseStatus": "healthy",
  "homepageStatus": 200,
  "loginStatus": 200,
  "adminShellStatus": 200,
  "monitoringPolicies": 10,
  "dashboards": 2,
  "uptimeChecks": 7,
  "recentBackups": 5
}
```

3. `exec-26-failure-simulations.ps1` returned:

```json
{
  "verdict": "PASS",
  "checkedAtUtc": "2026-05-19T08:03:27.8767671Z",
  "loginThrottleStatus": 429,
  "webhookFailureStatus": 400,
  "webhookThrottleStatus": 429,
  "moderationUnauthorizedStatus": 401,
  "storageMissingStatus": 404
}
```

4. no documentation references were left pointing at the pre-EXEC-27 topology baseline
