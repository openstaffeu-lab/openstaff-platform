# EXEC-78G.10BW - OpenStaff FIU-1 Project Write Evidence Boundary Controlled Implementation

Date: 2026-08-20

Verdict: `EXEC-78G.10BW PASS WITH RISKS`

Commit readiness: `FIU1_COMMIT_READY_WITH_RISKS`

Business acceptance: `BUSINESS_ACCEPTANCE_PASS_WITH_RISKS`

Security/privacy verdict: `PASS_WITH_RISKS`

## BV Implementation Gate Verification

BV precondition result: PASS.

Canonical BV document exists once:

`EXEC78G10BV_OPENSTAFF_FIU1_PROJECT_WRITE_EVIDENCE_BOUNDARY_IMPLEMENTATION_PLAN_CHANGESET_VALIDATION_ROLLBACK_AND_AUTHORIZATION_GATE.md`

Verified BV markers:

| Marker | Result |
|---|---|
| verdict | `EXEC-78G.10BV PASS WITH RISKS` |
| gate | `FIU1_IMPLEMENTATION_READY_WITH_RISKS` |
| included operations | `FIU1-PRJ-CREATE`, `FIU1-PRJ-UPDATE` |
| audit adapter | `OPTION_B` |
| API impact | `NO_EXTERNAL_API_CHANGE` |
| UI impact | `NO_UI_CHANGE` |
| schema impact | `NO_SCHEMA_CHANGE` |
| failure semantics | `BEST_EFFORT_WITH_ERROR_VISIBILITY` |
| acting entity | `ACTING_ENTITY_NOT_CANONICALLY_RESOLVED` |
| Response/Participation | `NO_RESPONSE_PARTICIPATION_COLLISION` |
| candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| canonical `EXEC78G10BN*.md` | none found |

## Baseline

Branch: `feature/work-in-progress`

Baseline HEAD: `c51ba284a881e6b15f26e2fc731020875b88d3ce`

Pre-existing worktree risk: the worktree was already dirty before BW validation, including modified allowlisted Project files, modified `STATUS.md`, modified `docs/proof/exec78/README.md`, modified frontend files, many untracked governance documents, and untracked FIU-1 adapter files. The FIU-1 files were inspected and preserved; only one surgical formatting correction was applied during BW validation in `projects.service.spec.ts`.

Existing modified frontend files were treated as `PRE_EXISTING_UNRELATED` and not edited by BW.

## Runtime Contract Revalidation

Runtime contract revalidation result: PASS.

Confirmed actual contracts:

- `AuditService.log` accepts `actorUserId`, `targetUserId`, `projectId`, `entityType`, `entityId`, `action`, `category`, `before`, `after`, `metadata`, and optional `request`.
- `AuditService.log` serializes evidence into `beforeJson`, `afterJson`, and `metadataJson`.
- `AuditService.extractRequestContext` captures `x-request-id`, request `requestId`, IP address, and user agent.
- `AuditModule` exports `AuditService`; `ProjectsModule` imports `AuditModule`.
- `ProjectAccessPolicy.assertCanWriteProject` remains owner/admin based.
- Project create/update response mapping remains through `ProjectResponseMapper.toProjectDetail`.
- Prisma `Project` contains required FIU-1 snapshot fields: `id`, `slug`, `createdById`, `status`, `visibility`, `engagementModel`, `publishedAt`, `archivedAt`.

No `BV_IMPLEMENTATION_ASSUMPTION_MISMATCH` was found.

## Files Changed By BW Scope

Implementation files:

- `apps/admin/api/src/projects/project-write-evidence.adapter.ts` - `FIU1_REQUIRED`
- `apps/admin/api/src/projects/projects.controller.ts` - `FIU1_REQUIRED`
- `apps/admin/api/src/projects/projects.service.ts` - `FIU1_REQUIRED`
- `apps/admin/api/src/projects/projects.module.ts` - `FIU1_REQUIRED_ALLOWLIST_EXTENSION`

Test files:

- `apps/admin/api/src/projects/project-write-evidence.adapter.spec.ts` - `FIU1_TEST_REQUIRED`
- `apps/admin/api/src/projects/projects.controller.spec.ts` - `FIU1_TEST_REQUIRED`
- `apps/admin/api/src/projects/projects.service.spec.ts` - `FIU1_TEST_REQUIRED`

Documentation files:

