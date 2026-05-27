# EXEC-75 Role Isolation Proof

Date: 2026-05-26

## Status

STATUS: PASS LOCALLY

EXEC-75 replaces EXEC-73's client-side-only technical hiding with backend permission enforcement.

## Role And Permission Model

Implemented:

- `Role.AI_MODERATOR`
- `Permission.MODERATE_AI`
- `Permission.MANAGE_TECHNICAL_OPERATIONS`

Default permission posture:

- `SUPERADMIN`: operational permissions plus `MODERATE_AI` and `MANAGE_TECHNICAL_OPERATIONS`
- `ADMIN`: operational permissions plus `MODERATE_AI`, without technical permission
- `AI_MODERATOR`: `READ` and `MODERATE_AI` only

## Technical API Restrictions

Technical permission is now required for:

- `/relu/config`
- `/relu/prompts-policies`
- `/relu/queue`
- `/gemini/agents`
- taxonomy import and taxonomy browser endpoints
- AI/security audit diagnostics
- notification event and delivery diagnostics
- workflow automation diagnostic runs

## Moderation API Access

`MODERATE_AI` is required for:

- `/admin/relu/runs`
- `/admin/relu/results`
- RELU result status review
- RELU result override/correction
- admin public-post RELU ingest/classify reruns

AI Moderator can use these review flows but cannot access prompt, config, queue, import, delivery, or diagnostic tooling.

## Backoffice Route Behavior

Evidence:

- `AdminLayoutShell` grants AI Moderator access only to the RELU moderation navigation item.
- AI Moderator direct-route attempts outside `/admin/relu` render a role-isolation notice.
- `TechnicalModeGate` still protects technical UI for normal admins.
- `/admin/imports` is now technical-gated.

## Test Proof

`apps/admin/api/src/access-control/permissions.guard.spec.ts` proves:

- anonymous callers are denied
- normal `ADMIN` is denied for `MANAGE_TECHNICAL_OPERATIONS`
- `SUPERADMIN` is allowed for `MANAGE_TECHNICAL_OPERATIONS`
- `AI_MODERATOR` is allowed for `MODERATE_AI`
- `AI_MODERATOR` is denied for `MANAGE_TECHNICAL_OPERATIONS`

## Remaining Production Verification

After deploy, credentialed live probes should verify direct HTTP status codes:

- `ADMIN -> GET /relu/config = 403`
- `ADMIN -> GET /relu/queue = 403`
- `ADMIN -> GET /gemini/agents = 403`
- `AI_MODERATOR -> GET /admin/relu/results = 200`
- `AI_MODERATOR -> GET /relu/config = 403`
- `SUPERADMIN -> GET /relu/config = 200`
