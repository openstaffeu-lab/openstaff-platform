# EXEC-67 Production Migration Proof

Date: 2026-05-25

## Migration

Applied migration:

- `apps/admin/api/prisma/migrations/20260525120000_exec66_two_factor_auth/migration.sql`

Execution method:

- one-off Cloud Run job
- job name: `openstaff-api-migrate-exec67`

Successful execution:

- `openstaff-api-migrate-exec67-4kvcb`

Execution result:

- `Completed = True`
- `SucceededCount = 1`

## Runtime Shape

Job runtime used:

- API image from Artifact Registry
- Cloud SQL attachment for `openstaff-platform:europe-west1:openstaff-db`
- `DATABASE_URL` from Secret Manager

Command executed:

- `/app/node_modules/.bin/prisma migrate deploy`

## Safety Notes

- production used `prisma migrate deploy`, not `db push`
- migration path was additive for 2FA persistence
- rollout was executed before the new API revision was promoted

## Rollback Note

No destructive rollback was executed in this turn.

If rollback were required, the first containment step would be:

- keep prior healthy Cloud Run revision serving traffic
- inspect the applied migration state
- prepare a deliberate forward-fix or DB restore decision through the production runbook rather than issuing ad-hoc schema rewrites