- `EXEC78G10BW_OPENSTAFF_FIU1_PROJECT_WRITE_EVIDENCE_BOUNDARY_CONTROLLED_IMPLEMENTATION_TEST_PROOF_REGRESSION_VALIDATION_DIFF_AUDIT_AND_COMMIT_READINESS_GATE.md` - `DOCUMENTATION_REQUIRED`
- `STATUS.md` - `DOCUMENTATION_REQUIRED`
- `docs/proof/exec78/README.md` - `DOCUMENTATION_REQUIRED`

Pre-existing unrelated files:

- `apps/admin/web/app/dashboard/page.tsx`
- `apps/admin/web/app/jobs/[id]/page.tsx`
- `apps/admin/web/app/jobs/page.tsx`
- `apps/admin/web/app/page.tsx`
- `apps/admin/web/app/projects/[id]/page.tsx`
- `apps/admin/web/app/projects/page.tsx`
- `apps/admin/web/components/JobCard.tsx`
- `apps/admin/web/components/JobsPageClient.tsx`
- untracked governance/proof/debug files outside BW scope

No unexpected BW-attributable file remains.

## Adapter Implementation

`ProjectWriteEvidenceAdapter` was implemented as a Project-specific minimal adapter using existing `AuditService`.

Public behavior:

- `toSnapshot(project)`
- `getChangedFields(before, after)`
- `recordProjectCreated(...)`
- `recordProjectUpdated(...)`

Audit actions:

- `PROJECT_CREATED`
- `PROJECT_UPDATED`

Evidence category:

- `PROJECT_WRITE_EVIDENCE`

Operation metadata:

- `FIU1-PRJ-CREATE`
- `FIU1-PRJ-UPDATE`

Failure behavior:

- adapter catches `AuditService.log` failures;
- logs server-visible error with action and Project ID;
- does not log full payloads;
- does not throw to the Project write caller.

## Snapshot Allowlist

Implemented snapshot fields:

- `id`
- `slug`
- `createdById`
- `status`
- `visibility`
- `engagementModel`
- `publishedAt`
- `archivedAt`

Changed fields are calculated only from these fields.

Explicitly excluded from evidence snapshots:

- summary, description, scope of work;
- addresses, postal code, latitude, longitude;
- condition content;
- document contents, storage bucket, storage key, URLs, file buffers;
- AI source text, extracted JSON, model output;
- secrets, tokens, session data;
- email/name or unnecessary personal data.

Evidence minimization result: `FIU-1 implemented evidence minimization proof PASS`.

## Create Integration

`FIU1-PRJ-CREATE` result: PASS.

`POST /projects` now passes request context from `ProjectsController.create` to `ProjectsService.create`. After successful existing Project creation, the service calls `recordProjectCreated` exactly once with:

- actor from authenticated `req.user`;
- persisted Project;
- Project ID target;
- `before = null`;
- safe after snapshot;
- operation metadata `FIU1-PRJ-CREATE`;
- request correlation where available.

API response remains `ProjectResponseMapper.toProjectDetail(project)`.

Nested create data is not copied into evidence.

## Update Integration

`FIU1-PRJ-UPDATE` result: PASS.

`PATCH /projects/:projectId` now passes request context from `ProjectsController.update` to `ProjectsService.update`. The service loads the existing Project, preserves `ProjectAccessPolicy.assertCanWriteProject`, executes the existing update, then calls `recordProjectUpdated` exactly once with:

- before Project from the authorized pre-state;
- after Project from the persisted update result;
- actor from authenticated `req.user`;
- operation metadata `FIU1-PRJ-UPDATE`;
- allowlisted before/after snapshots;
- allowlisted `changedFields`;
- request correlation where available.

Status, visibility, publishedAt, and archivedAt changes through PATCH naturally appear in snapshots and changed fields.

API response remains `ProjectResponseMapper.toProjectDetail(project)`.

## Permission Preservation

Permission preservation result: PASS.

No guards, decorators, permission constants, role lists, or `ProjectAccessPolicy` semantics were changed.

Evidence is emitted only after successful Project create/update business authorization. Rejected non-owner update was tested and does not emit FIU-1 evidence.

Preserved marker: `business permission != governance authority`.

## Acting-Entity Boundary

Acting-entity boundary result: PASS.

Implementation records authenticated User ID, role, Project owner ID, owner match, and admin actor flag as observational metadata only.

