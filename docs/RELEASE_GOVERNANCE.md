# OpenStaff Release Governance

Last updated: `2026-05-18`  
Scope: `EXEC-26`

## Purpose

This document standardizes the production release process for OpenStaff so deploys, rollbacks, hotfixes, migrations, and PASS decisions follow the same governance model.

## Release Principles

1. production deploys require explicit operator intent
2. migrations and deploys are separate approval decisions
3. rollback speed is more important than proving a bad deploy correct
4. PASS requires proof, not just a clean build
5. production changes must leave an ops-log entry

## Deploy Approval Flow

Required approvals before a normal production deploy:

1. change owner confirms scope and target services
2. Technical Ops confirms deploy window and rollback readiness
3. migration owner confirms whether `prisma migrate deploy` is required
4. release approver confirms smoke scope and proof expectations

Minimum release inputs:

1. target branch and commit SHA
2. affected services
3. config or secret changes, if any
4. migration requirement yes/no
5. rollback candidate revision(s)

## Production Deploy Checklist

1. working tree is clean
2. branch is correct
3. required build checks pass
4. production contract docs are current
5. secrets/config changes are reviewed
6. migration decision is recorded
7. last healthy revisions are known
8. monitoring, dashboards, alerting, and uptime checks are available
9. rollback owner is named
10. an ops-log deploy entry is created

## Rollback Checklist

1. identify the last known healthy revision for the affected service
2. freeze further deploys
3. shift traffic back
4. validate `/health` and `/status`
5. validate affected product paths
6. document rollback in `docs/ops-log/rollbacks/`

## Migration Approval Rules

1. production uses `prisma migrate deploy` only
2. `prisma db push` and `prisma migrate dev` are never approved for production
3. a migration requires a rollback discussion before execution
4. if the data-plane risk is high, a restore readiness review is mandatory before approval
5. migration completion must be logged in `docs/ops-log/migrations/`

## Freeze Rules

Production deploy freeze is automatic when:

1. `SEV-1` or `SEV-2` incident is active
2. Cloud SQL health is degraded
3. rollback path is unclear
4. synthetic monitoring or smoke validation is already red from an unresolved issue

Planned freeze windows should also be used around:

1. risky migrations
2. domain/DNS changes
3. auth or secret rotations with broad blast radius

## Hotfix Process

Use the hotfix path when:

1. user-facing production regression is active
2. rollback is not enough or not available
3. config correction is urgently required

Hotfix expectations:

1. scope is minimal
2. owner is explicit
3. validation is narrower but still real
4. follow-up cleanup/refactor is tracked separately

## Smoke Validation Requirements

Minimum production smoke after deploy:

1. `GET /health = 200`
2. `GET /status = 200`
3. homepage reachable
4. auth baseline healthy
5. `SUPERADMIN` path healthy when admin-affecting changes exist
6. upload and moderation flow healthy when API/storage/admin changes exist
7. billing webhook guard healthy when billing changes exist
8. public approved asset delivery healthy when storage or moderation changes exist
9. alert/dashboard/synthetic baseline still present for ops-facing changes

## PASS Proof Expectations

A release or execution should not be marked `PASS` without:

1. concrete proof of what changed
2. validation evidence for affected paths
3. rollback expectations
4. explicit accepted limitations
5. commit SHA and push status
6. ops-log entry when production was touched

## Standard Automation

Recommended operator commands:

1. `powershell -ExecutionPolicy Bypass -File scripts/release/exec-13-release-check.ps1`
2. `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1`
3. `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-failure-simulations.ps1`

## Required Audit Trail

Every production deploy should produce:

1. repo commit
2. push status
3. proof document when the execution is a named milestone
4. ops-log deploy entry

## Authority Model

1. Technical Ops owns deploy execution and rollback mechanics
2. change owner owns correctness of the intended change
3. migration owner owns schema-change correctness
4. incident commander owns release freeze and emergency rollback decisions during incidents
