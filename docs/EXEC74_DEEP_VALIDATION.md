# EXEC-74 Deep Validation

Date: 2026-05-26

## Verdict

STATUS: FAIL

EXEC-74 cannot honestly be marked PASS. The new RELU persistence layer is materially real, but the full EXEC-72 and EXEC-73 claim set is not production-safe yet because:

- project AI wizard interpretations still use single-row overwrite semantics
- default `ADMIN` users can still call several technical backend APIs that EXEC-73 only hides in the UI
- public company profile assets are assembled with authenticated document URLs, so approved public company pages can render broken logo/banner/gallery media
- some hidden backoffice routes still expose raw operational metadata or technical import tooling
- browser proof is useful UI smoke coverage, but it is mock-backed and does not prove live persistence, live uploads, or live role isolation

## Method

This audit inspected implementation directly and did not trust `STATUS.md`, proof summaries, or screenshots as authoritative evidence.

Primary files inspected:

- `apps/admin/api/prisma/schema.prisma`
- `apps/admin/api/src/relu/relu.service.ts`
- `apps/admin/api/src/relu/relu.controller.ts`
- `apps/admin/api/src/relu/admin-relu.controller.ts`
- `apps/admin/api/src/public-posts/public-posts.service.ts`
- `apps/admin/api/src/public-posts/public-posts.controller.ts`
- `apps/admin/api/src/profiles/profiles.service.ts`
- `apps/admin/api/src/profiles/profiles.controller.ts`
- `apps/admin/api/src/projects/projects.service.ts`
- `apps/admin/api/src/projects/project-documents.service.ts`
- `apps/admin/api/src/projects/project-ai-interpretations.service.ts`
- `apps/admin/api/src/access-control/access-control.constants.ts`
- `apps/admin/api/src/access-control/permissions.guard.ts`
- `apps/admin/api/src/taxonomy/taxonomy.controller.ts`
- `apps/admin/api/src/gemini/gemini.controller.ts`
- `apps/admin/components/AdminLayoutShell.tsx`
- `apps/admin/components/TechnicalModeGate.tsx`
- `apps/admin/app/admin/relu/page.tsx`
- `apps/admin/app/admin/media/page.tsx`
- `apps/admin/app/admin/workforce/page.tsx`
- `apps/admin/app/admin/imports/page.tsx`
- `docs/proof/exec72/browser-check.cjs`
- `docs/proof/exec72/browser-proof.json`
- `docs/proof/exec73/browser-check.cjs`
- `docs/proof/exec73/browser-proof.json`

Live Cloud Run revision state checked during this audit:

- API: `openstaff-api-00033-ssp`
- Public web: `openstaff-web-00027-dvj`
- Backoffice admin: `openstaff-admin-00022-58q`

These are existing live revisions, not proof that the EXEC-72/EXEC-73 local code is deployed.

## 1. EXEC-72 AI Persistence

STATUS: FAIL

Evidence that is production-strength:

- `ReluTask`, `ReluProcessingRun`, `ReluClassificationResult`, `ReluMatchResult`, and `ReluRecommendation` exist as durable Prisma models with source, status, actor, fallback, result, score, override, and timestamp fields in `schema.prisma`.
- RELU secured tasks create a task and, when configured, a processing run before AI execution in `relu.service.ts`.
- `persistSecuredOperationalResult` and `persistOperationalResult` create new result rows instead of replacing prior RELU rows.
- RELU fallback/error paths persist failed runs/results with `fallbackUsed`, `errorMessage`, and completed timestamps.
- Moderator status changes and overrides persist `reviewedByUserId` and `reviewedAt`, then create `AuditLog` entries with `before`, `after`, and correction metadata.
- `AuditService.log` creates audit rows; no application-level `auditLog.update`, `auditLog.delete`, or `auditLog.deleteMany` path was found.

Failing evidence:

- `ProjectAIInterpretation` is a single row per project via `projectId @unique`.
- `ProjectAIInterpretationsService.upsert()` overwrites `extractedJson`, `documentIds`, `confidenceScore`, `modelName`, `modelVersion`, `promptVersion`, and review state on rerun.
- The project AI interpretation service does not inject `AuditService` and does not create append-only audit events for reruns, failures, or applies.
- Failed project AI interpretation also uses the same upsert row, so previous successful output can be replaced by a failed payload.
- Public post RELU classification persists history in `ReluClassificationResult`, but also overwrites the live `PublicPost.classificationJson` and taxonomy JSON fields as current state. That is acceptable for current display, but it is not itself an audit trail.

Architectural risk:

- EXEC-72's "no AI output exists only transiently" claim is not fully defensible for all AI surfaces because project wizard output is persistent but mutable, not append-only.
- RELU result correction logs are append-only by service convention, but not protected by database immutability.

False-positive claim:

- "Reruns never overwrite prior audit history" is true for RELU run/result tables, but false for `ProjectAIInterpretation`.

## 2. Marketplace Lifecycle

STATUS: PARTIAL PASS

Production-safe evidence:

