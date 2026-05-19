# EXEC-24 Cloud SQL Restore Rehearsal

- Date: 2026-05-18
- Owner: Technical Ops
- Environment: production
- Category: restore-rehearsal
- Related execution / incident: EXEC-24

## Summary

Executed a controlled Cloud SQL restore rehearsal on an isolated instance to validate PITR and recovery readiness without affecting production traffic.

## Affected Systems

1. `openstaff-db`
2. recovery instance `openstaff-db-recovery-exec24`

## Actions Taken

1. restored backup `1779073200000` to isolated recovery instance
2. validated SQL access with `SELECT 1;`
3. deleted the recovery instance after proof

## Validation

1. restore operation duration `4m 59.686s`
2. recovery instance became `RUNNABLE`
3. SQL validation passed

## Follow-Up

1. keep restore order and cleanup sequence in the disaster recovery baseline
