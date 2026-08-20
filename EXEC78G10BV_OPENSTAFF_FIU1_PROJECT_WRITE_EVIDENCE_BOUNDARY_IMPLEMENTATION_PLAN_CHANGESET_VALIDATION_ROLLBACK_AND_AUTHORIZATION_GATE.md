# EXEC-78G.10BV OpenStaff FIU-1 Project Write Evidence Boundary Implementation Plan, Change-Set, Validation, Rollback & Authorization Gate

Date: 2026-08-20

Verdict: `PASS WITH RISKS`

Candidate: `Governance Evidence Foundation v1`

Authorization: `DOCUMENTATION / IMPLEMENTATION PLANNING ONLY`

Latest prior phase: `EXEC-78G.10BU PASS WITH RISKS`

Candidate readiness: `NOT_READY`

B4 authorization: `BLOCKED - NOT AUTHORIZED`

G.11 authorization: `BLOCKED - NOT AUTHORIZED`

BN provenance: `NEVER_MATERIALIZED`

FIU: `FIU-1 PROJECT WRITE EVIDENCE BOUNDARY`

Implementation authorization gate: `FIU1_IMPLEMENTATION_READY_WITH_RISKS`

Status: OpenStaff Project-domain implementation planning, exact Project write inventory, FIU-1 scope freeze, audit adapter decision, evidence payload contract, data-minimization contract, permission boundary, transaction/failure semantics, API/UI/schema impact assessment, exact implementation file allowlist, validation plan, security/privacy review, observability plan, rollback boundary, legacy boundary verification, Response/Participation non-collision, acting-entity limitation, implementation dependency graph, governance baseline commit sequencing, implementation authorization gate, and business success criteria only. No application code, frontend code, backend code, Prisma/schema, migration, API behavior, permission behavior, runtime behavior, Project behavior, AuditLog behavior, evidence collection, protected write activation, Response implementation, Participation implementation, acting-entity implementation, authority engine, blocker closure, readiness transition, B4 authorization, G.11 implementation, staging, commit, push, or deployment was created or changed.

## Precondition - BU Finalization Verification

BU precondition result: `PASS`.

Verification results:

| Check | Result |
|---|---|
| exactly one canonical BU specification exists | PASS - `EXEC78G10BU_OPENSTAFF_BUSINESS_DOMAIN_GOVERNANCE_BINDING_CAPABILITY_MAPPING_OPERATIONAL_BOUNDARY_AND_IMPLEMENTATION_HANDOFF_READINESS_SPECIFICATION.md` |
| BU contains WP G10BU-A through WP G10BU-T | PASS |
| exact BU verdict | `EXEC-78G.10BU PASS WITH RISKS` |
| BU implementation-planning readiness | `IMPLEMENTATION_PLANNING_READY_WITH_RISKS` |
| BU scope-control decision | `GOVERNANCE_FOUNDATION_SUFFICIENT_FOR_IMPLEMENTATION_PLANNING` |
| BU first implementation unit | `FIU-1 PROJECT WRITE EVIDENCE BOUNDARY` |
| BU controlled commit readiness | `READY_WITH_RISKS` |
| STATUS BU phase entry | exactly one BU phase block found before BV creation |
| README BU phase entry | exactly one BU phase block found before BV creation |
| ordering before BV | BU, BT, BS, BR, BQ |
| candidate state | `NOT_READY` |
| B4 state | `BLOCKED - NOT AUTHORIZED` |
| G.11 state | `BLOCKED - NOT AUTHORIZED` |
| BN state | `NEVER_MATERIALIZED` |
| canonical `EXEC78G10BN*.md` | NONE |

Documentation-safe finalization checks used targeted `rg`, duplicate phase checks, ordering checks, required BU anchor checks, `git status`, branch/HEAD inspection, source reading, Prisma schema reading, test inventory reading, and `git diff --check`.

## WP G10BV-A FIU-1 Exact Repository Discovery

Repository surface inventory:

