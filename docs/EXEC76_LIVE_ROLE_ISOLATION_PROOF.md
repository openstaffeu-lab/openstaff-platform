# EXEC-76 Live Role Isolation Proof

Date: 2026-05-27

## Status

STATUS: PASS

Controlled production users were created for `ADMIN`, `AI_MODERATOR`, and `SUPERADMIN` inside Cloud Run proof job `openstaff-api-exec76-live-proof`, execution `openstaff-api-exec76-live-proof-fvdvj`.

## Live API Matrix

For each technical endpoint, anonymous users received `401`, normal `ADMIN` received `403`, `AI_MODERATOR` received `403`, and `SUPERADMIN` received `200`.

Endpoints proven:

- `/relu/config`
- `/relu/prompts-policies`
- `/relu/queue`
- `/gemini/agents`
- `/taxonomy/admin/import-options`
- `/taxonomy/admin/imports`
- `/audit/ai-actions`
- `/admin/security/audit-logs`
- `/admin/security/events`
- `/admin/notifications/deliveries`

RELU moderation review:

- `AI_MODERATOR` on `/admin/relu/results`: `200`
- `ADMIN` on `/admin/relu/results`: `200`
- anonymous on `/admin/relu/results`: `401`

## Browser Proof

`docs/proof/exec76/browser-proof.json` confirms:

- normal `ADMIN` direct technical routes render blocked technical isolation states
- `AI_MODERATOR` can open `/admin/relu`
- `AI_MODERATOR` direct technical route shows the RELU-only boundary
- `SUPERADMIN` can open technical pages
- `/admin/imports` is gated for non-superadmin roles
- `/admin/workforce` had no raw UUID/storage/internal text match in the checked view
- console errors, page errors, bad responses, and mobile overflow were empty

## Evidence

Primary evidence: `docs/proof/exec76/runtime-live-proof.json` and `docs/proof/exec76/browser-proof.json`.
