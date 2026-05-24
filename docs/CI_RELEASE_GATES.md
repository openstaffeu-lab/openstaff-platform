# OpenStaff CI and Release Gates

Date: 2026-05-24  
Execution: `EXEC-63`

## Required gates

| Gate | Command / Check | Current status |
|---|---|---|
| API build | `cd apps/admin/api && npm.cmd run build` | PASS |
| Admin build | `cd apps/admin && npm.cmd run build` | PASS |
| Web build | `cd apps/admin/web && npm.cmd run build` | PASS |
| API lint | `cd apps/admin/api && npm.cmd run lint` | PASS with warnings |
| Admin lint | `cd apps/admin && npm.cmd run lint` | PASS with warnings |
| Web lint | `cd apps/admin/web && npm.cmd run lint` | PASS with warnings |
| API tests | `cd apps/admin/api && npm.cmd test -- --runInBand` | PASS |
| High audit gate | `npm.cmd audit --omit=dev --audit-level=high` in all scopes | PASS |
| Live health | `https://api.openstaff.eu/health` | PASS |
| Live status | `https://api.openstaff.eu/status` | PASS |

## Script standardization

The following script conventions are now the intended baseline:

- `lint`
  - read-only
- `lint:fix`
  - writes changes
- `format:check`
  - read-only
- `format:write`
  - writes changes

CI should use read-only variants only.

## Release checklist

1. Confirm all build gates pass.
2. Confirm all lint gates exit `0`.
3. Confirm API tests pass.
4. Confirm `npm audit --audit-level=high` passes in all package scopes.
5. Confirm no tracked secrets or runtime artifacts are present.
6. Confirm live `/health` and `/status` remain healthy.
7. Confirm smoke flows for auth, onboarding, RELU, uploads, marketplace, and moderation have no regression.

## Production promotion checklist

1. Tag the release candidate commit.
2. Run the Cloud Build pipelines for API, web, and admin.
3. Confirm build, push, and deploy steps all succeed.
4. Confirm the new revisions are serving healthy `/health` and `/status`.
5. Confirm at least one live browser smoke pass on the promoted public web and backoffice URLs.

## Rollback validation checklist

1. Identify previous healthy revisions for API, web, and admin.
2. Confirm rollback commands or console actions are documented in the deployment runbook.
3. After rollback, re-check `/health`, `/status`, login, marketplace, and admin landing routes.
4. Capture the rollback decision and operator notes in the release record.