| Surface | Evidence | FIU-1 relevance |
|---|---|---|
| Project controller | `apps/admin/api/src/projects/projects.controller.ts` | core `GET /projects`, `GET /projects/:projectId`, `POST /projects`, `PATCH /projects/:projectId` |
| Project service | `apps/admin/api/src/projects/projects.service.ts` | `create`, `update`, slug generation, create/update input builders, project detail/list includes |
| Project access policy | `apps/admin/api/src/projects/project-access.policy.ts` | admin and owner read/write checks; list scoping |
| Project mapper | `apps/admin/api/src/projects/project-response.mapper.ts` | response shape, no evidence behavior |
| Project module | `apps/admin/api/src/projects/projects.module.ts` | imports `AuditModule`, `NotificationModule`, `MessagingModule`, `ComplianceModule`; provides Project services |
| Project DTOs | `create-project.dto.ts`, `update-project.dto.ts` | request contract for create/update; status, visibility, publishedAt, archivedAt in update DTO |
| Project schema | `apps/admin/api/prisma/schema.prisma` | `Project`, child models, `ProjectStatus`, `ProjectVisibility`, `AuditLog` |
| Conditions | `project-conditions.controller.ts`, `project-conditions.service.ts` | child writes create/update/delete; deferred from FIU-1 |
| Job requests | `project-job-requests.controller.ts`, `project-job-requests.service.ts` | child writes create/update/delete; deferred from FIU-1 |
| Documents | `project-documents.controller.ts`, `project-documents.service.ts` | child writes create/upload/extract/delete and local file IO; deferred from FIU-1 |
| AI interpretation | `project-ai-interpretations.controller.ts`, `project-ai-interpretations.service.ts` | project-adjacent AI write/apply with existing audit; deferred |
| Shortlist/invitation/proposal/contract/dispute/payment/workforce/timesheet | project child controllers/services | higher-order workflows with audit/notification side effects; excluded or deferred |
| Audit service | `apps/admin/api/src/audit/audit.service.ts` | reusable `AuditLog` writer, project timeline reader, request context extraction |
| Frontend create/edit | `apps/admin/web/app/projects/new/page.tsx`, `apps/admin/web/app/projects/[id]/edit/page.tsx`, `components/projects/ProjectWorkspaceForm.tsx` | callers for core create/update and child saves |
| Frontend detail | `apps/admin/web/app/projects/[id]/page.tsx` | calls audit timeline and many deferred child workflows |

Produce: FIU-1 repository surface inventory: `COMPLETE_WITH_RISKS`.

## WP G10BV-B Canonical Project Write Inventory

