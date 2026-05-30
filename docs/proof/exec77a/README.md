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

## EXEC-77A.3C Gemini Root Cause Analysis

### Billing Findings

Project: `openstaff-platform`

Project number: `605639023972`

Billing:

- billing enabled: yes
- billing account: `0188D8-886DC3-5B8D75`
- billing account open: yes

This proves the GCP project has a linked/open billing account. It does not override the provider response that Gemini prepaid credits are depleted.

### Project Linkage Findings

Gemini API:

- `generativelanguage.googleapis.com`: enabled

Active API key:

- UID: `3d954e2a-67cb-4b17-ae13-2353d8d0dd31`
- project: `projects/605639023972`
- restriction: `generativelanguage.googleapis.com`

Cloud Run:

- service: `openstaff-api`
- active revision: `openstaff-api-00036-gx2`
- traffic: 100%
- `GEMINI_API_KEY`: Secret Manager `GEMINI_API_KEY:latest`
- `GEMINI_SECRET_VERSION`: `2`

This proves the active runtime, key, API, and project are aligned.

### Quota Findings

Cloud Quotas metadata for `generativelanguage.googleapis.com` lists configured generate-content limits for `gemini-2.5-flash`, including request-per-minute, request-per-day, and input-token-per-minute dimensions across free/paid tiers.

Quota preferences:

- `gcloud beta quotas preferences list --project=openstaff-platform`: `[]`

No project-level quota override preference is configured.

The direct provider error did not include quota metric metadata or a specific rate-limit bucket. It returned a billing/prepayment message instead.

### Provider Response Evidence

Job: `openstaff-api-exec77a3c-gemini-rest-error`

Execution: `openstaff-api-exec77a3c-gemini-rest-error-zcdq8`

Request type: direct REST call to `gemini-2.5-flash:generateContent` using mounted `GEMINI_API_KEY:latest`.

Sanitized provider result:

- HTTP status: `429`
- HTTP text: `Too Many Requests`
- Gemini error code: `429`
- Gemini error status: `RESOURCE_EXHAUSTED`
- Gemini error message: `Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing.`
- error details: `[]`
- generated response: not present

No API key value was logged.

### Root Cause

Exact root cause: Gemini / Google AI Studio prepaid credits are depleted for the active project/key.

Ruled out by evidence:

- expired key: ruled out after version `2` rotation; no `API_KEY_INVALID`
- auth failure: no `AUTHENTICATION_ERROR`
- permission failure: no `PERMISSION_DENIED`
- disabled API: `generativelanguage.googleapis.com` is enabled
- wrong project/key linkage: key UID belongs to `projects/605639023972`
- missing runtime secret: Cloud Run maps `GEMINI_API_KEY:latest`
- local code failure: direct REST call fails before RELU Builder logic

### Required Remediation

Add or restore Gemini prepaid credits in AI Studio for the active project/key, or provide an approved funded Gemini key. After funding is restored:

1. rerun direct Gemini REST smoke and require provider success / 2xx
2. rerun RELU Builder live smoke and require `ReluProcessingRun.status = COMPLETED`
3. confirm audit log creation for the completed run

### Verdict

PASS

The exact 429 root cause is proven. Runtime success is still blocked until Gemini prepaid credits are restored.

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

## EXEC-77A.4 Live Gemini Success Proof

Date: 2026-05-30

### Git Safety

No schema, migration, backend authorization, `MANAGE_TECHNICAL_OPERATIONS`, frontend, or EXEC-77B implementation files were modified. This proof update only records the blocked live provider check.

The existing unrelated untracked files remain excluded:

- `src/`
- `OPENSTAFF_AUDIT_2026-05.md`
- `OPENSTAFF_AUDIT_2026-05_BACKUP.md`

### Direct Gemini Recovery Gate

Job: `openstaff-api-exec77a3a-gemini-smoke`

Execution: `openstaff-api-exec77a3a-gemini-smoke-q6dp2`

Model: `gemini-2.5-flash`

Observed result:

- execution status: failed
- provider success / 2xx: not achieved
- provider response: `[429 Too Many Requests] Your prepayment credits are depleted`
- `authErrors`: `[]`
- `API_KEY_INVALID`: not present
- `AUTHENTICATION_ERROR`: not present
- `PERMISSION_DENIED`: not present

This means the key/auth/runtime path remains valid enough to reach Gemini, but provider billing/prepaid credits still block generation.

### RELU Builder Success Proof

Not run.

Reason: EXEC-77A.4 required stopping immediately if Gemini billing was still exhausted. Because direct Gemini smoke did not return 2xx, the taxonomy, ESCO, NACE, and geography builder calls were not executed.

### Persistence And Audit Proof

Not run.

Reason: no successful live builder call was attempted after the Gemini gate failed, so no honest `ReluProcessingRun.status = COMPLETED` or successful `AuditLog` proof can be claimed for EXEC-77A.4.

### Authorization And Health Recheck

Not run.

Reason: direct Gemini recovery failed first, so the remaining EXEC-77A.4 proof matrix remains blocked.

