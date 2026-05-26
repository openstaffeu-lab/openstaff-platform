# EXEC-74 Marketplace Persistence Audit

Date: 2026-05-26

## Status

STATUS: PARTIAL PASS

Marketplace persistence is real for several core surfaces, but the full EXEC-72 operational lifecycle is not complete or fully auditable.

## RELU Persistence

STATUS: PARTIAL PASS

PASS:

- RELU tasks, processing runs, classifications, matches, and recommendations are durable database models.
- RELU reruns create new `ReluProcessingRun` and result rows.
- RELU overrides persist `overrideData`, `reviewedByUserId`, `reviewedAt`, and audit log entries.
- RELU fallback/error states persist with `fallbackUsed` and `errorMessage`.

FAIL:

- `ProjectAIInterpretation` is mutable and unique per project.
- Project AI reruns overwrite prior `extractedJson` and model metadata.
- Project AI interpretation does not append audit events.

## Professional Lifecycle

STATUS: PARTIAL PASS

PASS:

- Profiles persist slug, type, display name, company/person details, visibility, moderation status, lifecycle status, taxonomy, geography, languages, and document relations.
- Public profile access requires `PUBLIC`, `APPROVED`, and `LIVE`.
- Profile document upload persists storage metadata and extraction status.
- Profile document delete removes the database row, deletes storage, and removes asset references.

PARTIAL:

- Profile documents have no per-document moderation status.
- Public asset exposure is profile-level, not asset-level.
- Uploaded public assets can be listed with authenticated document URLs due to `resolveOwnedAssetUrls()`.

UNVERIFIED:

- Live professional onboarding with CV upload and RELU enrichment was not executed in this audit.

## Company Lifecycle

STATUS: PARTIAL PASS

PASS:

- Company pages are represented by `Profile` with contractor/company fields.
- `GET /companies/public/:slug` blocks hidden/unapproved/offline profiles.
- Company project list includes only approved live public project posts.
- Certifications, taxonomy, contact CTA, SEO metadata, and AI summary are structurally returned.

FAIL:

- Public logo/banner/gallery routing is broken for uploaded profile assets because URLs are assembled as authenticated document URLs.
- Company AI summary is selected from the latest profile RELU classification without requiring reviewed/approved result state.
- Profile media lacks per-asset moderation.

UNVERIFIED:

- Live company page with real logo/banner/gallery/media was not verified.

## Project Lifecycle

STATUS: PARTIAL PASS

There are two project concepts:

- Authenticated workspace `Project`
- Public marketplace `PublicPost` with `type = PROJECT`

Workspace `Project`:

- Create/update persist.
- Slugs are unique.
- Documents persist and can be extracted for local storage.
- Archive-like behavior exists through status and `archivedAt`.
- No full delete endpoint exists in `ProjectsController`.
- `ProjectAccessPolicy` omits `SUPERADMIN` from admin handling.
- Project AI interpretation is mutable and not append-only.

Public marketplace project post:

- Create/update/delete persist.
- Public discovery filters `PUBLIC`, `APPROVED`, and `LIVE`.
- Media/documents are individually moderated.
- Delete attempts to remove physical media/document storage after deleting the post.
- Moderation transitions write audit logs.

UNVERIFIED:

- Live project publish with uploaded PDFs/images/video, RELU extraction, moderation approval, and public discovery update was not executed.

## Media And Document Persistence

STATUS: PARTIAL PASS

PASS:

- Public post media/documents persist to local storage or GCS depending on configuration.
- Public post media/document approval is enforced before anonymous asset access.
- Public post delete attempts to remove media/doc files.
- Profile and project document delete remove local/GCS storage where implemented.
- Upload failures emit notifications and audit entries for public post uploads.

PARTIAL:

- Project documents are local-only for download/extraction in this phase.
- Profile public assets lack per-asset moderation.
- Public company asset URLs can point at protected routes.
- Replacement flows were not proven live.

## Public Visibility Filters

STATUS: PASS WITH CAVEATS

PASS:

- Public posts: `visibility = PUBLIC`, `moderationStatus = APPROVED`, `status = LIVE`.
- Public profiles/companies: `visibility = PUBLIC`, `moderationStatus = APPROVED`, `status = LIVE`.
- Public company projects: public post type `PROJECT`, `PUBLIC`, `APPROVED`, `LIVE`.
- Public post media/documents: approved status and readable parent post.

CAVEAT:

- Profile/company asset docs do not have per-document moderation and route through authenticated document URLs.

## Orphan Prevention

STATUS: PARTIAL PASS

PASS:

- Public post delete deletes DB row and attempts physical media/document cleanup.
- Profile document delete removes DB row, storage, and asset reference.
- Project document delete removes local storage when storage provider is local.

PARTIAL:

- Storage delete errors are swallowed for public post deletes, so cleanup best-effort success is not observable by callers.
- No periodic orphan scanner was found.
- Non-local project document delete cleanup is not implemented.