| Operation ID | Route | Controller/service | DTO | Models | Guards/permissions | Access policy | State availability | Existing audit/notification | Transaction | Frontend caller | Classification | Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PRJ-WRITE-001 | `POST /projects` | `ProjectsController.create` -> `ProjectsService.create` | `CreateProjectDto` | `Project`, optional nested conditions/documents/jobRequests/AI/classifications | `JwtGuard`, `PermissionsGuard` with `Permission.WRITE`, `RolesGuard(ADMIN, EMPLOYER, CONTRACTOR, GENERAL_CONTRACTOR)` | ensure creator `User` exists; no owner policy needed before create | previous state N/A; resulting state returned with detail include | none in core service | single Prisma `project.create`, nested create, no explicit transaction | `ProjectWorkspaceForm` create submit | `FIU1_INCLUDE` for core project snapshot only | create may include nested child data and sensitive text |
| PRJ-WRITE-002 | `PATCH /projects/:projectId` | `ProjectsController.update` -> `ProjectsService.update` | `UpdateProjectDto` | `Project`, project classifications | same as PRJ-WRITE-001 | `assertCanWriteProject(user, existingProject.createdById)` owner/admin | previous project row available; resulting project returned | none in core service | single Prisma `project.update`, classification delete/create nested writes | `ProjectWorkspaceForm` edit submit | `FIU1_INCLUDE` | status/visibility/published/archive changes are embedded in generic update |
| PRJ-WRITE-003 | status/visibility/publish/archive transition through `PATCH /projects/:projectId` | same as PRJ-WRITE-002 | `UpdateProjectDto` fields `status`, `visibility`, `publishedAt`, `archivedAt` | `Project` | same as PRJ-WRITE-002 | same as PRJ-WRITE-002 | before/after available | none | same update | `ProjectWorkspaceForm` edit submit | `FIU1_INCLUDE_AS_PART_OF_PRJ-WRITE-002` | no dedicated transition endpoint or reason field |
| PRJ-WRITE-004 | `POST /projects/:projectId/job-requests` | `ProjectJobRequestsController.create` -> service `create` | `CreateProjectJobRequestDto` | `ProjectJobRequest`, classifications | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | previous N/A; after returned | none | single create | `ProjectWorkspaceForm` child save | `FIU1_DEFER` | child domain; permissions differ from core |
| PRJ-WRITE-005 | `PATCH /projects/:projectId/job-requests/:jobRequestId` | service `update` | `UpdateProjectJobRequestDto` | `ProjectJobRequest`, classifications | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | before row available; after returned | none | single update | `ProjectWorkspaceForm` child save | `FIU1_DEFER` | child lifecycle and budget fields |
| PRJ-WRITE-006 | `DELETE /projects/:projectId/job-requests/:jobRequestId` | service `remove` | route params | `ProjectJobRequest` | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | before row available; after deletion only success | none | delete | `ProjectWorkspaceForm` delete | `FIU1_DEFER` | destructive child delete |
| PRJ-WRITE-007 | `POST /projects/:projectId/conditions` | `ProjectConditionsService.create` | `CreateProjectConditionDto` | `ProjectCondition` | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | previous N/A; after returned | none | create | `ProjectWorkspaceForm` child save | `FIU1_DEFER` | condition content may be contractual |
| PRJ-WRITE-008 | `PATCH /projects/:projectId/conditions/:conditionId` | service `update` | `UpdateProjectConditionDto` | `ProjectCondition` | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | before row available; after returned | none | update | `ProjectWorkspaceForm` child save | `FIU1_DEFER` | condition content may be contractual |
| PRJ-WRITE-009 | `DELETE /projects/:projectId/conditions/:conditionId` | service `remove` | route params | `ProjectCondition` | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | before row available; after deletion only success | none | delete | `ProjectWorkspaceForm` delete | `FIU1_DEFER` | destructive child delete |
| PRJ-WRITE-010 | `POST /projects/:projectId/documents` | `ProjectDocumentsService.create` | `CreateProjectDocumentDto` | `ProjectDocument` | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | previous N/A; after metadata returned | none | create | not primary form path | `FIU1_DEFER` | document metadata and storage keys |
| PRJ-WRITE-011 | `POST /projects/:projectId/documents/upload` | service `upload` | `UploadProjectDocumentDto` + file | `ProjectDocument`, local filesystem | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | previous N/A; after metadata returned | none | file write then DB create | `ProjectWorkspaceForm` upload | `FIU1_DEFER` | file content/storage privacy |
| PRJ-WRITE-012 | `POST /projects/:projectId/documents/:documentId/extract` | service `extract` | route params | `ProjectDocument` | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | before document available; after extraction status/text | none | multiple DB updates plus file read | detail page and form | `FIU1_DEFER` | extracted text prohibited for FIU-1 evidence |
| PRJ-WRITE-013 | `DELETE /projects/:projectId/documents/:documentId` | service `remove` | route params | `ProjectDocument`, local filesystem | `JwtGuard`, `RolesGuard`; no `PermissionsGuard` | `assertCanWriteProject` | before metadata available; after delete success | none | DB delete then file rm | `ProjectWorkspaceForm` delete | `FIU1_DEFER` | destructive DB/filesystem operation |
| PRJ-WRITE-014 | `PUT /projects/:projectId/ai-interpretation` and `POST /projects/:projectId/ai-interpretation/apply` | AI interpretation controller/service | AI DTOs | `ProjectAIInterpretation`, `Project`, child objects | `JwtGuard`, `RolesGuard` | `assertCanWriteProject` | before/after available in service | existing audit calls | includes transaction for apply | form/detail AI panels | `FIU1_DEFER` | AI payload and suggested business mutation |
| PRJ-WRITE-015+ | shortlist, invitations, proposals, contracts, escrow, invoices, payments, disputes, execution, timesheets, worker assignments | child workflow services | workflow DTOs | child workflow models | mixed `JwtGuard`, `RolesGuard`; many no core `PermissionsGuard` | owner/admin and profile/worker-specific checks | mixed | many existing audit/notification calls | mixed, some transactions | detail panels | `FIU1_EXCLUDE` | higher-order consent, finance, dispute, workforce, Participation-adjacent risk |

Produce: canonical Project write inventory: `COMPLETE_WITH_RISKS`.

## WP G10BV-C FIU-1 Scope Freeze

Included operations:

| FIU operation | Code path | Scope |
|---|---|---|
| `FIU1-PRJ-CREATE` | `apps/admin/api/src/projects/projects.controller.ts` `create` -> `apps/admin/api/src/projects/projects.service.ts` `create` | observe successful core Project creation with allowlisted project-state snapshot |
| `FIU1-PRJ-UPDATE` | `apps/admin/api/src/projects/projects.controller.ts` `update` -> `apps/admin/api/src/projects/projects.service.ts` `update` | observe successful core Project update, including status, visibility, publishedAt, archivedAt when present |

