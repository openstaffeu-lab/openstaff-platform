# EXEC-67 API Startup Fix

Date: 2026-05-25

## Root Cause 1

Failed revision:

- `openstaff-api-00031-ksb`

Cloud Run logs showed:

- `UndefinedModuleException`
- `TrustModule "imports" array is undefined at index [1]`
- circular scope involving `AuthModule`, `AuditModule`, and `NotificationModule`

Fix applied:

- `apps/admin/api/src/trust/trust.module.ts`
- `apps/admin/api/src/auth/auth.module.ts`

Change:

- wrapped module imports with `forwardRef()` where the trust/auth/audit/notification cycle required it

## Root Cause 2

Failed revision:

- `openstaff-api-00032-g4j`

Cloud Run logs showed:

- `UnknownDependenciesException`
- `Nest can't resolve dependencies of the JwtGuard`
- `JwtService at index [0] is not available in the TrustModule module`

Fix applied:

- `apps/admin/api/src/trust/trust.module.ts`

Change:

- imported `AuthModule` into `TrustModule` so `JwtGuard` can resolve `JwtService`

## Result

Successful live revision:

- `openstaff-api-00033-ssp`

Traffic:

- `100%`

Health:

- `/health` => `ok`
- `/status` => `ok`
- `db` => `healthy`
