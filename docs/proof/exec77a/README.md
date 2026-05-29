# EXEC-77A Proof

Date: 2026-05-29

## EXEC-77A.2 Real DB / Production Verification

### Migration Status

Cloud SQL instance: `openstaff-platform:europe-west1:openstaff-db`

Database observed by Prisma: `openstaff_prod`

Pre-apply status job:

- Job: `openstaff-api-exec77a2-migrate-status`
- Result before deploy: migration `20260529110000_exec77a1_relu_builder_domains` was pending.

Deploy job:

- Job: `openstaff-api-exec77a2-migrate-deploy`
- Execution: `openstaff-api-exec77a2-migrate-deploy-qgs8t`
- Result: `Applying migration 20260529110000_exec77a1_relu_builder_domains`; `All migrations have been successfully applied.`

Post-apply status job:

- Job: `openstaff-api-exec77a2-migrate-status`
- Execution: `openstaff-api-exec77a2-migrate-status-fmnxz`
- Result: `PRISMA_STATUS_EXIT:0`; `Database schema is up to date!`

Enum proof job:

- Job: `openstaff-api-exec77a2-enum-proof`
- Execution: `openstaff-api-exec77a2-enum-proof-rvlxh`
- Result: `DB_ENUM_LABELS:["ESCO","GEOGRAPHY","INTENT","NACE","SUMMARY","UNICLASS"]`

Local generated Prisma client exposes `ReluProcessingDomain` values:

- `ESCO`
- `NACE`
- `UNICLASS`
- `INTENT`
- `SUMMARY`
- `GEOGRAPHY`

### Authorization Matrix

| Surface | SUPERADMIN | ADMIN | AI_MODERATOR | Proof |
|---|---:|---:|---:|---|
| `POST /relu-ai-builder/*` | ALLOW | DENY | DENY | Controller metadata and `PermissionsGuard` tests |
| `GET/PATCH /relu/config*` | ALLOW | DENY | DENY | `MANAGE_TECHNICAL_OPERATIONS` route gate |
| `GET /relu/queue` | ALLOW | DENY | DENY | `MANAGE_TECHNICAL_OPERATIONS` route gate |
| `GET/PATCH /relu/prompts-policies*` | ALLOW | DENY | DENY | `MANAGE_TECHNICAL_OPERATIONS` route gate |
| `GET/PATCH /gemini/agents*` | ALLOW | DENY | DENY | `MANAGE_TECHNICAL_OPERATIONS` route gate |
| `POST /gemini/compliance-check` | ALLOW | DENY | DENY | `MANAGE_TECHNICAL_OPERATIONS` route gate |
| `POST /gemini/pcb-assist` | ALLOW | DENY | DENY | `MANAGE_TECHNICAL_OPERATIONS` route gate |
| taxonomy imports/admin tooling | ALLOW | DENY | DENY | `MANAGE_TECHNICAL_OPERATIONS` route gate |
| notification diagnostics/send tooling | ALLOW | DENY | DENY | `MANAGE_TECHNICAL_OPERATIONS` route gate |
| RELU moderation review | ALLOW | ALLOW | ALLOW | Existing moderation surface remains separate from builder tooling |

`MANAGE_TECHNICAL_OPERATIONS` is guarded as SUPERADMIN-only in `PermissionsGuard`, so an accidental DB role-permission grant cannot make a normal ADMIN or AI_MODERATOR eligible for technical RELU Builder endpoints.

### Persistence Proof

Unit tests verify:

- `GeminiService.executeAgent` is invoked by RELU Builder.
- A new `ReluProcessingRun` is created before Gemini execution.
- Successful execution updates the created run to `COMPLETED`.
- Failed execution updates the created run to `FAILED`.
- Success and failure paths write audit logs.
- Returned payloads are controlled status/output objects, not local echo stubs.

### Validation Results

- `npx.cmd prisma validate`: PASS
- `npx.cmd prisma generate`: PASS
- `npm.cmd run build`: PASS
- `npm.cmd test -- --runInBand`: PASS, 19 suites / 38 tests
- `npm.cmd run lint`: PASS, 413 warnings / 0 errors

### Remaining Risks