Excluded/deferred operations:

| Operation family | Result |
|---|---|
| Project job request create/update/delete | `FIU1_DEFER` |
| Project condition create/update/delete | `FIU1_DEFER` |
| Project document create/upload/extract/delete | `FIU1_DEFER` |
| Project AI interpretation create/apply/history | `FIU1_DEFER` |
| shortlist, invitations, proposals | `FIU1_EXCLUDE` |
| contracts, escrow, invoices, payments, disputes, milestones | `FIU1_EXCLUDE` |
| attendance, work logs, worker assignments, timesheets, payroll calculation | `FIU1_EXCLUDE` |
| Response and Participation runtime | `FIU1_EXCLUDE` |

Explicit non-goals: no Response implementation, no Participation implementation, no authority engine, no delegation engine, no governance registers, no compliance determination, no finding/remediation execution, no BN/enforcement implementation, no payment/workforce changes, no Project workflow change, no UI badge/readiness/governance terminology.

Produce: FIU-1 frozen implementation scope: `PASS_WITH_RISKS`.

## WP G10BV-D Business Purpose & User Value

FIU-1 gives OpenStaff a dependable trace for meaningful Project creation and Project state changes. In business terms, it lets support, moderation, security, and future dispute reconstruction answer: who changed a Project, which Project was changed, what allowlisted state changed, when it happened, and which request correlated to the change.

The value is business integrity and traceability for the real Project workflow. It is not primarily compliance infrastructure and it does not assert governance authority.

Produce: FIU-1 OpenStaff business-value statement: `PASS`.

## WP G10BV-E Evidence Record Contract

Minimal payload contract for FIU-1:

| Field | Source | Requirement |
|---|---|---|
| action | fixed action ID: `PROJECT_CREATED`, `PROJECT_UPDATED` | REQUIRED |
| actorUserId | `req.user.sub` | REQUIRED |
| actorRole | `req.user.role` in metadata | REQUIRED |
| projectId | persisted Project ID | REQUIRED |
| entityType/entityId | `PROJECT` / Project ID | REQUIRED |
| operation | `FIU1-PRJ-CREATE` or `FIU1-PRJ-UPDATE` | REQUIRED |
| before | `null` for create; allowlisted pre-state for update | REQUIRED |
| after | allowlisted resulting state | REQUIRED |
| changedFields | derived allowlisted field names and before/after scalars | REQUIRED for update, empty for create |
| permissionReference | guard/policy summary such as `JWT+WRITE+ROLE+OWNER_OR_ADMIN_OBSERVED` | REQUIRED |
| accessPolicyContext | owner/admin result, owner user ID, actor user ID | REQUIRED |
| requestId/ipAddress/userAgent | `AuditService.extractRequestContext` via request | REQUIRED where request supplies it |
| source | `projects.controller` / API route | REQUIRED |
| timestamp | `AuditLog.createdAt` | PROVIDED_BY_AUDITLOG |
| reason | only if future Project workflow already supplies one | NOT_AVAILABLE_IN_FIU1 |
| canonical acting entity | runtime absent | `NOT_AVAILABLE_IN_FIU1` |
| authority relationship ID/revision | runtime absent | `NOT_AVAILABLE_IN_FIU1` |
| governance approval/B4/G.11 authorization | not runtime and not authorized | `NOT_AVAILABLE_IN_FIU1` |

Produce: FIU-1 evidence payload contract: `PASS_WITH_RISKS`.

## WP G10BV-F Audit Adapter Decision

Decision: `Option B - existing AuditLog plus structured metadata/payload conventions`.

Rationale: `AuditLog` already supports `actorUserId`, `targetUserId`, `projectId`, `entityType`, `entityId`, `action`, `category`, `beforeJson`, `afterJson`, `metadataJson`, `ipAddress`, `userAgent`, `requestId`, and `createdAt`. FIU-1 can satisfy actor attribution, Project target attribution, operation, allowlisted before/after state, timestamp, and request correlation without schema change.

Constraints:

- no Governance Evidence Foundation register is created
- no Prisma migration is required
- deterministic serialization should use small allowlisted objects with stable keys
- FIU-1 should add a Project audit adapter/helper rather than dumping full Project records

Produce: FIU-1 audit adapter decision: `OPTION_B_PASS_WITH_RISKS`.

