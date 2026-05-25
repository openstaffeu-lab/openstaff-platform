# EXEC-68 CRUD And Save Proof

Date: 2026-05-25

## API-Backed Live/Workspace Saves

- Professional/company profile save: `PUT /profile` from `apps/admin/web/app/profile/page.tsx`.
- Profile media/documents: upload/extract/download/delete through `/profiles/:id/documents...`.
- Worker roster/skills/documents: create/update/delete through `/profile/workers...`.
- Project create/edit: `/projects` and `/projects/:id` from `ProjectWorkspaceForm`.
- Project documents: upload/download/extract/delete through `/projects/:id/documents...`.
- Project conditions/job requests: create/update/delete through project subresources.
- RELU project interpretation: generate/apply via `/projects/:id/ai-interpretation`.
- Public post create/update/delete/media/document/link: `/public-posts...` from `/publish`.

## API-Backed Backoffice Saves

- User role, account approval/status, profile moderation, trust action: `/admin/users`.
- Public post moderation and selected edits: `/admin/public-posts`.
- Media/document moderation: `/admin/public-post-media`, `/admin/public-post-documents`.
- Comments/reviews/private messages/external links moderation: admin PATCH status endpoints.
- Verification approval/reject/request info/reopen: `/admin/verifications`.
- Taxonomy update/import parse/validate/commit: `/admin/taxonomy`, `/admin/imports`.
- RELU review/override/rerun: `/admin/relu`.
- Role permissions save: `PUT /admin/roles/:role`.

## Remaining Non-Pass Parity Gaps

- Backoffice profile/company/project full CRUD is still partial.
- Backoffice media/document replacement and delete are still missing.
- Backoffice session revoke and full mobile nav are still missing.

