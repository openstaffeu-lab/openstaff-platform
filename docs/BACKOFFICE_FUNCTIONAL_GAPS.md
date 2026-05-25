# Backoffice Functional Gaps - EXEC-68

Date: 2026-05-25

## Broken Or Partial Operational Sections

| Area | Classification | Gap | Required Closure |
| --- | --- | --- | --- |
| Company profile management | PARTIAL, NO_CREATE, NO_DELETE | Company data exists through onboarding/profile/public post flows, but backoffice does not provide one complete company CRUD screen. | Add dedicated company CRUD with logo/banner/taxonomy/geography persistence. |
| Professional profile management | PARTIAL, NO_CREATE, NO_DELETE | Backoffice can moderate users/profiles but cannot fully edit every live profile field. | Add admin profile editor using the same `/profile`/`/profiles` persistence contract. |
| Projects | PARTIAL, NO_CREATE, NO_DELETE | Live workspace can create/edit rich projects; backoffice mostly reads and moderates adjacent public posts/workforce/hiring records. | Add admin project create/edit/archive/delete/publish/unpublish parity. |
| Media/documents | PARTIAL, NO_DELETE | Backoffice moderation can approve/reject/flag public-post media/documents. Direct upload/replace/delete is live-side. | Add admin upload/replace/delete for public post and profile assets with audit logs. |
| Geography/taxonomy | PARTIAL, NO_CREATE, NO_DELETE | Imports and edits are connected, but direct row create/delete is missing for ESCO/NACE/Uniclass/geography. | Add guarded create/delete controls and dry-run validation. |
| Notifications/email workflows | PARTIAL | Delivery retry exists; template/rule CRUD and manual workflow resend/cancel are not consolidated. | Add workflow console for trust emails, OTP, password reset, and notification rules. |
| Admin sessions | PARTIAL, NO_DELETE | Sessions are visible in `/admin/security`, but session revocation is not exposed. | Add per-session revoke and revoke-all-user-sessions. |
| Mobile admin navigation | PARTIAL | Desktop sidebar is hidden on small screens without a full replacement drawer. | Add mobile admin menu with all routes and logout. |
| Analytics | UI_ONLY/PARTIAL | Production readiness and dashboard cards are snapshots, not complete operational analytics. | Add funnel, save failure, moderation SLA, and auth event analytics. |

## Dead Routes And Inconsistent Bindings

- No dead backoffice route files were found in the scanned route tree; every `page.tsx` is reachable through direct URL.
- Navigation includes route groups that are read-only (`/projects`, `/professionals`, `/services`, `/financial`) and should not be presented as full CRUD until write parity exists.
- Public/live project, profile, media, and post saves are API-backed, but backoffice has mixed coverage: moderation is strong, direct entity authoring is incomplete.

## Forms Without Full Persistence

- `dashboard`, `status`, `production-readiness`: no save by design.
- `projects` and `professionals`: read-first views; no create/edit/delete controls.
- `admin/media`: moderation save exists; replacement/delete controls missing.
- `admin/taxonomy`: update/import save exists; create/delete missing.

## Priority Fix List

1. Build a unified admin company/profile editor.
2. Add backoffice project CRUD and lifecycle actions.
3. Add media/document replace/delete with audit events.
4. Add session revocation controls.
5. Add mobile admin navigation drawer.
6. Consolidate email/trust workflow resend and audit views.