## WP G10BV-G Data Minimization & Snapshot Boundary

| Field family | Classification | Rule |
|---|---|---|
| Project ID, slug, createdById | `EVIDENCE_REQUIRED` | record scalar identifiers |
| status, visibility, engagementModel | `EVIDENCE_REQUIRED` | record before/after |
| publishedAt, archivedAt | `EVIDENCE_REQUIRED` | record before/after |
| name/title | `EVIDENCE_OPTIONAL` | record if needed for support context, max normalized scalar |
| countryId, regionId, cityId, primaryLanguageId | `EVIDENCE_OPTIONAL` | IDs only, no expanded location objects |
| classification ID lists | `EVIDENCE_OPTIONAL` | IDs only; no taxonomy descriptions |
| budgetMinCents, budgetMaxCents, currencyCode | `EVIDENCE_OPTIONAL` | include only changed summary if selected by implementation |
| summary, description, scopeOfWork | `EVIDENCE_PROHIBITED` | potentially sensitive project content |
| addressLine1, addressLine2, postalCode, latitude, longitude | `EVIDENCE_PROHIBITED` by default | location/privacy risk; use IDs or changed-field names only |
| conditions content | `EVIDENCE_PROHIBITED` for FIU-1 | child contractual text deferred |
| document contents/extracted text/file buffers | `EVIDENCE_PROHIBITED` | never copy into FIU-1 evidence |
| document storageBucket/storageKey/file URLs/checksums | `EVIDENCE_PROHIBITED` for FIU-1 | storage/security risk |
| AI sourceText/extractedJson/model outputs | `EVIDENCE_PROHIBITED` for FIU-1 | AI payload deferred |
| secrets/tokens/session data | `EVIDENCE_PROHIBITED` | never record |
| personal data beyond actorUserId/target owner ID/role | `EVIDENCE_PROHIBITED` | avoid email/name in payload; relations may be available in audit list response |

Produce: FIU-1 evidence minimization contract: `PASS`.

## WP G10BV-H Permission Boundary

| FIU operation | Current business authorization | FIU-1 rule |
|---|---|---|
| `FIU1-PRJ-CREATE` | `JwtGuard`, `PermissionsGuard` requiring `Permission.WRITE`, `RolesGuard(ADMIN, EMPLOYER, CONTRACTOR, GENERAL_CONTRACTOR)`, `ensureUserExists(user.sub)` | evidence observes successful permission outcome only |
| `FIU1-PRJ-UPDATE` | same guards plus `ProjectAccessPolicy.assertCanWriteProject`, allowing admin/superadmin or project owner | evidence observes successful guard and owner/admin policy outcome only |

FIU-1 MUST NOT replace permission checks, bypass guards, grant access, create governance authority, convert owner into governance approver, or treat role/permission as governance authority.

Preserved rule: `business permission != governance authority`.

Produce: FIU-1 permission/evidence boundary: `PASS`.

## WP G10BV-I Write Ordering & Failure Semantics

Recommended ordering:

1. existing guards and permission checks pass
2. service validates/loads pre-state where applicable
3. service performs business write
4. service captures resulting allowlisted state from persisted Project
5. service records audit evidence through the adapter

Semantics: `BEST_EFFORT_WITH_ERROR_VISIBILITY`.

Rationale: current Project core writes do not use audit transactions, and several existing Project child workflows already perform business writes before `auditService.log`. FIU-1 should not unexpectedly fail Project creation/update because additive evidence logging fails unless a later implementation prompt deliberately chooses stricter behavior. Audit failures should be logged to application error telemetry and should be covered by tests. A later outbox/transactional audit design may be considered after the first boundary proves stable.

Produce: FIU-1 failure and transaction semantics: `PASS_WITH_RISKS`.

## WP G10BV-J Idempotency & Correlation

Current support:

- `AuditService.extractRequestContext` reads `request.requestId` or `x-request-id`
- `AuditLog` has `requestId` and index `[requestId, createdAt]`
- no true Project write idempotency key exists
- duplicate POST/PATCH retries can create or update again according to current API semantics

Minimum FIU-1 correlation contract:

- pass `request` from controller to service or adapter for FIU-1 operations
- record `requestId`, `ipAddress`, and `userAgent` when available
- record operation ID and Project ID
- document duplicate/retry limitation as `IDEMPOTENCY_NOT_AVAILABLE_IN_FIU1`

Produce: FIU-1 correlation and idempotency plan: `PASS_WITH_RISKS`.

