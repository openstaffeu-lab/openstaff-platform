# Backoffice Status Audit - EXEC-68

Date: 2026-05-25

Scope: `apps/admin/app`, `apps/admin/lib/api.ts`, and API bindings under `apps/admin/api/src`. Status values use the EXEC-68 vocabulary: `WORKING`, `PARTIAL`, `BROKEN`, `UI_ONLY`, `BACKEND_ONLY`, `NOT_CONNECTED`, `NO_SAVE`, `NO_DELETE`, `NO_EDIT`, `NO_CREATE`.

## Operational Summary

| Section | Route(s) | Status | Evidence | Gaps |
| --- | --- | --- | --- | --- |
| Dashboard | `/dashboard` | PARTIAL | Reads job, actor, and RELU queue stats through `adminApi`. | Read-only; no drill-down remediation actions. |
| Users | `/admin/users` | WORKING | Role, approval, account status, profile moderation, and trust actions call `adminApi`. | No user delete/archive UI. |
| Professionals | `/professionals` | PARTIAL | Reads professional data through `/actors`-style API bindings. | No backoffice create/edit/delete parity with live profile workspace. |
| Companies | `/professionals`, `/admin/users`, public-post admin | PARTIAL | Company/subcontractor state exists through actors, profiles, posts, and onboarding. | No dedicated company CRUD section with logo/banner/taxonomy/geography save parity. |
| Projects | `/projects`, `/admin/posts`, `/admin/hiring`, `/admin/workforce` | PARTIAL | Project reads exist; post moderation and workforce/hiring workflows persist. | Backoffice project create/edit/archive/delete is incomplete compared with live workspace. |
| Moderation | `/admin/posts`, `/admin/media`, `/admin/comments-reviews`, `/admin/messages`, `/admin/private-messages`, `/admin/external-links` | WORKING | Approve/reject/flag/status actions call PATCH/POST endpoints. | Delete/archive parity is limited; some moderation queues do not expose bulk actions. |
| Trust/Security | `/admin/security`, `/admin/users` | WORKING | Audit logs, security events, sessions, compliance requests, trust actions, require 2FA and clear lock are API-backed. | Session revocation from UI is read-only; no per-session revoke button. |
| Approvals | `/admin/verifications`, `/admin/subscriptions`, `/admin/users` | WORKING | Verification review, subscription approval, user/profile approval persist through API calls. | Approval history visibility is split between audit/security and section detail. |
| Taxonomy | `/admin/taxonomy`, `/admin/imports`, `/admin/import-logs` | WORKING | Browse/update/import/parse/validate/commit flows use `adminApi`. | Delete/create of individual taxonomy records is not exposed. |
| ESCO | `/admin/taxonomy`, `/admin/imports` | PARTIAL | Search/browse/update/import are connected. | No delete/create record UI. |
| NACE | `/admin/taxonomy`, `/countries-vat` | PARTIAL | Browse/update/import and country/VAT create exist. | NACE CRUD is update/import only. |
| Uniclass | `/admin/taxonomy`, `/admin/imports` | PARTIAL | Browse/update/import are connected. | No delete/create record UI. |
| Geography | `/countries-vat`, `/admin/taxonomy` | PARTIAL | Country create and taxonomy browsing exist. | Region/city full CRUD is not exposed in backoffice. |
| Media/Documents | `/admin/media` | WORKING | Media/document approve/reject/flag calls admin endpoints. | Upload/replace/delete is live-side only; backoffice moderation lacks direct replacement. |
| AI/RELU | `/ai-control`, `/ai-config`, `/ai-queue`, `/admin/relu` | WORKING | Prompt/policy/config save, queue read, result review/override/rerun persist through `adminApi`. | Generated content save/discard is per-result, not consistently surfaced on every entity screen. |
| Notifications | `/admin/notifications` | PARTIAL | Events/deliveries/runs load; delivery retry persists. | Template CRUD and notification rule editing are not exposed. |
| Email/Trust Workflows | `/admin/security`, `/admin/users`, `/admin/notifications` | PARTIAL | Trust events, security events, and notification deliveries are visible. | No single workflow console for resend/cancel/manual override. |
| Audit/Security Events | `/admin/security` | WORKING | Audit logs, security events, sessions, compliance requests load; event status updates persist. | Session revoke is missing. |
| Onboarding | `/admin/onboarding` | PARTIAL | Sessions load and RELU profile results can be inspected. | Admin correction/save of onboarding fields is not exposed here. |
| Analytics | `/dashboard`, `/admin/production-readiness` | PARTIAL | Operational stats/status load. | Analytics are operational snapshots, not full funnel/event analytics. |
| Search/Discovery | `/professionals`, `/projects`, `/admin/taxonomy` | PARTIAL | Read/search surfaces exist. | Admin search is fragmented per section and lacks global discovery. |
| Role Permissions | `/admin/roles` | WORKING | Permission matrix saves with PUT `/admin/roles/:role`. | Role creation/deletion not exposed. |

## Dead Buttons And No-Save Findings

- No `href="#"`, empty `onClick`, or obvious placeholder buttons were found in the active backoffice routes scanned for EXEC-68.
- `dashboard`, `projects`, `professionals`, `status`, and `production-readiness` are intentionally read-oriented and therefore classify as `PARTIAL` where CRUD was required by EXEC-68.
- Backoffice sections with status actions generally persist via `fetchApiJson` or `adminApi`.
- Backoffice mobile behavior remains `PARTIAL`: the sidebar is desktop-first and hidden below `md`; the header now exposes logout, but there is no full mobile drawer for all admin routes.

## Auth And Session Findings

- Backoffice login supports the shared `/auth/login` flow and now stores 2FA challenges with absolute expiry.
- Backoffice `/two-factor` now refreshes the active `AuthContext` after OTP verification before redirecting to `/dashboard`.
- Logout is now visible in the backoffice sidebar and header and clears access token, refresh token, and pending admin 2FA challenge state.