It does not create or label canonical acting entities, authority relationships, authority revisions, delegation, governance approvers, or governance authorization.

Preserved markers:

- `ACTING_ENTITY_NOT_CANONICALLY_RESOLVED`
- `ACCEPTABLE_FOR_NON_AUTHORIZING_FIU1`

## Correlation

Correlation implementation result: PASS.

Existing `AuditService.log` request plumbing is used. Request ID, IP address, and user agent are extracted by existing infrastructure when the request is supplied.

No second request-ID system was created.

Preserved marker: `IDEMPOTENCY_NOT_AVAILABLE_IN_FIU1`.

No deduplication was added.

## Dependency Injection

Dependency-injection result: PASS WITH ALLOWLIST EXTENSION.

`ProjectsModule` imports `AuditModule`, and `AuditService` is exported by that module. NestJS still requires the Project-specific adapter to be registered as a provider in `ProjectsModule` so `ProjectsService` can inject it.

`projects.module.ts` was therefore modified only to import and provide `ProjectWriteEvidenceAdapter`.

Classification: `FIU1_REQUIRED_ALLOWLIST_EXTENSION`.

No broader module changes were required.

## Test Matrix

Created/modified tests prove:

- adapter snapshots contain required allowlisted fields;
- prohibited fields are absent;
- changed fields are allowlist-derived;
- create evidence includes correct actor, project, action, metadata, and request;
- update evidence includes safe before/after and changed fields;
- audit failure does not throw;
- create service attempts exactly one `PROJECT_CREATED` record;
- update service attempts exactly one `PROJECT_UPDATED` record;
- nested sensitive create payload is not passed as evidence;
- rejected non-owner update remains rejected and emits no FIU-1 evidence;
- controller passes request context without changing response.

## Validation Ledger

| Command | Exit | Result |
|---|---:|---|
| `npm.cmd test -- --runInBand projects/project-write-evidence.adapter.spec.ts projects/projects.service.spec.ts projects/projects.controller.spec.ts` | 0 | PASS, 3 suites and 13 tests |
| `npm.cmd run build` | 0 | PASS |
| `npx.cmd eslint src/projects/project-write-evidence.adapter.ts src/projects/project-write-evidence.adapter.spec.ts src/projects/projects.service.ts src/projects/projects.service.spec.ts src/projects/projects.controller.ts src/projects/projects.controller.spec.ts src/projects/projects.module.ts` | 0 | PASS with 10 warnings |
| `npm.cmd run lint` | 0 | PASS with 421 warnings |
| `git diff --check` | 0 | PASS |

Initial full API lint found 4 Prettier errors in `projects.service.spec.ts`; BW fixed those within scope. Remaining warnings are `@typescript-eslint/no-unsafe-argument` warnings across the package and are not FIU-1 blockers.

Targeted validation classification: `FIU1_TARGETED_VALIDATION_PASS`.

## Regression Boundary

Regression boundary result: PASS WITH RISKS.

No DTO fields, route paths, guards, permission decorators, Prisma schema, migrations, frontend code, or response mapper behavior were changed by BW.

Preserved:

- POST `/projects` request contract;
- POST `/projects` response contract;
- PATCH `/projects/:projectId` request contract;
- PATCH `/projects/:projectId` response contract;
- Project status semantics;
- Project visibility semantics;
- ownership semantics;
- permission semantics;
- frontend requirements.

Risk: the worktree already contains unrelated frontend modifications. They are separable from BW and were not edited as part of FIU-1.

## Evidence Content Inspection

Representative mocked `PROJECT_CREATED` evidence contains:

- `actorUserId`;
- `targetUserId`;
- `projectId`;
- `entityType = PROJECT`;
- `entityId = projectId`;
- `action = PROJECT_CREATED`;
- `category = PROJECT_WRITE_EVIDENCE`;
- `before = null`;
- safe after snapshot;
- operation metadata;
- access/permission observation metadata;
- request object for existing correlation extraction.

Representative mocked `PROJECT_UPDATED` evidence contains:

- `actorUserId`;
- `targetUserId`;
- `projectId`;
- `entityType = PROJECT`;
- `entityId = projectId`;
- `action = PROJECT_UPDATED`;
- safe before snapshot;
- safe after snapshot;
- allowlisted `changedFields`;
- access/permission observation metadata;
- request object for existing correlation extraction.

Verified absent from snapshots and changed fields:

