# EXEC-74 Security And Role Audit

Date: 2026-05-26

## Status

STATUS: FAIL

EXEC-73 improves browser navigation visibility, but it does not enforce the same isolation at the backend API layer.

## UI Evidence

PASS:

- `apps/admin/components/AdminLayoutShell.tsx` marks technical menu links with `visibility: "superadmin"` and filters them with `user?.role === "SUPERADMIN"`.
- `apps/admin/components/TechnicalModeGate.tsx` renders technical route content only when `user?.role === "SUPERADMIN"`.
- Dashboard shortcuts conditionally expose AI diagnostics and AI control only to `SUPERADMIN`.

PARTIAL:

- The gate is client-side. In the audited pages it prevents child workspace rendering, so client-side data fetches are not started for normal admins on the gated pages.
- This is still not a substitute for API authorization.

## Backend Authorization Evidence

FAIL:

- `apps/admin/api/src/access-control/access-control.constants.ts` gives `ADMIN` and `SUPERADMIN` the same default permissions: `READ`, `WRITE`, `DELETE`, and `MANAGE_USERS`.
- `apps/admin/api/src/access-control/permissions.guard.ts` allows `SUPERADMIN` automatically, but otherwise trusts permission membership. A default `ADMIN` therefore passes `MANAGE_USERS`, `READ`, and `WRITE` guarded endpoints.
- `apps/admin/api/src/relu/relu.controller.ts` protects technical routes such as `/relu/config`, `/relu/prompts-policies`, and `/relu/queue` with `Permission.MANAGE_USERS`, not a superadmin-only role guard.
- `apps/admin/api/src/gemini/gemini.controller.ts` protects `/gemini/agents` and prompt/config mutation with `Permission.MANAGE_USERS`, not superadmin-only.
- `apps/admin/api/src/taxonomy/taxonomy.controller.ts` protects import/browser endpoints with `READ` or `WRITE`, which normal admin roles can have.
- `apps/admin/api/src/audit/audit.controller.ts` exposes AI audit logs and security audit logs to `Permission.MANAGE_USERS`.
- `apps/admin/api/src/notifications/notification.controller.ts` exposes admin notification events/deliveries behind `Permission.MANAGE_USERS`.

## Role Model Evidence

FAIL:

- The Prisma `Role` enum contains `SUPERADMIN`, `ADMIN`, `WORKER`, `EMPLOYER`, `CONTRACTOR`, `GENERAL_CONTRACTOR`, and `PROFESSIONAL`.
- There is no `AI_MODERATOR` role or equivalent role-level implementation.
- EXEC-73 documentation describes an AI Moderator visibility layer, but the database role model does not implement it.

## SSR And Hydration Leakage

PARTIAL PASS:

- The audited backoffice technical pages are client components and their data fetches are inside child workspace components that are not rendered by `TechnicalModeGate` for normal admins.
- No server-side preload of technical data was observed in those pages.
- This does not mitigate direct fetch access to technical APIs.

## Vulnerable Paths

Normal `ADMIN` users can likely access these backend surfaces directly unless their role permissions were manually reduced:

- `GET /relu/config`
- `PATCH /relu/config/:id`
- `GET /relu/prompts-policies`
- `PATCH /relu/prompts-policies/:id`
- `GET /relu/queue`
- `GET /gemini/agents`
- `PATCH /gemini/agents/:id`
- `GET /taxonomy/admin/import-options`
- `GET /taxonomy/admin/imports`
- `POST /taxonomy/admin/imports/upload`
- `POST /taxonomy/admin/imports/:id/parse`
- `POST /taxonomy/admin/imports/:id/validate`
- `POST /taxonomy/admin/imports/:id/commit`
- `GET /audit/ai-actions`
- `GET /admin/security/audit-logs`
- `GET /admin/notifications/events`
- `GET /admin/notifications/deliveries`

## Technical Debt

- Client-side role hiding does not equal backend isolation.
- `ADMIN` is too broad for technical infrastructure.
- The `AI Moderator` role is documentation-only.
- Technical import and queue APIs need a separate technical permission or a superadmin-only role guard.

## Required Remediation

- Add a backend technical permission such as `MANAGE_TECHNICAL_OPERATIONS`, or add explicit `RolesGuard([Role.SUPERADMIN])` to technical endpoints.
- Add a real AI moderator role/permission model if AI Moderator is a product requirement.
- Add API tests proving normal `ADMIN` receives 403 for prompt/config/queue/import/delivery diagnostic endpoints.
- Keep `TechnicalModeGate`, but treat it as UX only.
