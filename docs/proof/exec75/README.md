# EXEC-75 Proof Index

Date: 2026-05-26

## Goal

EXEC-75 remediates EXEC-74 findings for backend role isolation, AI Moderator permissions, public company/profile asset delivery, profile media moderation, append-only project AI history, and remaining raw backoffice route leakage.

## Local Validation Completed

- `apps/admin/api -> npx.cmd prisma validate`
- `apps/admin/api -> npx.cmd prisma generate`
- `apps/admin/api -> npm.cmd test -- --runInBand`
- `apps/admin/api -> npm.cmd run build`
- `apps/admin/api -> npm.cmd run lint`
- `apps/admin -> npm.cmd run build`
- `apps/admin -> npm.cmd run lint`
- `apps/admin/web -> npm.cmd run build`
- `apps/admin/web -> npm.cmd run lint`
- `node docs/proof/exec75/browser-check.cjs`

## Code Proof

- backend technical APIs now require `MANAGE_TECHNICAL_OPERATIONS`
- `AI_MODERATOR` and `MODERATE_AI` exist in schema and default permissions
- AI Moderator can access RELU moderation review only
- public profile/company assets use approved anonymous asset delivery
- profile media has per-asset moderation status
- project AI interpretation reruns append history before updating current state
- failed project AI reruns append failed history and preserve prior success
- `/admin/imports` is technical-gated
- `/admin/workforce` no longer renders raw metadata JSON

## Tests Added

- `apps/admin/api/src/access-control/permissions.guard.spec.ts`
- `apps/admin/api/src/profiles/profiles.service.spec.ts`
- `apps/admin/api/src/projects/project-ai-interpretations.service.spec.ts`

## Browser Proof

Status: PASS locally with mock-backed browser proof.

Captured by `docs/proof/exec75/browser-proof.json`:

- Chrome desktop public company page loaded approved logo, banner, and gallery asset URLs through `/profiles/assets/:documentId` with `200` responses
- Android Chrome mobile public company page loaded the same approved assets with no horizontal overflow
- normal `ADMIN` direct access to `/ai-control` and `/admin/imports` rendered technical isolation
- `AI_MODERATOR` rendered `/admin/relu` and was isolated from `/ai-control`
- `SUPERADMIN` rendered technical prompt tooling
- console errors, page errors, bad responses, failed checks, and mobile overflow were empty

Limit:

- This proof is local and mock-backed. Production still needs credentialed live browser proof after migration and deploy.

## Production Work Still Required

- apply the EXEC-75 Prisma migration safely
- deploy API, public web, and backoffice revisions
- run direct credentialed role probes against production
- approve one controlled company/profile logo, banner, and gallery asset
- capture anonymous browser proof for approved assets
- capture blocked proof for unapproved/private assets
- capture project AI history proof on a controlled live project

## Current Honest Verdict

`PASS LOCALLY - PRODUCTION PROOF PENDING`

The EXEC-74 code-level failures have been remediated, tested, and locally browser-smoked. Production PASS still requires migration, deployment, credentialed browser proof, and live asset/history verification.
