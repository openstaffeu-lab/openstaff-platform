# EXEC-77A.1 RELU Builder Security

Date: 2026-05-29

## Status

STATUS: BACKEND HARDENED LOCALLY

This pass closes the backend RELU AI Builder production-safety gap before frontend integration.

## Authorization Matrix

| Surface | SUPERADMIN | ADMIN | AI_MODERATOR |
| --- | --- | --- | --- |
| `POST /relu-ai-builder/*` | ALLOW | DENY | DENY |
| `GET/PATCH /relu/config*` | ALLOW | DENY | DENY |
| `GET /relu/queue` | ALLOW | DENY | DENY |
| `GET/PATCH /relu/prompts-policies*` | ALLOW | DENY | DENY |
| `GET/PATCH /gemini/agents*` | ALLOW | DENY | DENY |
| `POST /gemini/compliance-check` | ALLOW | DENY | DENY |
| `POST /gemini/pcb-assist` | ALLOW | DENY | DENY |
| `taxonomy/admin/import*` | ALLOW | DENY | DENY |
| `admin/notifications/events` | ALLOW | DENY | DENY |
| `admin/notifications/deliveries*` | ALLOW | DENY | DENY |
| `admin/workflow-automation/runs` | ALLOW | DENY | DENY |
| `POST /notifications/recompute-compliance-reminders` | ALLOW | DENY | DENY |
| `POST /notifications/send` | ALLOW | DENY | DENY |
| `admin/relu` moderation review | ALLOW | ALLOW | ALLOW |

`MANAGE_TECHNICAL_OPERATIONS` is enforced as SUPERADMIN-only in `PermissionsGuard`, so stored role-permission rows cannot accidentally grant technical routes to ADMIN or AI_MODERATOR.

## Persistence Guarantees

- Each RELU Builder call creates a new `ReluProcessingRun` before invoking Gemini.
- Successful calls update only that run to `COMPLETED`.
- Failed calls update only that run to `FAILED` with `errorMessage` and output payload.
- Audit records are written for success and failure.
- The builder now calls `GeminiService.executeAgent`; it is no longer a local echo stub.

## Prisma

EXEC-77A.1 adds migration `20260529110000_exec77a1_relu_builder_domains` for:

- `ESCO`
- `NACE`
- `UNICLASS`
- `INTENT`
- `SUMMARY`
- `GEOGRAPHY`

## Remaining Scope Boundary

No frontend routes or UI components were changed in this pass. `/admin/imports` and `/admin/workforce` direct-route UI concerns remain outside this backend-only EXEC-77A.1 change.

## EXEC-77A.2 Real DB / Production Verification

STATUS: PASS

EXEC-77A is now closed for backend/security/migration verification. The RELU Builder migration was verified against real Cloud SQL PostgreSQL through Cloud Run jobs, not only local Prisma commands.

### Migration Status

| Check | Result | Evidence |
| --- | --- | --- |
| real DB reachability | PASS | Cloud Run job `openstaff-api-exec77a2-migrate-status` reached `openstaff_prod` through Cloud SQL |
| pre-apply status | PASS | `20260529110000_exec77a1_relu_builder_domains` was reported pending before deploy |
| migration apply | PASS | job `openstaff-api-exec77a2-migrate-deploy`, execution `openstaff-api-exec77a2-migrate-deploy-qgs8t`, applied the migration |
| post-apply status | PASS | execution `openstaff-api-exec77a2-migrate-status-fmnxz` returned `PRISMA_STATUS_EXIT:0` and `Database schema is up to date!` |
| DB enum proof | PASS | job `openstaff-api-exec77a2-enum-proof`, execution `openstaff-api-exec77a2-enum-proof-rvlxh`, returned `DB_ENUM_LABELS:["ESCO","GEOGRAPHY","INTENT","NACE","SUMMARY","UNICLASS"]` |
| client enum proof | PASS | local generated Prisma client exposes all required enum values |

### Authorization Matrix

| Surface | SUPERADMIN | ADMIN | AI_MODERATOR |
| --- | --- | --- | --- |
| RELU Builder technical endpoints | ALLOW | DENY | DENY |
| RELU config/prompts/queue endpoints | ALLOW | DENY | DENY |
| Gemini admin/technical endpoints | ALLOW | DENY | DENY |
| taxonomy import/admin endpoints | ALLOW | DENY | DENY |
| notification diagnostic/send endpoints | ALLOW | DENY | DENY |
| RELU moderation surfaces | ALLOW | ALLOW | ALLOW |