- description;
- scopeOfWork;
- address;
- coordinates;
- document content;
- extracted text;
- storage keys;
- AI payload;
- tokens;
- email;
- unnecessary personal data.

## Collision Audits

Response/Participation collision result: `NO_RESPONSE_PARTICIPATION_COLLISION`.

No BW code creates Response, creates Participation, imports Response or Participation domains, renames Proposal as Response, renames Invitation as Response, treats Project membership as Participation, or treats Contract as Participation.

Legacy collision result: `NO_LEGACY_COUPLING_FOR_INCLUDED_FIU1_OPERATIONS`.

BW introduced no dependency on Actor, Job, Application, Firebase actor context, or PlatformRolesGuard. Existing Project job-request and response-mapper names predate BW and are not FIU-1 coupling changes.

## Schema/API/UI Audit

| Boundary | Result |
|---|---|
| `SCHEMA_CHANGE` | `NONE` |
| `MIGRATION_CHANGE` | `NONE` |
| `EXTERNAL_API_CHANGE` | `NONE` |
| `UI_CHANGE` | `NONE_BY_BW` |
| `FRONTEND_CHANGE` | `NONE_BY_BW` |

Pre-existing frontend diffs remain in the worktree and are not attributable to BW.

## Security And Privacy Audit

Security/privacy verdict: `PASS_WITH_RISKS`.

Passed checks:

- no full DTO logging;
- no full Prisma Project logging;
- no document content logging;
- no AI payload logging;
- no secrets/tokens;
- no address/coordinates;
- no email/name leakage;
- structured JSON only;
- changedFields based on allowlist;
- no cross-project snapshot;
- audit failure logging avoids prohibited payload.

Risk retained: best-effort audit means evidence loss is possible if AuditLog write fails. This matches BV.

## Observability

Observability result: PASS.

Audit entries are associated with:

- Project ID via `projectId`;
- actor User ID via `actorUserId`;
- action via `PROJECT_CREATED` or `PROJECT_UPDATED`;
- request ID when supplied through existing `AuditService` correlation;
- timestamp via `AuditLog.createdAt`.

Existing `AuditService.listProjectAuditLogs(projectId, user)` filters by `projectId`, so Project timelines can retrieve these entries if the current UI/API path uses that audit listing.

No UI changes were made.

## Rollback

Rollback verification result: `ROLLBACK = SIMPLE`.

Rollback requires only reverting/removing FIU-1 adapter, service/controller wiring, module provider registration, tests, and documentation.

No database migration rollback, frontend rollback, Project data transformation, or destructive cleanup of existing AuditLog records is required.

## Commit Readiness Gate

Commit readiness: `FIU1_COMMIT_READY_WITH_RISKS`.

Reasons:

- implementation matches BV scope;
- targeted tests pass;
- API build passes;
- API lint exits 0;
- `git diff --check` passes;
- schema/API/UI remain unchanged by BW;
- evidence minimization is tested;
- best-effort failure behavior is tested;
- no Response/Participation collision;
- no legacy coupling introduced;
- unrelated worktree changes remain separable.

Risks:

- worktree is already dirty with substantial unrelated documentation and frontend changes;
- `projects.module.ts` required a minimal allowlist extension for DI;
- API lint retains pre-existing warnings.

This gate does not authorize staging or commit.

## Business Acceptance

Business acceptance: `BUSINESS_ACCEPTANCE_PASS_WITH_RISKS`.

Preserved:

- Project create behavior;
- Project update behavior;
- ownership semantics;
- permission semantics;
- external API compatibility;
- user workflow;
- frontend behavior.

Added:

- authenticated User attribution;
- Project attribution;
- safe allowlisted before/after evidence;
- changed-field traceability;
- request correlation where available;
- support/debug traceability through existing AuditLog.

## Explicit Non-Occurrences

| Item | Occurred |
|---|---|
| backend FIU-1 implementation | YES |
| Project behavior change outside additive evidence | NO |
| schema change | NO |
| migration | NO |
| external API change | NO |
| frontend/UI change by BW | NO |
| permission change | NO |
| Response implementation | NO |
| Participation implementation | NO |
| acting-entity implementation | NO |
| governance authority implementation | NO |
| BN implementation | NO |
| B4 authorization | NO |
| G.11 implementation | NO |
| staging | NO |
| commit | NO |
| push | NO |
| deployment | NO |

Final verdict: `EXEC-78G.10BW PASS WITH RISKS`.
