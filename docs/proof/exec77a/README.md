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
