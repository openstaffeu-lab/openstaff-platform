# OpenStaff Release Lifecycle Policy

Last updated: `2026-05-19`  
Scope: `EXEC-27`

## Purpose

This policy defines how OpenStaff changes move through their lifecycle after EXEC-26 formalized release governance.

## Release Cadence

### Standard release cadence

1. normal production changes should batch into planned release windows
2. schema-affecting releases should avoid stacking unrelated risky changes
3. multi-surface releases must name the affected services explicitly

### Patch cadence

1. low-risk doc, config, or governance corrections may ship in the next available controlled window
2. dependency patches should be grouped where practical so the validation burden stays reasonable

### Hotfix cadence

1. hotfixes are exception paths, not the default operating model
2. hotfixes must still leave proof, rollback notes, and a follow-up cleanup decision

## Rollback Support Window

1. at least one previously healthy Cloud Run revision per service should remain available for fast rollback
2. rollback-safe artifacts and revisions must not be pruned blindly
3. any release that removes rollback options requires explicit approval and replacement safety measures

## Migration Review Policy

1. production uses `prisma migrate deploy` only
2. migration approval is separate from application deploy approval
3. high-risk migrations require restore-readiness review before execution
4. migration ownership must be named in the release proof

## Deprecation Policy

1. deprecated paths must be marked explicitly in code or docs
2. new functionality must not be added to deprecated layers
3. removal requires a named execution with proof that the replacement path is live
4. legacy archives may be retained temporarily, but they must be documented as inactive

## Support Expectations

1. public-facing regressions require a same-day owner decision: rollback, hotfix, or freeze
2. internal admin-only regressions still require proof and owner visibility; they are not “soft failures”
3. manual commercial operations must not be presented as automated support guarantees

## Engineering Quality Baseline

Minimum quality gates before a `PASS` verdict:

1. required builds pass for affected apps
2. release check passes
3. production ops-check passes when governance or production-facing behavior is touched
4. failure simulations remain healthy when the protected routes they cover are relevant
5. documentation references are current and non-contradictory
6. rollback expectations are explicit

Minimum proof for a named execution:

1. what changed
2. how it was validated
3. what risks remain
4. commit SHA
5. push status

Disallowed `soft PASS` patterns:

1. passing builds without runtime or governance proof where runtime or governance changed
2. claiming production readiness while docs contradict live topology
3. treating accepted debt as if it were closed work