### Verdict

BLOCKED

EXEC-77A.4 is still blocked by Gemini/AI Studio prepaid credit depletion. Restore credits or provide an approved funded Gemini key, then rerun from the direct Gemini smoke gate. EXEC-77B remains blocked.

## EXEC-77A.4R Completed Live Gemini Success Proof

Date: 2026-05-30

### Git Safety

Branch: `feature/work-in-progress`

The following unrelated files remained untracked and unstaged:

- `src/`
- `OPENSTAFF_AUDIT_2026-05.md`
- `OPENSTAFF_AUDIT_2026-05_BACKUP.md`

No frontend/UI, backend logic, Prisma schema, migration, guard, or `MANAGE_TECHNICAL_OPERATIONS` files were modified. No EXEC-77B implementation was started.

### Direct Gemini Smoke

Job: `openstaff-api-exec77a3a-gemini-smoke`

Execution: `openstaff-api-exec77a3a-gemini-smoke-khpk4`

Structured result:

- `ok`: `true`
- `status`: `2xx`
- model: `gemini-2.5-flash`
- `responsePresent`: `true`
- `authErrors`: `[]`

Negative checks:

- no `429`
- no `RESOURCE_EXHAUSTED`
- no `API_KEY_INVALID`
- no `AUTHENTICATION_ERROR`
- no `PERMISSION_DENIED`

### Live RELU Builder Proof

Job: `openstaff-api-exec77a4r-live-proof`

Execution: `openstaff-api-exec77a4r-live-proof-4xh7x`

Run key: `exec77a4r-1780144237943`

| Label | Endpoint | HTTP | Run ID | Domain | DB status | Audit ID | Audit action |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| summary | `/relu-ai-builder/summary` | 201 | `b8567013-4f36-4135-8014-cb80848f3a0d` | `SUMMARY` | `COMPLETED` | `2db025bf-447b-4be9-9060-63669c0f36f9` | `GENERATE_SUMMARY` |
| taxonomy | `/relu-ai-builder/taxonomy` | 201 | `f5d87f1e-d65e-4b0e-a247-4a55b8539c88` | `TAXONOMY` | `COMPLETED` | `c59933b9-0ed5-48b5-a7d5-aace106a3d8b` | `SUGGEST_TAXONOMY` |
| esco | `/relu-ai-builder/esco` | 201 | `bce2f211-79b7-46dd-9a9f-cb8d2b46756c` | `ESCO` | `COMPLETED` | `017fc8fd-9e54-4cef-9bf5-ddcd6c32f1a8` | `SUGGEST_ESCO` |
| nace | `/relu-ai-builder/nace` | 201 | `b5d24d29-ad13-419b-8e85-df48ae8f7bab` | `NACE` | `COMPLETED` | `589212f0-dbeb-49b7-8a60-3423030d09fd` | `SUGGEST_NACE` |
| geography | `/relu-ai-builder/geography` | 201 | `c7d93b72-d52b-4f2d-bbe4-05a1382b6f68` | `GEOGRAPHY` | `COMPLETED` | `a942404d-298a-4cc9-a37a-0b28350d7efc` | `SUGGEST_GEOGRAPHY` |

For each endpoint:

- response included controlled `outputData`
- Gemini agent name was present
- Gemini response was present and non-empty
- no output error was present
- no stack-trace-like output was present
- no secret-like API key value was present

### Persistence Proof

Proof actor completed run count: `5`

Expected completed run count: `5`

Append-only history: PASS

Previous failed run preservation:

- run ID: `94182de3-1923-4979-82e3-cea7e30f34c5`
- still present: yes
- status: `FAILED`

Each successful run had:

- `ReluProcessingRun` row present
- `status=COMPLETED`
- `completedAt` present
- `triggeredByUserId` present

### Audit Proof

Each successful run had a matching `AuditLog` row with:

- `entityType=RELU_AI_BUILDER_RUN`
- `actorUserId` present
- success action recorded
- timestamp present

### Authorization Recheck

| Actor | Result |
| --- | ---: |
| anonymous | 401 |
| ADMIN | 403 |
| AI_MODERATOR | 403 |
| SUPERADMIN | 201 |

### Health And Status

- `/health`: `status=ok`
- `/status`: `status=ok`
- DB: `healthy`
- `readiness.errors`: `[]`
- `readiness.warnings`: `[]`

### Validation Gates

- `npx.cmd prisma validate`: PASS
- `npx.cmd prisma generate`: PASS
- `npm.cmd run build`: PASS
- `npm.cmd test -- --runInBand`: PASS, 19 suites / 38 tests
- `npm.cmd run lint`: PASS, 413 warnings / 0 errors

### Runtime Manifest

Proof job manifest:

- `docs/proof/exec77a/runtime/openstaff-api-exec77a4r-live-proof.yaml`

No secret values are stored in the manifest or this proof document.

### Verdict

PASS

EXEC-77A.4R closes the live Gemini-backed RELU Builder success proof. EXEC-77B is now unblocked from the backend/live-AI proof standpoint, but remains a separate implementation pass.