- Public posts default to pending moderation for non-admin creators and enqueue moderation/RELU placeholder tasks.
- `findAll()` for public marketplace posts applies `visibility = PUBLIC`, `moderationStatus = APPROVED`, and `status = LIVE`.
- `findOne()` enforces the same public gate unless the caller is the owner or an admin.
- Public post media/document fetches require the asset to be approved unless the caller is admin/owner, and then also require the parent post to be readable.
- Public post delete removes the database row and attempts to delete related stored media/documents.
- Profiles require `visibility = PUBLIC`, `moderationStatus = APPROVED`, and `status = LIVE` before public profile/company access.
- Slugs are unique in the schema for `Profile`, `PublicPost`, and `Project`, and services attempt to resolve conflicts.

Gaps and vulnerable paths:

- Profile documents do not have per-document moderation status. Once the profile is approved, public asset exposure is controlled only by profile-level moderation and `assetKind`.
- `ProfilesService.resolveOwnedAssetUrls()` builds logo/photo/banner/portfolio URLs as `/profiles/:profileId/documents/:documentId`, but `ProfilesController.getDocument()` is protected by `JwtGuard`. Public company/profile assets can therefore be listed on a public page while the actual image request requires authentication.
- `Project` has create/update/archive fields, but no full delete endpoint in `ProjectsController`. The public marketplace "project" lifecycle is mainly `PublicPost` with type `PROJECT`, not the authenticated `Project` workspace entity.
- `ProjectAccessPolicy.isAdmin()` treats only `ADMIN` as admin, not `SUPERADMIN`, which is inconsistent with the rest of the platform.
- Project document downloads/extraction are local-storage only in this phase; non-local document download/extract paths throw.
- `ProjectAIInterpretation` is mutable and not audit-logged, so project extraction and prediction history is incomplete.

Production gap:

- A full company/profile/project lifecycle is structurally present, but not fully proven as one real end-to-end live credentialed flow.

## 3. Public Company Pages

STATUS: PARTIAL PASS

Production-safe evidence:

- `GET /companies/public/:slug` exists in `ProfilesController`.
- `getPublicCompanyProfile()` blocks hidden/unapproved/offline profiles.
- Public company projects are included only when the related `PublicPost` is type `PROJECT`, public, approved, and live.
- Project media/documents are filtered to approved assets before rendering in the company page payload.
- The Next.js company page renders SEO metadata from `companyPage.seo`.

Gaps:

- Profile banner/logo/gallery URLs can point at authenticated `/profiles/:profileId/documents/:documentId` routes, so public pages can show broken assets to anonymous users.
- Company page AI summary selects the latest `ReluClassificationResult` for the profile without filtering to reviewed/approved status. Failed or unreviewed RELU output can become public text if the profile itself is approved.
- Profile assets have no per-asset moderation status, unlike public post media/documents.

False-positive claim:

- "Company banner/logo/gallery handling" is not production-grade yet because public asset routing is wrong for uploaded profile assets.

## 4. Real User Journeys

STATUS: UNVERIFIED

Structurally verified:

- Professional/profile onboarding persists through `Profile` and profile document models.
- Public post publish/upload/moderation persists through `PublicPost`, `PublicPostMedia`, and `PublicPostDocument`.
- RELU profile/post/project actions create durable tasks/runs/results where they use the RELU operational result path.
- Messaging/contact can be triggered from RELU recommendation flows.

Not verified:

- No live credentialed Flow A, Flow B, or Flow C was executed in this audit.
- Existing EXEC-72 proof uses a mock API and cannot prove live upload persistence, live email/contact triggers, live moderation transitions, or live discovery refresh.
- The report correctly said "live credentialed proof not claimed"; EXEC-74 preserves that limitation.

## 5. Backoffice Cleanup

STATUS: PARTIAL PASS

Production-safe evidence:

- The main sidebar now presents operational groups and hides technical links from non-superadmins.
- `TechnicalModeGate` blocks normal-admin rendering for `ai-config`, `ai-control`, `ai-queue`, `admin/taxonomy`, `admin/notifications`, `admin/production-readiness`, `admin/ui-config`, and `admin/import-logs`.
- `admin/relu` transforms output into business summaries, suppresses technical keys, hides UUID-like values, and avoids normal JSON dumps.
- `admin/media` proxies asset previews through clean preview/download links and humanizes storage/internal-server errors.
- `countries-vat` uses compact inline warnings, retry action, and empty states instead of layout-breaking error containers.

Gaps and vulnerable paths:

- `admin/workforce` is still a reachable route and renders `JSON.stringify(item.metadata, null, 2)` in a `<pre>` block.
- `admin/imports` remains a reachable technical taxonomy import page and is not wrapped in `TechnicalModeGate`.
- Several technical pages still exist by design for superadmin. That is acceptable only if backend authorization is equally strict; it is not.

## 6. Role Visibility

STATUS: FAIL

Evidence:

