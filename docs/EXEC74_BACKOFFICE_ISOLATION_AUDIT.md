# EXEC-74 Backoffice Isolation Audit

Date: 2026-05-26

## Status

STATUS: PARTIAL PASS

EXEC-73 made real UI cleanup progress, but isolation is incomplete because hidden routes and backend APIs still expose technical surfaces.

## Removed Or Cleaned Surfaces

PASS:

- Main sidebar now prioritizes Dashboard, Moderation, Media & Documents, Companies & Workforce, Contracts, Financial Engine, Countries & VAT, RELU AI Moderation, Trust & Security, and Users.
- Technical links are grouped separately and hidden from non-superadmin users.
- `admin/relu` presents RELU output as operational interpretation with confidence, status badges, correction logs, rerun actions, and approve/reject/adjust actions.
- `admin/media` presents previews, clean file chips, and preview/download actions instead of raw storage paths.
- `countries-vat` uses inline warning/empty states and retry actions.
- `admin/taxonomy`, `ai-control`, `ai-queue`, `admin/notifications`, `admin/production-readiness`, `admin/ui-config`, and `admin/import-logs` are wrapped by `TechnicalModeGate`.

## Hidden Or Direct-URL Gaps

FAIL:

- `/admin/workforce` is a reachable route and renders raw lifecycle metadata with `JSON.stringify(item.metadata, null, 2)` in a `<pre>` block.
- `/admin/imports` is a reachable technical import workflow and is not wrapped in `TechnicalModeGate`.
- These routes are not exposed in the simplified sidebar, but hiding navigation is not route protection.

## Backend Isolation Gaps

FAIL:

- Technical APIs remain protected mainly by broad permissions, not superadmin-only enforcement.
- Default `ADMIN` role receives `MANAGE_USERS`, `WRITE`, and `READ`, which grants access to many technical endpoints.
- Technical surfaces affected include RELU config/prompts/queue, Gemini agents, taxonomy imports, AI audit logs, notification delivery diagnostics, and security audit logs.

## Raw Data Exposure

PARTIAL PASS:

Normal visible workflow cleanup is real:

- `admin/relu` filters technical keys such as ids, source ids, storage, bucket, raw, json, token, hash, and GCS references from normal highlights.
- `admin/media` humanizes GCS/internal-server errors and proxies assets through clean preview/download routes.
- `admin/taxonomy` is role-gated for normal admin UI.

Remaining exposure:

- `/admin/workforce` still renders raw metadata JSON.
- Public company AI governance renders `sourceResultId`, which is a raw internal RELU result id on a public page.
- Backend admin media endpoints still return raw stored media URL values to authorized admin callers, even if the UI normally masks them.

## Role Visibility Matrix

Operational Admin:

- UI navigation: PARTIAL PASS
- Direct technical page render: PARTIAL PASS
- Backend API isolation: FAIL

AI Moderator:

- UI concept: DOCUMENTED ONLY
- Database role: FAIL
- Backend authorization: FAIL

Technical SuperAdmin:

- UI technical access: PASS
- Backend superadmin-only APIs: PARTIAL; some endpoints such as UI config and role management use superadmin-only guards, but many technical RELU/Gemini/taxonomy/notification endpoints do not.

## UX Integrity

PARTIAL PASS:

- Visible operational pages are cleaner and more business-readable.
- Browser proof supports basic no-overflow and no-raw-text claims for selected routes.
- The proof did not include hidden direct routes and did not call backend APIs.

## Required Remediation

- Wrap `/admin/imports` and `/admin/workforce` in appropriate gates or redesign them into operational surfaces.
- Remove raw metadata `<pre>` from `/admin/workforce`.
- Add backend superadmin-only guards or a dedicated technical permission for technical APIs.
- Add API authorization tests for normal admin, AI moderator, and superadmin.
- Replace public company `sourceResultId` with a business-readable audit label.