- The new backend image still requires the normal deployment rollout after commit/push.
- Temporary proof-image push failed because the Cloud Build service account lacked Artifact Registry upload permission; this did not block DB verification because Cloud Run jobs reached Cloud SQL and executed Prisma proof commands.
- Root `src/` and `OPENSTAFF_AUDIT_2026-05*.md` remain untracked and are excluded from EXEC-77A.2.

## EXEC-77A.3 Backend Deployment Rollout & Live Smoke Proof

### Rollout

Normal API Cloud Build config: `apps/admin/api/cloudbuild.api.yaml`

First build:

- ID: `f76f72c3-dbf3-46c7-b553-b46c0ad12662`
- Result: FAILED at `push-api`
- Cause: default Cloud Build service account did not have enough Artifact Registry/log/deploy IAM for the normal path.

Successful build:

- ID: `b7d4ac09-3167-4265-81d1-567dc3ba7abf`
- Result: SUCCESS
- Image: `europe-west1-docker.pkg.dev/openstaff-platform/openstaff-repo/openstaff-api:b7d4ac09-3167-4265-81d1-567dc3ba7abf`

Cloud Run:

- Service: `openstaff-api`
- Region: `europe-west1`
- Revision: `openstaff-api-00035-d5r`
- Ready: yes
- Traffic: 100%

### Health And Status Proof

- `/health`: `status=ok`
- `/status`: `status=ok`
- `/status.db`: `healthy`
- `/status.readiness.errors`: `[]`
- `/status.readiness.warnings`: `[]`

### Authorization Live Proof

Job: `openstaff-api-exec77a3-live-proof-v2`

Execution: `openstaff-api-exec77a3-live-proof-v2-gcwgd`

Endpoint: `POST /relu-ai-builder/summary`

| Actor | Status |
|---|---:|
| anonymous | 401 |
| ADMIN | 403 |
| AI_MODERATOR | 403 |
| SUPERADMIN | 201 |

### Persistence Live Proof

The SUPERADMIN request created run `94182de3-1923-4979-82e3-cea7e30f34c5`.

| Field | Value |
|---|---|
| domain | `SUMMARY` |
| status | `FAILED` |
| completedAt | present |
| audit log id | `5859c867-baf8-406a-a0a5-eb57dd9329d4` |
| audit action | `GENERATE_SUMMARY_FAILED` |

The deployed endpoint reached the Gemini path and persisted the provider failure safely. The provider response was `API_KEY_INVALID` / `API key expired`, so a successful `COMPLETED` live run could not be proven.

### Validation Results

- `npx.cmd prisma validate`: PASS
- `npx.cmd prisma generate`: PASS
- `npm.cmd run build`: PASS
- `npm.cmd test -- --runInBand`: PASS, 19 suites / 38 tests
- `npm.cmd run lint`: PASS, 413 warnings / 0 errors

### Verdict

BLOCKED

EXEC-77B is not unblocked. Renew `GEMINI_API_KEY`, rerun live RELU Builder smoke proof, and require a `COMPLETED` run plus audit proof before frontend integration.

## EXEC-77A.3A Gemini Secret Recovery

### Git Safety

Branch: `feature/work-in-progress`

No EXEC-77A code changes were pending. The following unrelated untracked files remained unstaged:

- `src/`
- `OPENSTAFF_AUDIT_2026-05.md`
- `OPENSTAFF_AUDIT_2026-05_BACKUP.md`

### Secret Manager Status

Secret: `GEMINI_API_KEY`

Status:

- secret exists
- version `1`: enabled, created `2026-05-15T18:15:47`
- version `2`: enabled, created `2026-05-29T16:46:47`

Version `1` was proven invalid by direct Gemini smoke:

- result: `API_KEY_INVALID`
- provider message class: API key expired

Version `2` was created from replacement Gemini API key UID `3d954e2a-67cb-4b17-ae13-2353d8d0dd31`. The secret value is not stored in the repository or documentation.

A transient key created during CLI testing was deleted immediately after the CLI printed the operation result. That deleted key is not the active Secret Manager version.

### Cloud Run Runtime

Service: `openstaff-api`

Region: `europe-west1`