`MANAGE_TECHNICAL_OPERATIONS` remains SUPERADMIN-only at guard level. Tests cover the case where an ADMIN is accidentally granted the permission in DB-derived permissions and is still denied.

### Persistence Proof

Tests verify that RELU Builder invokes `GeminiService.executeAgent`, creates append-only `ReluProcessingRun` rows, persists successful and failed run outcomes, writes audit logs, and does not behave as a local echo stub.

### Validation Results

- `npx.cmd prisma validate`: PASS
- `npx.cmd prisma generate`: PASS
- `npm.cmd run build`: PASS
- `npm.cmd test -- --runInBand`: PASS, 19 suites / 38 tests
- `npm.cmd run lint`: PASS, 413 warnings / 0 errors

### Remaining Risks

- The backend image containing this commit still needs a normal rollout after commit/push.
- Cloud Build could not push a temporary proof image because the default build service account lacks Artifact Registry upload permission. Migration proof used existing API image jobs with injected Prisma commands instead.
- Untracked root `src/` and zero-byte `OPENSTAFF_AUDIT_2026-05*.md` files are unrelated and intentionally excluded from EXEC-77A.2.

### Deploy Readiness

Backend migration and security verification are production-ready. Frontend integration must not start until the committed backend change set is deployed through the normal release path.

## EXEC-77A.3 Backend Deployment Rollout & Live Smoke Proof

STATUS: BLOCKED

The committed EXEC-77A backend image was deployed through the normal OpenStaff API Cloud Build path, but live RELU Builder success smoke proof is blocked by an expired production Gemini API key.

### Deployment

| Item | Result |
| --- | --- |
| Cloud Build config | `apps/admin/api/cloudbuild.api.yaml` |
| failed pre-IAM build | `f76f72c3-dbf3-46c7-b553-b46c0ad12662`, failed in `push-api` |
| successful build | `b7d4ac09-3167-4265-81d1-567dc3ba7abf` |
| deployed image | `europe-west1-docker.pkg.dev/openstaff-platform/openstaff-repo/openstaff-api:b7d4ac09-3167-4265-81d1-567dc3ba7abf` |
| new API revision | `openstaff-api-00035-d5r` |
| traffic | 100% to `openstaff-api-00035-d5r` |

The default Cloud Build service account initially lacked Artifact Registry/log/deploy permissions. Rollout IAM was corrected, and the same normal API Cloud Build config then succeeded.

### Health And Status

- `https://api.openstaff.eu/health`: `status=ok`
- `https://api.openstaff.eu/status`: `status=ok`
- DB: `healthy`
- `readiness.errors`: `[]`
- `readiness.warnings`: `[]`

### Live Authorization Proof

Cloud Run job `openstaff-api-exec77a3-live-proof-v2`, execution `openstaff-api-exec77a3-live-proof-v2-gcwgd`, called `POST /relu-ai-builder/summary` with controlled short-lived tokens.

| Actor | Result |
| --- | ---: |
| anonymous | 401 |
| ADMIN | 403 |
| AI_MODERATOR | 403 |
| SUPERADMIN | 201 |

### Live Persistence Proof

The SUPERADMIN request created `ReluProcessingRun` `94182de3-1923-4979-82e3-cea7e30f34c5`.

Observed state:

- domain: `SUMMARY`
- status: `FAILED`
- `completedAt`: present
- audit log: `5859c867-baf8-406a-a0a5-eb57dd9329d4`
- audit action: `GENERATE_SUMMARY_FAILED`

Failure reason:

`GEMINI_API_KEY` is expired. Gemini returned `API_KEY_INVALID` / `API key expired`.

This proves the deployed builder reaches the Gemini execution path and persists provider failure safely. It does not prove a successful `COMPLETED` live run.

### Validation Results

- `npx.cmd prisma validate`: PASS
- `npx.cmd prisma generate`: PASS
- `npm.cmd run build`: PASS
- `npm.cmd test -- --runInBand`: PASS, 19 suites / 38 tests
- `npm.cmd run lint`: PASS, 413 warnings / 0 errors

### Remaining Risks

- Renew production `GEMINI_API_KEY`.
- Rerun the EXEC-77A.3 live smoke proof and require `COMPLETED` RELU Builder persistence before frontend integration.
- EXEC-77B remains blocked until that success proof exists.
