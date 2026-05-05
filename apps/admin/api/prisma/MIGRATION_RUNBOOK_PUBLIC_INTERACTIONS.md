# OpenStaff Public Interactions Migration Runbook

## Current blocker

The attempted migration command did not create a migration because Prisma is configured for a PostgreSQL datasource in `schema.prisma`, but the current local `DATABASE_URL` is still set to a SQLite-style value:

```text
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
  --> prisma\schema.prisma:7
  6 |   provider = "postgresql"
  7 |   url      = env("DATABASE_URL")
```

Because of that blocker, no migration folder was created by `prisma migrate dev --name add_public_interactions`.

## Required DATABASE_URL format

The datasource now expects PostgreSQL. Use one of these formats:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

or

```env
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

## Local PostgreSQL option

For local migration work, point `DATABASE_URL` to a local PostgreSQL instance. Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openstaff_platform?schema=public"
```

Suggested local flow:

1. Start a local PostgreSQL server.
2. Create an empty database such as `openstaff_platform`.
3. Update `apps/admin/api/.env` with the PostgreSQL connection string.
4. Validate the schema and generate the Prisma client.
5. Run the migration command.

## Production / Cloud SQL warning

Do not run `prisma migrate dev` directly against production Cloud SQL without a reviewed migration window, a verified backup, and the correct connection target.

For production:

1. Review the generated SQL and migration contents first.
2. Confirm the target database and environment variables.
3. Take or verify a recent backup or snapshot.
4. Run the migration through the approved release process only.

## Commands to run later

After `DATABASE_URL` points to PostgreSQL, run:

```powershell
cd C:\Users\admin\Desktop\openstaff-platform\apps\admin\api
npx.cmd prisma migrate dev --name add_public_interactions
```

Then regenerate Prisma client:

```powershell
cd C:\Users\admin\Desktop\openstaff-platform\apps\admin\api
npx.cmd prisma generate
```

## Rollback considerations

Prisma migrations are forward-oriented, so rollback needs to be planned before production use.

Recommended precautions:

1. Keep the generated migration folder in version control.
2. Capture a database backup before applying the migration outside local development.
3. Review whether rollback should be handled by:
   - restoring from backup, or
   - shipping a compensating migration.
4. If production data already exists, validate new table creation and relations in a staging environment first.

## Models covered by this migration

The pending migration is intended to create the interaction layer tables for:

- `PublicPost`
- `PublicPostMedia`
- `ExternalLinkSubmission`
- `PrivateConversation`
- `PrivateMessage`
- `PublicComment`
- `PublicReview`