Active revision after refresh: `openstaff-api-00036-gx2`

Traffic: 100%

Runtime mapping:

- `GEMINI_API_KEY`: Secret Manager `GEMINI_API_KEY:latest`
- non-secret refresh marker: `GEMINI_SECRET_VERSION=2`

### Gemini Smoke Proof

Job: `openstaff-api-exec77a3a-gemini-smoke`

Direct Gemini smoke uses `@google/generative-ai` against `gemini-2.5-flash` with the mounted `GEMINI_API_KEY`.

After rotation to version `2`:

- `API_KEY_INVALID`: not present
- `AUTHENTICATION_ERROR`: not present
- `PERMISSION_DENIED`: not present
- response: `429 Too Many Requests`
- provider cause: prepayment credits are depleted

This proves the authentication blocker was removed, but a successful `2xx` Gemini response is still blocked by billing/prepayment state.

### Health Proof

- `https://api.openstaff.eu/health`: `status=ok`
- `https://api.openstaff.eu/status`: `status=ok`
- DB: `healthy`
- `readiness.errors`: `[]`
- `readiness.warnings`: `[]`

### Remaining Risks

- Restore Google AI Studio / Gemini prepaid credits or billing for the active project/key.
- Rerun direct Gemini smoke and require a `2xx` response.
- Rerun RELU Builder live smoke and require a `COMPLETED` `ReluProcessingRun` plus audit proof.
- EXEC-77B remains blocked until those smoke proofs pass.

### Verdict

BLOCKED

Gemini authentication is recovered, Cloud Run uses the rotated secret, and API health is clean. Gemini runtime success is still blocked by provider billing/prepayment depletion.

## EXEC-77A.3B Gemini Billing/Credit Recovery

### Git Safety

Branch: `feature/work-in-progress`

No code, schema, migration, frontend, guard, or RELU Builder files were modified. The following unrelated files remained untracked and unstaged:

- `src/`
- `OPENSTAFF_AUDIT_2026-05.md`
- `OPENSTAFF_AUDIT_2026-05_BACKUP.md`

### Billing/Credit Status

GCP project billing:

- project: `openstaff-platform`
- billing enabled: yes
- billing account: `0188D8-886DC3-5B8D75`
- billing account open: yes

Gemini API:

- `generativelanguage.googleapis.com`: enabled

Direct Gemini smoke still reports provider-side prepaid credit depletion. No approved alternate funded Gemini project/key was available in the current environment, and no repository or application code change can restore AI Studio prepaid credits.

### Active Secret Version

Secret: `GEMINI_API_KEY`

Active version: `2`

State: enabled

No secret value is documented or committed.

### Active Runtime

Cloud Run service: `openstaff-api`

Active revision: `openstaff-api-00036-gx2`

Traffic: 100%

Runtime mapping:

- `GEMINI_API_KEY`: Secret Manager `GEMINI_API_KEY:latest`
- `GEMINI_SECRET_VERSION`: `2`

### Direct Gemini Smoke Proof

Job: `openstaff-api-exec77a3a-gemini-smoke`

Latest execution result:

- `API_KEY_INVALID`: not present
- `AUTHENTICATION_ERROR`: not present
- `PERMISSION_DENIED`: not present
- `429 Too Many Requests`: present
- provider cause: prepayment credits are depleted
- provider success / 2xx: not achieved

### Health Proof

- `https://api.openstaff.eu/health`: `status=ok`
- `https://api.openstaff.eu/status`: `status=ok`
- DB: `healthy`
- `readiness.errors`: `[]`
- `readiness.warnings`: `[]`

### Remaining Risks

- Restore Google AI Studio / Gemini prepaid credits on the active project/key, or provide an approved funded Gemini key.
- Rotate `GEMINI_API_KEY` again only if a new funded key is provided.
- Rerun direct Gemini smoke and require provider success / 2xx.
- Only after direct Gemini success, rerun RELU Builder live smoke and require a `COMPLETED` run plus audit proof.

### EXEC-77A.4 Readiness

EXEC-77A.4 is not unblocked. Direct Gemini 2xx proof is still missing.

### Verdict

BLOCKED
