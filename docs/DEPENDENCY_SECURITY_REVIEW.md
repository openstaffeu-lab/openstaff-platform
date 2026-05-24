# OpenStaff Dependency Security Review

Date: 2026-05-24  
Execution: `EXEC-63`

## Summary

All four package scopes now pass `npm audit --omit=dev --audit-level=high`.

Scopes checked:

- root
- `apps/admin`
- `apps/admin/web`
- `apps/admin/api`

This closes the high-severity release blocker recorded in the 2026-05-23 audit.

## Remediation completed

### Frontends

- updated `apps/admin` to `next@16.2.6`
- updated `apps/admin/web` to `next@16.2.6`
- aligned `eslint-config-next@16.2.6` in both apps
- rebuilt and relinted both apps after the patch

### API

- refreshed transitive dependencies with controlled `npm audit fix --omit=dev`
- removed `xlsx` from `apps/admin/api/package.json`
- kept structured import validation while reducing the supported import format to CSV-only

### Root

- refreshed the Firebase Admin dependency line to reduce transitive vulnerability exposure where safely possible

## Final audit state

### Root

- high: `0`
- accepted remaining: moderate transitive chain involving `uuid` through Firebase / Google dependencies

### `apps/admin`

- high: `0`
- accepted remaining: moderate `postcss` advisory through current patched Next.js dependency tree

### `apps/admin/web`

- high: `0`
- accepted remaining: moderate `postcss` advisory through current patched Next.js dependency tree

### `apps/admin/api`

- high: `0`
- accepted remaining: moderate `uuid` transitive chain through Google / Firebase packages

## XLSX decision

Decision: `C - disable unsafe XLSX import paths`

Rationale:

- the original `xlsx` package still carried high-severity issues without an upstream patch acceptable for production
- the only meaningful in-repo workbook parse path was taxonomy import
- replacing it immediately with another workbook parser would have increased regression risk late in the hardening cycle
- sandboxing workbook parsing in the current architecture would have required additional operational surface and trust review

Implemented result:

- `xlsx` was removed from the API dependency graph
- taxonomy import now accepts CSV only
- `.xls` and `.xlsx` uploads are rejected before parse with structured JSON
- backoffice import UI now advertises `.csv` only

## Accepted exceptions

These are not ignored; they are explicitly accepted and must remain tracked until upstream patch paths are available or safe major upgrades are scheduled.

1. `postcss`
   - scope: frontend apps
   - reason: currently inherited through the patched Next.js line in use

2. `uuid`
   - scope: root and API transitive chains
   - reason: currently inherited through Firebase / Google Cloud packages

## Recommendation

Treat the current dependency posture as acceptable for `BETA_READY`, not final `PRODUCTION_READY`, until the remaining accepted moderate advisories are upgraded away or replaced by a tested dependency line.