## WP G10BV-K API Impact Assessment

API impact: `NO_EXTERNAL_API_CHANGE`.

FIU-1 evidence capture is internal. No endpoint, request field, response field, status code, or frontend contract should change. The only implementation signature change may be internal controller/service plumbing to pass request context, which must not alter external behavior.

Produce: FIU-1 API impact assessment: `NO_EXTERNAL_API_CHANGE`.

## WP G10BV-L UI Impact Assessment

UI impact: `NO_UI_CHANGE`.

No governance badges, readiness status, B4 status, evidence IDs, or governance terminology should be exposed to users in FIU-1. Existing audit timeline display may naturally show new audit records because it already reads `GET /projects/:projectId/audit-logs`; no UI implementation is required for FIU-1.

Produce: FIU-1 UI impact assessment: `NO_UI_CHANGE`.

## WP G10BV-M Schema & Migration Impact

Schema impact: `NO_SCHEMA_CHANGE`.

No Prisma model, migration, database table, enum, or column is required for FIU-1 because `AuditLog` already has the needed generic fields. If a later phase requires stronger idempotency or typed evidence, it must be separately authorized.

Produce: FIU-1 schema impact assessment: `NO_SCHEMA_CHANGE`.

## WP G10BV-N Exact Proposed File Change Set

Backend files to modify:

- `apps/admin/api/src/projects/projects.controller.ts`
- `apps/admin/api/src/projects/projects.service.ts`

Backend files to create:

- `apps/admin/api/src/projects/project-write-evidence.adapter.ts`

Tests to modify/create:

- `apps/admin/api/src/projects/projects.service.spec.ts`
- `apps/admin/api/src/projects/projects.controller.spec.ts`
- `apps/admin/api/src/projects/project-write-evidence.adapter.spec.ts`

Schema files:

- NONE

Frontend files:

- NONE

Documentation files for implementation note only if a later prompt asks:

- NONE required for code implementation

Anything not on this allowlist is out of scope for FIU-1 implementation.

Produce: FIU-1 implementation file allowlist: `FROZEN_WITH_RISKS`.

## WP G10BV-O Test & Validation Plan

| Test family | Required future proof |
|---|---|
| Permission | unauthenticated or missing `Permission.WRITE` cannot create/update and no FIU-1 evidence is written |
| Role | unsupported role cannot create/update and no FIU-1 evidence is written |
| Ownership | non-owner non-admin update remains forbidden and no FIU-1 evidence is written |
| Create evidence | successful `POST /projects` writes exactly one `PROJECT_CREATED` audit record |
| Update evidence | successful `PATCH /projects/:projectId` writes exactly one `PROJECT_UPDATED` audit record |
| Attribution | audit record uses authenticated `actorUserId`, actor role metadata, Project ID, and owner/admin context |
| Before/after | create has null before and allowlisted after; update has allowlisted before/after and changedFields |
| Status/visibility | publish/status/visibility/archive fields are captured through `PATCH` when changed |
| Failure semantics | simulated `auditService.log` failure preserves business write and emits error visibility according to implementation design |
| Data minimization | prohibited fields such as description, scopeOfWork, address, document storage keys, extracted text, and AI payload are absent |
| Regression | create/update API response shape and Project persistence behavior remain unchanged |
| Correlation | `x-request-id` is recorded when supplied |
| Duplicate/retry | duplicate behavior remains current API behavior; evidence records correlate but are not deduplicated |

Produce: FIU-1 test matrix: `PASS_WITH_RISKS`.

## WP G10BV-P Security & Privacy Review

| Risk | Assessment | FIU-1 control |
|---|---|---|
| sensitive Project descriptions/scope | high | prohibited from evidence payload |
| document metadata/storage paths/extracted text | high | deferred and prohibited |
| personal data leakage | medium | record IDs/role only; avoid email/name in payload |
| commercial data | medium | optional changed scalar only; prefer omit in first implementation |
| location/address data | medium/high | prohibited except region/city IDs if needed |
| log injection | medium | structured JSON serialization and scalar normalization |
| excessive payload | medium | allowlisted compact snapshots |
| role/authorization context leakage | low/medium | metadata is internal audit only; no API/UI exposure |
| cross-project leakage | medium | Project ID and `assertCanWriteProject` before audit; no nested object dump |

Produce: FIU-1 security/privacy risk matrix: `PASS_WITH_RISKS`.

## WP G10BV-Q Observability & Operational Support

Observability plan:

- successful evidence records appear in existing `AuditLog` and are queryable by `projectId`
- existing `GET /projects/:projectId/audit-logs` can show Project audit entries for owner/admin users
- admin audit search can filter by `entityType: PROJECT` or action
- request correlation uses `requestId`, `ipAddress`, and `userAgent`
- audit failures should use existing endpoint error logging/application logging and should not expose governance terms to users
- no production dashboard is created in BV or required for FIU-1

Produce: FIU-1 observability plan: `PASS_WITH_RISKS`.

## WP G10BV-R Rollback Boundary

Rollback classification: `SIMPLE`.

Rollback unit:

- remove `ProjectWriteEvidenceAdapter` injection and calls from `ProjectsService`
- remove internal request-context plumbing from `ProjectsController` if added
- remove adapter tests
- leave `AuditLog` table and any historical records intact

No schema migration rollback, no UI rollback, and no destructive data migration should be required.

Produce: FIU-1 rollback plan: `SIMPLE`.

## WP G10BV-S Legacy Boundary Verification

FIU-1 core Project create/update uses `User`, `JwtGuard`, `PermissionsGuard`, `RolesGuard`, and `ProjectAccessPolicy`. It does not require `Actor`, `Job`, `Application`, legacy Firebase actor context, or `PlatformRolesGuard`.

Legacy coupling result: `NO_LEGACY_COUPLING_FOR_INCLUDED_FIU1_OPERATIONS`.

Produce: FIU-1 legacy coupling assessment: `PASS`.

## WP G10BV-T Response/Participation Boundary Verification

FIU-1 does not create Response, does not create Participation, does not rename `ProjectInvitation` as Response, does not rename `ProjectProposal` as Response, does not rename project membership as Participation, does not treat Contract as Participation, and does not silently implement G8/G9/G10 runtime domains.

Response/Participation non-collision result: `NO_RESPONSE_PARTICIPATION_COLLISION`.

Produce: FIU-1 Response/Participation non-collision assessment: `PASS`.

## WP G10BV-U Acting-Entity Limitation

Marker: `ACTING_ENTITY_NOT_CANONICALLY_RESOLVED`.

FIU-1 may use authenticated User ID, current business role, and Project owner/admin access-policy outcome as non-authorizing attribution. It must not represent those as canonical acting entity, authority relationship, delegation proof, or governance approval.

Outcome: `ACCEPTABLE_FOR_NON_AUTHORIZING_FIU1`.

Produce: FIU-1 acting-entity limitation assessment: `PASS_WITH_RISKS`.

## WP G10BV-V FIU-1 Implementation Dependency Graph

| Step | Dependency | Parallelizable | Rollback point |
|---|---|---|---|
| R1 freeze included operations | BV scope | no | documentation gate |
| R2 define allowlisted snapshot and changed-field helper | R1 | yes with tests | remove helper |
| R3 implement `ProjectWriteEvidenceAdapter` using `AuditService.log` | R2 | yes with service wiring | remove adapter |
| R4 pass request context from controller to service/adapter | R3 | no | revert signature plumbing |
| R5 integrate `FIU1-PRJ-CREATE` | R3/R4 | no | remove create call |
| R6 integrate `FIU1-PRJ-UPDATE` | R3/R4 | after or alongside R5 | remove update call |
| R7 add unit tests for adapter/service/controller | R2-R6 | partially | remove tests |
| R8 run authorized validation | implementation prompt only | no | revert implementation files |
| R9 review exact diff against allowlist | R8 | no | stop before commit |
| R10 controlled commit/deploy consideration | separate authorization only | no | not part of FIU-1 implementation prompt by default |

Produce: FIU-1 implementation dependency graph: `PASS`.

## WP G10BV-W Governance Documentation Commit Decision

Decision: `COMMIT_GOVERNANCE_BASELINE_WITH_FIU1_PLAN`.

Rationale: BU was already `READY_WITH_RISKS`, and BV is the missing implementation-plan/change-set freeze that should travel with the governance baseline before code implementation. Because unrelated worktree changes exist, any future commit must use path-specific staging for governance docs/index files only.

This prompt does not authorize staging or commit.

Produce: governance baseline commit sequencing decision: `COMMIT_GOVERNANCE_BASELINE_WITH_FIU1_PLAN`.

## WP G10BV-X Implementation Authorization Gate

Gate result: `FIU1_IMPLEMENTATION_READY_WITH_RISKS`.