- UI navigation filtering is role-aware and hides technical menu items from non-superadmins.
- Direct technical page rendering is blocked in the browser for normal admins by `TechnicalModeGate`.
- Backend authorization does not match the EXEC-73 visibility model. `DEFAULT_ROLE_PERMISSIONS` gives `ADMIN` the same `MANAGE_USERS` permission set as `SUPERADMIN`.
- Technical APIs such as `/relu/config`, `/relu/prompts-policies`, `/relu/queue`, `/gemini/agents`, taxonomy import endpoints, AI audit logs, and notification delivery diagnostics use `MANAGE_USERS`, `READ`, or `WRITE` permissions rather than a superadmin-only guard.
- There is no `AI_MODERATOR` role in the Prisma `Role` enum.

Architectural risk:

- EXEC-73 isolated technical UI mostly at the client surface, but normal admins can still directly fetch multiple technical APIs if they possess the default admin permission set.

## 7. UI/UX Claims

STATUS: PARTIAL PASS

Verified:

- Main operational routes have real redesign work: cards, badges, moderation actions, empty states, retry states, and responsive grid constraints.
- RELU moderation no longer renders giant raw result JSON in the normal workflow.
- Media/document moderation uses previews, clean file labels, and action buttons.
- Countries/VAT has stable empty/error states.

Remaining technical noise:

- `admin/workforce` still exposes raw metadata JSON.
- Superadmin technical routes correctly expose raw/prompt/config data, but backend isolation is incomplete.
- Company page AI governance renders `sourceResultId`, which is a raw result id on a public-facing company page.

## 8. Browser And Mobile Proof Integrity

STATUS: PARTIAL PASS

Meaningful coverage:

- EXEC-73 browser proof checks Chrome desktop, Edge desktop, Android Chrome, and iPhone Safari user agents.
- EXEC-73 proof asserts no console errors, page errors, failed mock API requests, raw technical text, or horizontal overflow across selected routes.
- EXEC-73 proof intentionally checks that normal admin sees "Technical tools are isolated" on technical pages.
- EXEC-72 proof checks company/profile/public routes across desktop/mobile contexts and fails on console/page/bad responses/overflow.

Limits:

- Both EXEC-72 and EXEC-73 proofs are mock-backed.
- EXEC-72 proof is especially shallow: several routes pass without asserting domain content.
- Neither proof performs live login against production, live upload, live DB persistence verification, backend direct API authorization checks, or real mobile-device testing.
- The proofs cannot validate public company asset routing because the mock company had null assets.

## 9. Repo Hygiene And Release Integrity

STATUS: PARTIAL PASS

Release-safe evidence:

- `git status --short` was clean before EXEC-74 audit docs were created.
- No root `.tmp-*`, `tmp-*`, or `debug.log` artifact was found.
- Tracked secret scan did not find private keys or tracked `.env` files. Firebase web API keys are present in Cloud Build substitutions and are explicitly allowed by the release checker because they are public client configuration.
- EXEC-72/73 proof screenshots and JSON are tracked as relevant proof artifacts.

Local-only caveat:

- Ignored local files still exist in the working copy, including `.logs/`, `.env` variants, local build output, `firebase-admin-openstaff-platform.json`, `smtp.txt`, and runtime logs. They are ignored and not release-tracked, but the local workstation is not artifact-empty.

## Required Final Distinction

### A. Actually Production-Safe

- RELU run/result persistence for RELU-controlled flows.
- Public post visibility filters for discovery.
- Public profile/company gate on profile visibility/moderation/status.
- Public post media/document approval gates and delete cleanup attempts.
- Main backoffice sidebar and visible operational RELU/media/Countries-VAT UX cleanup.

### B. Only Locally Validated

- Browser/mobile layout checks for EXEC-72/73.
- Mocked public company page render.
- Mocked backoffice moderation/media/Countries-VAT technical-text and overflow checks.
- Docs-only claims about real user journeys.

### C. Structurally Correct But Operationally Unverified

- RELU correction and override audit trail.
- RELU rerun preserving result history.
- Moderation state changes affecting public post visibility.
- Contact/conversation trigger from RELU recommendations.
- Public discovery refresh after moderation approval.

### D. Technical Debt

- `ProjectAIInterpretation` mutable single-row design.
- Missing backend superadmin-only protection for technical APIs.
- Missing actual `AI_MODERATOR` role/permission model.
- Profile asset routing uses authenticated document URLs on public pages.
- Profile media lacks per-asset moderation status.
- Hidden raw JSON route remains at `/admin/workforce`.
- Hidden technical import route remains at `/admin/imports`.
- `ProjectAccessPolicy` does not treat `SUPERADMIN` as admin.

### E. Requires Live Production Verification

- Credentialed professional onboarding, CV upload, RELU enrichment, moderation approval, public profile render.
- Contractor company creation, logo/banner/gallery upload, public company page render with real assets.
- Project publish with PDFs/images/video, RELU extraction, moderation, public discovery.
- Subcontractor discovery, conversational search, compatibility match, contact/chat trigger, and pricing/upsell trigger.
- Direct API role-isolation tests using normal admin, AI moderator equivalent, and superadmin accounts.
