# EXEC-75 Remediation

Date: 2026-05-26

## Verdict

STATUS: PASS LOCALLY, LIVE PROOF PENDING

EXEC-75 closes the EXEC-74 code-level failures for role isolation, AI Moderator role modeling, public profile/company asset delivery, per-asset moderation, project AI history, and raw backoffice direct-route leakage.

Production rollout and credentialed browser proof remain separate deployment work. This remediation is not a claim that the new migration and services are already live.

## Remediated Findings

### Backend technical isolation

STATUS: PASS LOCALLY

Evidence:

- `Permission.MANAGE_TECHNICAL_OPERATIONS` was added to Prisma and default permission constants.
- `SUPERADMIN` receives the technical permission by default.
- default `ADMIN` no longer receives technical permission.
- `/relu/config`, `/relu/prompts-policies`, `/relu/queue`, `/gemini/agents`, taxonomy import endpoints, AI/security audit diagnostics, and notification delivery diagnostics now require technical permission.
- API authorization tests prove normal `ADMIN` is denied and `SUPERADMIN` is allowed.

### AI Moderator

STATUS: PASS LOCALLY

Evidence:

- `Role.AI_MODERATOR` and `Permission.MODERATE_AI` were added.
- AI moderator default permissions are limited to `READ` and `MODERATE_AI`.
- `/admin/relu` review APIs and admin RELU rerun actions require `MODERATE_AI`.
- AI Moderator backoffice navigation is limited to RELU AI moderation.
- AI Moderator direct-route access outside `/admin/relu` renders an isolation notice.
- Tests prove AI Moderator can pass moderation permission but cannot pass technical permission.

### Public company/profile assets

STATUS: PASS LOCALLY

Evidence:

- Profile documents now have `moderationStatus`.
- Public profile/company asset URLs now use `/profiles/assets/:documentId`, not authenticated owner document URLs.
- Public asset delivery requires the parent profile to be `PUBLIC`, `APPROVED`, and `LIVE`.
- Public asset delivery also requires the asset to be `APPROVED`.
- Unapproved assets and assets on hidden/unapproved profiles are blocked.
- Service tests cover anonymous access to approved assets and rejection of unapproved/private assets.

### Project AI history

STATUS: PASS LOCALLY

Evidence:

- `ProjectAIInterpretationRun` was added as append-only project AI history.
- Successful reruns append a run before updating the current project AI interpretation pointer.
- Failed reruns append a failed run and do not overwrite the latest successful current result.
- Audit events are emitted for appended successful and failed runs.
- Tests prove history append and failed-rerun non-overwrite behavior.

### Backoffice direct-route cleanup

STATUS: PASS LOCALLY

Evidence:

- `/admin/imports` is wrapped in `TechnicalModeGate`.
- AI Moderator route rendering is constrained to `/admin/relu`.
- `/admin/workforce` no longer renders raw `metadata` JSON in `<pre>` blocks for normal operational review.
- Workforce metadata now renders filtered operational chips and suppresses raw ids, storage paths, URLs, secrets, keys, buckets, and raw JSON fields.

## Validation

Completed locally:

- `apps/admin/api -> npx.cmd prisma validate`
- `apps/admin/api -> npx.cmd prisma generate`
- `apps/admin/api -> npm.cmd test -- --runInBand`
- `apps/admin/api -> npm.cmd run build`
- `apps/admin/api -> npm.cmd run lint`
- `apps/admin -> npm.cmd run build`
- `apps/admin/web -> npm.cmd run build`

Additional validation completed:

- `apps/admin -> npm.cmd run lint`
- `apps/admin/web -> npm.cmd run lint`
- `docs/proof/exec75/browser-check.cjs`

Pending in production proof:

- release check after commit
- production migration/deploy proof

## Files Of Interest

- `apps/admin/api/prisma/schema.prisma`
- `apps/admin/api/prisma/migrations/20260526190000_exec75_role_asset_ai_history/migration.sql`
- `apps/admin/api/src/access-control/access-control.constants.ts`
- `apps/admin/api/src/relu/relu.controller.ts`
- `apps/admin/api/src/relu/admin-relu.controller.ts`
- `apps/admin/api/src/gemini/gemini.controller.ts`
- `apps/admin/api/src/taxonomy/taxonomy.controller.ts`
- `apps/admin/api/src/audit/audit.controller.ts`
- `apps/admin/api/src/notifications/notification.controller.ts`
- `apps/admin/api/src/profiles/profiles.service.ts`
- `apps/admin/api/src/projects/project-ai-interpretations.service.ts`
- `apps/admin/components/AdminLayoutShell.tsx`
- `apps/admin/app/admin/imports/page.tsx`
- `apps/admin/app/admin/workforce/page.tsx`

## Production Notes

- Existing profile/company media created before this migration will default to `PENDING`; operators must approve public-safe logo/banner/gallery assets before they render anonymously.
- The migration must be applied before deploying API code that reads `ProfileDocument.moderationStatus` or writes `ProjectAIInterpretationRun`.
- Local browser proof validates UX gating and approved anonymous asset rendering through the new public route. Backend role isolation is proven by API authorization tests and must be rechecked live after deployment.