Meaning: FIU-1 is sufficiently specified to receive a separate explicit code implementation prompt. This gate does not authorize code modification in BV, does not authorize G.11, and does not authorize B4.

Risks:

- current core Project create can include nested child objects, but FIU-1 evidence must summarize only the core Project snapshot
- Project child writes have different guard/permission shape and are deferred
- no true idempotency exists
- acting entity is not canonically resolved
- audit failure semantics remain best effort

## WP G10BV-Y Business Success Criteria

Future FIU-1 implementation succeeds if it preserves Project create/update behavior, Project ownership semantics, existing permissions, API compatibility, user workflow, and frontend behavior, while adding deterministic authenticated account attribution, target Project attribution, safe allowlisted before/after evidence, request correlation, and support/debug traceability.

It does not succeed by increasing governance document count or by claiming readiness, authority, Response, Participation, or BN enforcement.

Produce: FIU-1 business success criteria: `PASS`.

## WP G10BV-Z Final Verdict

| Deliverable | Result |
|---|---|
| BU finalization verification | PASS |
| FIU-1 repository surface inventory | COMPLETE_WITH_RISKS |
| canonical Project write inventory | COMPLETE_WITH_RISKS |
| included operations | `FIU1-PRJ-CREATE`, `FIU1-PRJ-UPDATE` |
| excluded/deferred operations | child Project, AI, contract, financial, dispute, workforce, Response, Participation |
| business value | PASS |
| audit adapter decision | `OPTION_B` |
| evidence payload contract | PASS_WITH_RISKS |
| data minimization | PASS |
| permission boundary | PASS |
| transaction/failure semantics | `BEST_EFFORT_WITH_ERROR_VISIBILITY` |
| correlation/idempotency | PASS_WITH_RISKS; `IDEMPOTENCY_NOT_AVAILABLE_IN_FIU1` |
| API impact | `NO_EXTERNAL_API_CHANGE` |
| UI impact | `NO_UI_CHANGE` |
| schema impact | `NO_SCHEMA_CHANGE` |
| exact implementation file allowlist | FROZEN_WITH_RISKS |
| test matrix | PASS_WITH_RISKS |
| security/privacy review | PASS_WITH_RISKS |
| observability plan | PASS_WITH_RISKS |
| rollback plan | SIMPLE |
| legacy coupling | NO_LEGACY_COUPLING_FOR_INCLUDED_FIU1_OPERATIONS |
| Response/Participation non-collision | NO_RESPONSE_PARTICIPATION_COLLISION |
| acting-entity limitation | `ACTING_ENTITY_NOT_CANONICALLY_RESOLVED`; `ACCEPTABLE_FOR_NON_AUTHORIZING_FIU1` |
| implementation dependency graph | PASS |
| governance baseline commit sequencing | `COMMIT_GOVERNANCE_BASELINE_WITH_FIU1_PLAN` |
| implementation authorization gate | `FIU1_IMPLEMENTATION_READY_WITH_RISKS` |
| business success criteria | PASS |

Mandatory stop lines:

| Stop line | Result |
|---|---|
| application code changes | NONE |
| frontend changes | NONE |
| backend changes | NONE |
| Prisma/schema changes | NONE |
| migration changes | NONE |
| API behavior changes | NONE |
| permission changes | NONE |
| Project behavior changes | NONE |
| AuditLog behavior changes | NONE |
| evidence collection activation | NONE |
| protected-write activation | NONE |
| Response implementation | NONE |
| Participation implementation | NONE |
| acting-entity implementation | NONE |
| authority engine | NONE |
| remediation/finding execution | NONE |
| blocker closure | NONE |
| readiness transition | NONE |
| B4 authorization | NONE |
| G.11 implementation | NONE |
| staging | NONE |
| commit | NONE |
| push | NONE |
| deployment | NONE |

Preserved state:

| State | Result |
|---|---|
| candidate | NOT_READY |
| B4 | BLOCKED - NOT AUTHORIZED |
| G.11 | BLOCKED - NOT AUTHORIZED |
| BN | NEVER_MATERIALIZED |

Verdict: `EXEC-78G.10BV PASS WITH RISKS`.

Risk basis: FIU-1 is now concretely scoped to core Project create/update and can be implemented without schema/API/UI changes, but risks remain from nested create payloads, deferred child writes, broad/different child permission patterns, absent canonical acting-entity runtime, absent idempotency, best-effort audit semantics, unrelated worktree changes, and BN remaining never materialized.
