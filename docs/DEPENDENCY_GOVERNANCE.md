# OpenStaff Dependency Governance

Last updated: `2026-05-19`  
Scope: `EXEC-27`

## Purpose

This document sets the dependency policy for OpenStaff so upgrades happen deliberately instead of drifting between apps and release windows.

## Audit Basis

EXEC-27 dependency review was performed on `2026-05-19` using the committed `package.json` and lockfiles in the repository. It was a repo audit, not a live registry freshness scan.

## Baseline Inventory

| Surface | Baseline |
|---|---|
| API framework | NestJS `11.x` |
| ORM | Prisma `6.11.1` |
| admin frontend | Next `16.2.3`, React `19.2.4` |
| public frontend | Next `16.2.4`, React `19.2.4` |
| Firebase admin SDK | `firebase-admin 13.8.0` |
| Firebase web SDK | `firebase 12.12.1` |
| storage SDK | `@google-cloud/storage 7.19.0` |
| secret manager SDK | `@google-cloud/secret-manager 6.1.2` |
| AI SDK | `@google/generative-ai 0.24.1` |

## Findings

### Stale or drifting dependencies

1. the two Next apps are already split across `16.2.3` and `16.2.4`
2. the lockfiles show deprecated transitive packages, especially older `uuid` and older `glob`
3. the API lockfile includes a transitive `inflight` deprecation warning

### Risky dependency patterns

1. both frontend apps depend on the broad `firebase` package, which brings in many browser SDK modules and compat layers through the lockfile surface
2. the API and root both depend on `firebase-admin`, which is acceptable, but it should stay pinned in a coordinated way
3. document-processing libraries such as `pdf-parse`, `mammoth`, and `xlsx` increase supply-chain and parser-risk surface and should only remain if actively used

### Deprecated package signal

The current repo audit found deprecation warnings in committed lockfiles. That does not mean the application is broken today, but it does mean dependency review cannot be deferred indefinitely.

## Governance Rules

### Pinning Strategy

1. major versions must be upgraded intentionally, not incidentally
2. the two Next apps should stay on the same validated patch unless there is a written exception
3. Prisma CLI and `@prisma/client` must stay on the same version
4. Firebase SDK versions should be reviewed as one platform family, not app-by-app in isolation

### Upgrade Policy

1. review dependency posture on every named execution that changes deploy or runtime behavior
2. patch-level upgrades may be bundled into normal release windows after build validation
3. minor upgrades for core frameworks require explicit smoke validation
4. major upgrades require a dedicated execution, rollback notes, and proof

### Emergency Patch Flow

Use the emergency path when:

1. a published vulnerability affects a directly used runtime dependency
2. a transitive vulnerability is exploitable in the production path
3. a provider deprecates a live API contract

Emergency expectations:

1. patch the smallest safe surface first
2. rebuild affected apps
3. rerun release check, ops-check, and targeted smoke
4. log the patch in `docs/ops-log/security-changes/` or `docs/ops-log/deploys/`

## Unused or Over-Broad Package Review

The EXEC-27 audit did not blindly remove packages, but it identified review candidates:

1. broad Firebase browser bundle usage should be revisited for modular-only imports
2. parser libraries should be confirmed against real upload/document workflows before the next dependency cleanup
3. tracked lockfile deprecations should be reduced during the next patch window

## Dependency Review Cadence

1. monthly for core runtime packages
2. before every production framework upgrade
3. immediately for security advisories affecting auth, billing, storage, or database surfaces
