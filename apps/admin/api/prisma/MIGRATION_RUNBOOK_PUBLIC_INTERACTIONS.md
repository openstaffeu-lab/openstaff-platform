# OpenStaff Prisma Migration Discipline

## Current production rule

OpenStaff production uses a single reviewed PostgreSQL baseline plus forward-only reviewed migrations.

Use only:

```powershell
npx.cmd prisma migrate deploy
```

Do not use as production strategy:

- `npx.cmd prisma db push`
- `npx.cmd prisma migrate dev`

## EXEC-15 baseline

The active production migration chain is:

- `prisma/migrations/20260516090000_exec15c_production_baseline`

Legacy pre-baseline migration folders were archived to:

- `prisma/migrations_legacy_exec01_exec14/`

That archive is retained only as historical proof. It is not the active production chain.

## Operator flow

1. Confirm the target database is the live PostgreSQL database.
2. Confirm the latest reviewed migration folder is present in `prisma/migrations/`.
3. Run:

```powershell
cd C:\Users\admin\Desktop\openstaff-platform\apps\admin\api
npx.cmd prisma migrate deploy
```

4. Regenerate Prisma client when needed for local build validation:

```powershell
cd C:\Users\admin\Desktop\openstaff-platform\apps\admin\api
npx.cmd prisma generate
```

## Safety notes

- Migration application is forward-only.
- Rollback is handled by restore-from-backup or a compensating reviewed migration.
- Production migration windows must include a verified backup and a confirmed target database.
- Local development databases may legitimately show the production baseline as unapplied; that does not change the production rule.
