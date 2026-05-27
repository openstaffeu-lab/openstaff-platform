# EXEC-76 Proof Index

Date: 2026-05-27

## Verdict

STATUS: IN PROGRESS

EXEC-75 was migrated and deployed to production. Live role isolation, public asset delivery, browser/mobile rendering, and successful project AI append-only history were proven. EXEC-76 remains open because failed project AI rerun append behavior was not live-proven through a safe production route.

## Artifacts

- `rollout-live-proof.json` - migration, schema-check, deploy revision, traffic, health, and readiness evidence
- `runtime-live-proof.json` - live API role, asset, and AI-history proof matrix
- `browser-proof.json` - production browser/mobile proof
- `browser-check.cjs` - sanitized browser proof runner; reads temporary tokens from `.logs/exec76-browser-tokens.json`
- `screenshots/` - production browser screenshots captured during proof

## Live Confirmed

- Migration job `openstaff-api-migrate-exec76-lczlj` succeeded.
- Schema check confirmed new role/permission/media/history objects.
- API/web/admin revisions are live at 100% traffic.
- `/health` and `/status` are OK with empty readiness warnings/errors.
- Technical APIs block `ADMIN`, `AI_MODERATOR`, and anonymous users while allowing `SUPERADMIN`.
- `AI_MODERATOR` can access RELU moderation review.
- Approved public profile/company media renders through `/profiles/assets/:documentId`.
- Pending media stays hidden.
- Browser proof passed on desktop and mobile with no console/page/bad-response/overflow failures.

## Not Fully Proven

- Failed project AI rerun append history remains unproven live. The attempted invalid rerun returned `400` before the failed-run append path, while preserving the last successful current interpretation.
