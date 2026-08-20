# EXEC-78G.10BU OpenStaff Business Domain Governance Binding, Capability Mapping, Operational Boundary & Implementation Handoff Readiness Specification

Date: 2026-08-20

Verdict: `PASS WITH RISKS`

Candidate: `Governance Evidence Foundation v1`

Authorization: `DOCUMENTATION / REPOSITORY BUSINESS-ALIGNMENT ONLY`

Latest prior phase: `EXEC-78G.10BT PASS WITH RISKS`

Candidate readiness: `NOT_READY`

B4 authorization: `BLOCKED - NOT AUTHORIZED`

G.11 authorization: `BLOCKED - NOT AUTHORIZED`

BN provenance: `NEVER_MATERIALIZED`

Status: OpenStaff business-domain discovery, capability mapping, business-object inventory, actor/acting-entity alignment, lifecycle alignment, permission/authority separation, Response/Participation runtime alignment, business-event/governance-event candidate mapping, evidence-producing boundary mapping, governance applicability/non-applicability, runtime integration boundary mapping, business/governance SoR separation, implementation-gap analysis, Minimal Viable Governance v1 boundary, first implementation-unit recommendation, implementation-planning readiness, governance foundation scope control, and controlled governance commit readiness only. No application code, frontend code, backend code, schema, API, migration, database, permission, runtime behavior, business workflow, governance register, governance object, evidence collection, Response implementation, Participation implementation, protected write, readiness transition, B4 authorization, G.11 implementation, staging, commit, push, or deployment was created or changed.

## Mandatory Business-Alignment Rules

BU preserves:

- governance object != business object
- business object != governance evidence object
- business lifecycle != governance lifecycle
- business authorization != governance authorization
- business status != governance readiness
- business permission != governance authority
- business workflow != governance enforcement
- business action != governance decision
- business remediation != governance remediation architecture
- business event != governance event unless explicitly mapped
- repository existence != production activation
- documented capability != runtime proof
- frontend exposure != canonical business authority
- API endpoint != System of Record
- database table != semantic authority

No mapping creates operational authority.

## WP G10BU-A OpenStaff Repository Business Discovery

Repository evidence inspected:

- `apps/admin/api/prisma/schema.prisma`
- `apps/admin/api/src/*` modules, controllers, services, DTOs, guards, decorators, and policies
- `apps/admin/web/app/*` routes and feature pages
- `apps/admin/web/components/*` feature panels
- `apps/admin/web/lib/api.ts`, `apps/admin/web/lib/public-posts.ts`, `apps/admin/web/lib/relu-builder-api.ts`
- `docs/TECHNICAL_DEBT_REGISTER.md`
- `docs/REAL_PROJECT_DISCOVERY_PROOF.md`
- `docs/RELU_AI_PRODUCT_ALIGNMENT.md`
- `docs/proof/exec78/EXEC78D1_ACCOUNT_IDENTITY_SEPARATION.md`
- `EXEC78F0C_ACTING_ENTITY_CONTEXT_AND_RESOLUTION_CONTRACT.md`
- `EXEC78G8_CANONICAL_RESPONSE_AND_PARTICIPATION_DOMAIN_ARCHITECTURE_CONTRACT.md`
- `EXEC78G9_RESPONSE_PARTICIPATION_RUNTIME_IMPLEMENTATION_READINESS_PLAN.md`
- `EXEC78G10_RESPONSE_PARTICIPATION_RUNTIME_DECISION_GATE_AND_CONTRACT_FREEZE.md`

OpenStaff canonical business-domain inventory:

| Domain | Repository name/evidence | Business meaning | Primary code/data locations | API/UI exposure | Lifecycle evidence | Authority/permission evidence | Integration evidence | Status |
|---|---|---|---|---|---|---|---|---|
| Account/Auth/Security | `User`, auth module, trust, 2FA, sessions, security events | authenticated account, login, account state, trust/security controls | `auth`, `trust`, `audit`, `User`, `UserSession`, `SecurityEvent`, 2FA models | `/auth/*`, `/trust/*`, `/security`, `/two-factor` | `AccountLifecycleStatus`, sessions, trust tokens | `JwtGuard`, `RolesGuard`, `PermissionsGuard` | notification/security audit | IMPLEMENTED |
| Identity/Profile/Company | `IdentityProfile`, `IdentityCompanyProfile`, `Profile` | professional/company identity, public profile/company pages, onboarding profile state | `onboarding`, `profiles`, profile models | `/onboarding/*`, `/profile`, `/profiles/:slug`, `/companies/:slug` | verification, onboarding completion, visibility, moderation, profile status | user ownership, admin moderation | audit, trust, RELU classification | PARTIALLY_IMPLEMENTED |
| Marketplace Publishing/Discovery | `PublicPost`, media, documents, external links, comments, reviews | public marketplace posts for projects, professionals, pools, discovery feed | `public-posts`, `public-feedback`, `PublicPost*` models | `/public-posts`, `/jobs`, `/professionals`, `/pools`, `/publish`, admin moderation | moderation, visibility, status, media/document status | owner/admin management, MANAGE_USERS moderation | RELU tasks, notification events, external link review | IMPLEMENTED_WITH_GAPS |
| Project Workspace | `Project`, job requests, conditions, documents, AI interpretation, invitations, proposals, contracts, milestones, invoices, payments, disputes | authenticated project planning and execution workspace | `projects/*`, `Project*` models, `ProjectAccessPolicy` | `/projects`, `/projects/:id`, `/projects/:id/edit` | project status/visibility, job request status, proposal/invitation/contract/escrow/milestone/payment/dispute states | owner/admin access, role/permission guarded writes | audit logs, notifications, RELU, compliance, messaging | IMPLEMENTED_WITH_GAPS |
| Hiring/Applications Legacy | `Job`, `Application`, `HiringPipeline`, `HiringDecision` | legacy job application and hiring pipeline | `jobs`, `hiring`, legacy `Actor/Job/Application` models | `/jobs/:id/apply`, `/hiring/*`, admin hiring pages | application stage, app status, pipeline status, decisions | Firebase/Actor legacy plus JWT role checks | messaging, notifications, workforce conversion | LEGACY_PARTIAL |
| Workforce/Contracts/Execution | `WorkforceAssignment`, `Contract`, operational timesheets, attendance, worker assignments | conversion of hired applications/contracts into work execution | `workforce`, `timesheets`, project execution panels | `/workforce/*`, `/admin/workforce`, project execution panels | assignment, contract lifecycle, attendance, timesheet status | recruiter/admin/worker role checks | messaging, notifications, payroll | PARTIALLY_IMPLEMENTED |
| Payroll/Billing/Subscriptions | billing, payroll cycles, settlements, invoices, payments, subscriptions | commercial and worker settlement operations | `billing`, `payroll`, `subscriptions`, billing/payroll models | `/payroll`, `/admin/payroll`, `/pricing`, `/billing/*` | invoice/payment/cycle/settlement/subscription statuses | admin roles, user billing profile ownership | billing events, manual/provider webhook placeholders | PARTIALLY_IMPLEMENTED |
| Compliance/Verification | actor docs, certifications, medical fitness, verification cases, compliance alerts/tasks/requests | compliance evidence, eligibility, verification, user data requests | `compliance`, `verification`, `ActorDocument`, `VerificationCase`, `ComplianceRequest` | `/compliance`, `/verification/*`, admin verification/compliance | document/cert status, verification case status, task/alert/request status | user/profile access, admin review | audit, notifications, eligibility services | PARTIALLY_IMPLEMENTED |
| Messaging/Notifications | conversations, participants, messages, attachments, notification events/delivery/preferences | communication and notification delivery | `messaging`, `private-messaging`, `notifications`, conversation/message models | `/messages`, `/notifications`, private conversation APIs | message/conversation status, read/dismiss/delivery status | conversation membership, admin moderation, technical ops | project/workforce/public-post linkage | IMPLEMENTED_WITH_BOUNDARY_RISK |
| RELU/AI/Taxonomy | RELU tasks/runs/results, Gemini agents, taxonomy imports, ESCO/NACE/Uniclass | advisory AI assistance, classification, matching, moderation support, taxonomy data | `relu`, `gemini`, `taxonomy`, `esco`, `nace`, `uniclass`, Relu models | `/relu/*`, `/relu-builder`, admin RELU/taxonomy pages | task/result/import statuses, review/override | MODERATE_AI, MANAGE_TECHNICAL_OPERATIONS, superadmin technical guard | audit, projects, profiles, public posts | IMPLEMENTED_ADVISORY |
| Operations/Admin/Backoffice | admin users/roles/security/ui-config/rollout feedback | platform operation, moderation, security, configuration | `access-control`, `ui-config`, `rollout-intelligence`, admin app routes | `/admin/*`, `/status` | role permissions, security event status, workflow runs | ADMIN/SUPERADMIN/RBAC | audit/security/notifications | IMPLEMENTED_WITH_MANUAL_DEPENDENCIES |

Produce: OpenStaff canonical business-domain inventory: `COMPLETE_WITH_RISKS`.

## WP G10BU-B OpenStaff Business Capability Map

| Capability ID | Capability | Domain | Actor classes | Business objects | Triggering actions | Resulting business state | UI/API/persistence/permission evidence | Classification |
|---|---|---|---|---|---|---|---|---|
| CAP-AUTH-01 | Account registration/login/session/2FA | Auth/Security | visitor, user, admin | User, session, 2FA challenge/settings | register, login, verify, logout, revoke session | account/session/security states | `/auth/*`, `/login`, `/register`, `User`, `UserSession`, guards | IMPLEMENTED |
| CAP-ID-01 | Identity and company onboarding | Identity/Profile | user | IdentityProfile, IdentityCompanyProfile, OnboardingSession, Profile | upsert identity/company, update steps | draft profile/company, onboarding progress | `/onboarding/*`, audit logs, lazy onboarding context | IMPLEMENTED_WITH_GAPS |
| CAP-PROFILE-01 | Public/restricted profile management | Identity/Profile | user, admin | Profile, ProfileDocument | upsert profile, upload/extract/moderate/delete docs | profile visibility/moderation/status | `/profile`, `/profiles/*`, profile document APIs | PARTIALLY_IMPLEMENTED |
| CAP-PUBLISH-01 | Marketplace post publishing | Marketplace | user, admin/moderator | PublicPost, media, documents, external links | create/update/delete/upload/moderate | post/media/document status and visibility | public-post APIs, publish UI, moderation endpoints | IMPLEMENTED_WITH_GAPS |
| CAP-DISCOVERY-01 | Marketplace discovery | Marketplace | visitor, user | PublicPost, Profile projections | browse/search/filter | read-only discovery result | `/jobs`, `/professionals`, `/pools`, docs proof | IMPLEMENTED |
| CAP-PROJECT-01 | Project creation and management | Project | employer, contractor, general contractor, admin | Project, ProjectJobRequest, ProjectCondition, ProjectDocument | create/update project, add requests/conditions/docs | project draft/review/published/active states | `/projects`, project controllers/services/policy | IMPLEMENTED_WITH_GAPS |
| CAP-PROJECT-02 | Project invitation/proposal/contracting | Project | owner, profile user, admin | ProjectInvitation, ProjectProposal, ProjectContract | shortlist, invite, submit/update proposal, create contract | invitation/proposal/contract states | project detail UI and controllers | PARTIALLY_IMPLEMENTED |
| CAP-PROJECT-03 | Project financial/dispute/milestone operations | Project | owner/admin | escrow, milestone, invoice, payment, dispute | status updates, requests, dispute events | financial/dispute/milestone states | project contract controllers, project detail UI | PARTIALLY_IMPLEMENTED |
| CAP-HIRING-01 | Legacy job posting/application/hiring | Hiring legacy | Actor, user, recruiter/admin | Job, Application, HiringPipeline, HiringDecision | apply, stage, approve, reject, withdraw | application and pipeline state | jobs/hiring controllers, legacy Actor/Job models | LEGACY |
| CAP-WORK-01 | Workforce assignment and contract lifecycle | Workforce | recruiter/admin, worker | WorkforceAssignment, ContractLifecycleEvent | create assignment, send/activate/suspend/terminate contract | assignment/contract lifecycle | workforce controller/service, worker dashboard | PARTIALLY_IMPLEMENTED |
| CAP-TIME-01 | Attendance and timesheets | Workforce | worker, admin/recruiter | Timesheet, TimesheetEntry, AttendanceRecord | create/submit/approve/reject/check-in/check-out | timesheet/attendance state | timesheets controllers/UI | PARTIALLY_IMPLEMENTED |
| CAP-PAY-01 | Payroll settlement and billing linkage | Payroll/Billing | admin, worker | PayrollCycle, PayrollSettlement, BillingEvent, invoice/payment | process cycles, approve/reject, generate billing | payroll and billing states | payroll/billing controllers/UI | PARTIALLY_IMPLEMENTED |
| CAP-COMP-01 | Compliance and verification | Compliance | user, admin, reviewer | ActorDocument, Certification, MedicalFitness, VerificationCase, UserTask, ComplianceAlert | upload/update/recompute/submit/review | compliance/verification/task states | compliance/verification controllers | PARTIALLY_IMPLEMENTED |
| CAP-MSG-01 | Messaging and notifications | Communication | user, admin/moderator, system | Conversation, Message, NotificationEvent, NotificationDelivery | send/read/dismiss/moderate/retry | communication/delivery state | messaging/notification controllers/UI | IMPLEMENTED_WITH_BOUNDARY_RISK |
| CAP-RELU-01 | RELU advisory intelligence | RELU/AI | user, AI moderator, admin, superadmin | ReluTask, ReluProcessingRun, results, GeminiAgent | run assistant, classify, match, override, configure | advisory result/review state | RELU controllers/admin pages/docs | IMPLEMENTED_ADVISORY |
| CAP-TAX-01 | Taxonomy/geography/reference data | Taxonomy | visitor, user, admin | Country, Region, City, ESCO, NACE, Uniclass, import batches | search/import/validate/commit/update | taxonomy/import state | taxonomy/esco/nace/uniclass APIs | IMPLEMENTED_WITH_ADMIN_GAPS |

Produce: OpenStaff business capability map: `COMPLETE_WITH_RISKS`.

## WP G10BU-C Canonical Business Object Inventory

Canonical business objects:

| Object | Repository type/model/schema | Domain | Identifier | Ownership/acting entity | Lifecycle/state | Persistence/API/UI | Audit/evidence relevance | Boundary classification |
|---|---|---|---|---|---|---|---|---|
| Account | `User` | Auth | `User.id` | authenticated account, role | approval/account lifecycle | Prisma, `/auth/*`, admin users | security/audit relevant | business object |
| Identity Profile | `IdentityProfile` | Identity | `id`, `publicSlug`, `userId` | account-owned identity | verification/onboarding | `/onboarding/identity-profile` | identity evidence candidate | business object |
| Company Identity | `IdentityCompanyProfile` | Identity | `id`, `ownerUserId` | account-owned company profile | verification/onboarding | `/onboarding/company-profile` | company evidence candidate | business object |
| Public Profile | `Profile` | Profile | `id`, `slug`, `userId` | user-owned; admin moderation | visibility/moderation/lifecycle/availability | `/profile`, `/profiles/*` | public visibility evidence candidate | business object/projection hybrid |
| Public Post | `PublicPost` | Marketplace | `id`, `slug` | author user/profile; admin moderation | status, visibility, moderation | `/public-posts`, `/jobs`, `/publish` | moderation/evidence candidate | business object |
| Public Post Asset | `PublicPostMedia`, `PublicPostDocument`, `ExternalLinkSubmission` | Marketplace | asset IDs | post owner/admin | moderation/security status | upload/download/admin moderation APIs | evidence and moderation candidate | business object/evidence-adjacent asset |
| Project | `Project` | Project | `id`, `slug` | `createdById`, ProjectAccessPolicy | status/visibility/published/archived | `/projects` APIs/UI | high governance relevance | business object |
| Project Request/Condition/Document | `ProjectJobRequest`, `ProjectCondition`, `ProjectDocument` | Project | IDs | project owner/admin | request/document/extraction state | project child APIs/UI | scope/evidence candidate | business child object |
| Project Invitation/Proposal/Contract | `ProjectInvitation`, `ProjectProposal`, `ProjectContract` | Project | IDs | project/profile/user scoped | invitation/proposal/contract states | project workspace APIs/UI | decision/consent/evidence candidate | business object |
| Project Finance/Dispute | escrow, milestone, invoice, payment, dispute/event | Project/Finance | IDs | project/contract scoped | financial/dispute statuses | project contract APIs/UI | high evidence/authority relevance | business object |
| Legacy Actor/Job/Application | `Actor`, `Job`, `Application` | Legacy hiring | IDs | Actor/Firebase plus user bridge | job/app/application stage | jobs/hiring APIs | migration/lineage risk | legacy business object |
| Workforce Assignment | `WorkforceAssignment` | Workforce | ID | user/job/contract/application link | assignment status | workforce APIs/UI | conversion/evidence candidate | business object |
| Operational Timesheet/Attendance | `Timesheet`, `TimesheetEntry`, `AttendanceRecord` | Workforce | IDs | worker/admin/recruiter | timesheet/attendance statuses | timesheet APIs/UI | approval/evidence candidate | business object |
| Payroll Settlement/Cycle | `PayrollCycle`, `PayrollSettlement`, lines/link | Payroll | IDs | admin/worker | payroll/settlement/billing link statuses | payroll APIs/UI | authority/evidence candidate | business object |
| Compliance Evidence | `ActorDocument`, `ActorCertification`, `MedicalFitnessCertificate` | Compliance | IDs | profile/user/admin | compliance document status | compliance APIs | evidence candidate | business object/evidence source |
| Verification Case | `VerificationCase`, documents, decisions | Verification | IDs | user/admin reviewer | case/decision statuses | verification APIs/UI | decision/evidence candidate | business object |
| Audit/Security Record | `AuditLog`, `SecurityEvent` | Audit/Security | IDs | system-written | append/status reviewed | audit/security APIs | business audit foundation, not governance register | evidence object |
| Notification/Event/Delivery | `Notification`, `NotificationEvent`, `NotificationDelivery` | Notification | IDs/key | notification system | delivery/read/dismiss statuses | notification APIs/UI | event/delivery evidence candidate | business event object |
| Conversation/Message | `Conversation`, `ConversationParticipant`, `Message`, attachments | Messaging | IDs | participant membership | conversation/message/read/moderation | messaging APIs/UI | communication audit candidate | business object |
| RELU Run/Result | `ReluTask`, `ReluProcessingRun`, classification/match/recommendation | RELU | IDs | advisory system/reviewer | task/result statuses | RELU APIs/UI | advisory evidence candidate | advisory business object |
| Taxonomy Reference | Country/Region/City/Language/ESCO/NACE/Uniclass/import records | Taxonomy | IDs/code | admin/import owner | import/status/reference state | taxonomy APIs/UI | governance support, usually not governed object | reference data |

Distinctions: `AuditLog`, `SecurityEvent`, and `NotificationEvent` are evidence/event objects, not governance objects. `ProjectDetail`, marketplace feed cards, dashboard KPIs, and public pages are UI/API projections, not Systems of Record. Database tables are business persistence, not semantic authority.

Produce: OpenStaff canonical business-object inventory: `COMPLETE_WITH_RISKS`.

## WP G10BU-D Business Actor & Acting-Entity Alignment

Actor findings:

| Actor class | Repository evidence | Acts on behalf of | Scope/boundary | Business objects affected | Governance evidence that may be required |
|---|---|---|---|---|---|
| Visitor | public routes and public APIs | self/no account | read public posts/profiles; submit some public interactions where allowed | discovery, comments/reviews/private contact depending endpoint | low, abuse/moderation evidence only |
| Authenticated User | `User`, `JwtGuard` | account identity | account/profile/project owned writes | profile, onboarding, public posts, projects, messages, notifications | account/actor/target/correlation |
| Professional/Company identity | `IdentityProfile`, `IdentityCompanyProfile`, `Profile` | profile/company representation | currently represented mostly by `User/Profile`; canonical acting entity not implemented | profile, public posts, projects/proposals | future acting-entity and authority relationship evidence |
| Legacy Actor | `Actor`, `FirebaseAuthGuard`, `PlatformRolesGuard` | legacy individual/company/public institution | legacy job/application/contracts | Job, Application, Contract | migration lineage and model-boundary evidence |
| Admin/Superadmin | `Role.ADMIN`, `Role.SUPERADMIN`, admin controllers | platform operator role | broad admin/backoffice actions | users, posts, verification, billing, security, RELU, taxonomy | stronger authority and review evidence likely required |
| AI Moderator | `Role.AI_MODERATOR`, `MODERATE_AI` | AI moderation role | RELU/moderation scopes | RELU results, prompts, AI actions | review/override evidence |
| Worker | `Role.WORKER`, worker routes | worker account | assignment, timesheet, attendance, payroll views | assignments, timesheets, attendance, payroll | time/approval evidence |
| Employer/Contractor/General Contractor | roles and project/workforce/hiring guards | business party role | project, hiring, workforce, timesheet review | project, application, assignment, contract, timesheet | decision/authority evidence |
| System/Service actor | notification, RELU, audit/security services | platform service | generated events, assistant runs, notifications | NotificationEvent, ReluProcessingRun, AuditLog | source/correlation evidence |

Current acting-entity gap: EXEC-78F.0C defines account identity, acting entity, authority relationship, context revision, and validation boundaries, but current runtime does not provide canonical acting-entity context or authority relationship IDs. Current `identityType` onboarding state is identity-creation intent only and must not become authority.

Produce: OpenStaff business actor and acting-entity map: `COMPLETE_WITH_RISKS`.

## WP G10BU-E Business Lifecycle Alignment

Business lifecycle/governance relevance matrix:

| Object family | Repository lifecycle states | Possible governance relevance |
|---|---|---|
| Account | `PENDING/APPROVED/REJECTED`, `LIVE/OFFLINE/SUSPENDED` | AUTHORITY_RELEVANT, AUDIT_RELEVANT |
| Identity/Profile | verification, onboarding completion, visibility, moderation, `OFFLINE/LIVE/SUSPENDED`, availability | EVIDENCE_RELEVANT, CONSENT_RELEVANT, AUTHORITY_RELEVANT |
| PublicPost/assets | post status string, `PublicModerationStatus`, visibility, external-link security | EVIDENCE_RELEVANT, COMPLIANCE_RELEVANT, DECISION_RELEVANT |
| Project | `DRAFT/IN_REVIEW/PUBLISHED/ACTIVE/ON_HOLD/COMPLETED/CANCELLED/ARCHIVED` | AUTHORITY_RELEVANT, EVIDENCE_RELEVANT, DECISION_RELEVANT |
| Project child workflow | job request, invitation, proposal, contract, escrow, milestone, invoice, payment, dispute states | AUTHORITY_RELEVANT, CONSENT_RELEVANT, REMEDIATION_RELEVANT conditional |
| Legacy Job/Application | job status, app status, application stages, decisions | DECISION_RELEVANT, UNKNOWN migration relevance |
| Workforce/Contract | assignment, contract lifecycle event/status | AUTHORITY_RELEVANT, EVIDENCE_RELEVANT |
| Timesheet/Attendance | draft/submitted/approved/rejected, checked-in/out/missed | EVIDENCE_RELEVANT, AUTHORITY_RELEVANT |
| Payroll/Billing | cycle, settlement, invoice, payment, webhook, renewal statuses | AUTHORITY_RELEVANT, COMPLIANCE_RELEVANT |
| Compliance/Verification | document/cert/alert/task/request/case statuses | EVIDENCE_RELEVANT, COMPLIANCE_RELEVANT, DECISION_RELEVANT |
| Messaging/Notification | conversation/message/read/delivery statuses | AUDIT_RELEVANT, CONSENT_RELEVANT conditional |
| RELU/Taxonomy | task/run/result/import statuses | EVIDENCE_RELEVANT for review/override, NONE for read-only reference data |

BU does not force governance lifecycle states onto business objects.

Produce: OpenStaff business lifecycle/governance relevance matrix: `COMPLETE_WITH_RISKS`.

## WP G10BU-F Business Permission & Governance Authority Separation

Business permission/governance authority separation matrix:

| Existing mechanism | Repository evidence | Business function | Governance separation |
|---|---|---|---|
| `JwtGuard` | auth guard resolves account and rejects missing/invalid/suspended users | authentication and account access | application permission != governance authority |
| `RolesGuard` | role lists on controllers | coarse route authorization | role != governance owner; admin != governance approver |
| `PermissionsGuard` | READ/WRITE/DELETE/MANAGE_USERS/MODERATE_AI/MANAGE_TECHNICAL_OPERATIONS | RBAC permission check and denial security event | generic permission cannot satisfy action-specific governance authority |
| `ProjectAccessPolicy` | owner/admin and invited/proposal/contract read access | project access scoping | resource owner != governance evidence owner |
| `FirebaseAuthGuard`/`PlatformRolesGuard` | legacy Actor/PlatformRole path | legacy jobs/documents | legacy permission cannot become canonical authority without migration |
| Admin moderation routes | public posts/media/docs/profile/security/relu | backoffice moderation | protected write != governance authorization |
| Service transactions | workforce/payroll/project operations | domain mutation consistency | transaction != governance decision |

Future governance controls may supplement project publish/update, public-post moderation, profile/company verification, proposal/contract acceptance, timesheet/payroll approval, compliance verification, RELU override, and admin role/trust actions. They must not replace existing business permissions.

Produce: business permission/governance authority separation matrix: `PASS WITH RISKS`.

## WP G10BU-G Response & Participation Business Alignment

Response/Participation business-runtime alignment:

| Dimension | Response | Participation |
|---|---|---|
| Business meaning from EXEC G8/G9/G10 | attributable interest in one Opportunity | object-scoped relationship and consent state |
| Runtime model | ABSENT as canonical Response | ABSENT as canonical Participation |
| Closest existing records | PublicPost opportunity, legacy Application, ProjectProposal | ProjectInvitation, ProjectProposal, ConversationParticipant, ProjectWorkerAssignment, Contract |
| Reuse rule | Application/Proposal/private contact must not be renamed as Response | invitation acceptance/conversation membership/assignment must not be renamed as Participation |
| Ownership | DOCUMENTED_ONLY | DOCUMENTED_ONLY |
| Lifecycle | DOCUMENTED_ONLY | DOCUMENTED_ONLY |
| Consent | UNKNOWN/ABSENT runtime | DOCUMENTED_ONLY, absent runtime consent evidence |
| Conversion | DOCUMENTED_ONLY; no canonical conversion | DOCUMENTED_ONLY; no canonical conversion |
| Acting entity | DOCUMENTED_ONLY in F0C/G10; absent runtime | DOCUMENTED_ONLY in F0C/G10; absent runtime |
| UI/API exposure | ABSENT; `/jobs/:id` current CTA is not Response | ABSENT |
| Persistence | ABSENT | ABSENT |
| Audit/evidence | generic AuditLog foundation only | generic AuditLog foundation only |

Produce: Response/Participation business-runtime alignment matrix: `PASS WITH RISKS`.

## WP G10BU-H Business Event & Governance Event Mapping

Business-event/governance-event candidate map:

| Operation | Current location | Classification |
|---|---|---|
| register/login/2FA/session revoke | auth/trust/audit | governance-relevant, audit-producing candidate |
| onboarding identity/company upsert | onboarding service | evidence-producing, authority-sensitive future candidate |
| profile upsert/document upload/extract/moderate | profiles service | evidence-producing, decision-sensitive candidate |
| public post create/update/delete/moderate/media/document/link | public-posts service/controller | evidence-producing, authority-sensitive, compliance/moderation candidate |
| project create/update, documents, conditions, AI interpretation apply | projects controllers/services | governance-relevant, evidence-producing, authority-sensitive |
| project shortlist/invite/proposal/contract/milestone/payment/dispute | project child controllers | decision/evidence/consent-sensitive candidate |
| legacy job apply/application stage/approve/reject/withdraw | jobs/hiring | legacy decision/evidence candidate, migration-sensitive |
| workforce assignment and contract lifecycle changes | workforce service | authority/evidence-producing candidate |
| timesheet create/submit/approve/reject/check-in/out | timesheets service | evidence-producing and approval-sensitive |
| payroll cycle/process/settlement approve/reject/billing link | payroll/billing | authority/evidence/compliance-sensitive |
| verification submit/review | verification service | decision/evidence-sensitive |
| compliance document/cert/medical/task/request updates | compliance services | compliance/evidence-sensitive |
| message send/edit/delete/moderate/read | messaging service | audit/moderation candidate, usually not governance event |
| notification delivery/read/dismiss/retry | notification service | delivery audit candidate, not lifecycle authority |
| RELU classify/match/recommend/override/configure | RELU services | evidence-producing for AI review/override |
| taxonomy import validate/commit/update | taxonomy service | admin evidence candidate |

No governance event is created by BU.

Produce: business-event/governance-event candidate map: `COMPLETE_WITH_RISKS`.

## WP G10BU-I Evidence-Producing Business Boundaries

OpenStaff evidence-producing boundary map:

| Boundary | Candidate evidence dimensions |
|---|---|
| Project create/update/publish/archive | actor, acting entity, project ID/revision, previous/resulting status/visibility, authority context, reason, timestamp, source, correlation, lineage |
| PublicPost publish/moderation/media/document/link | actor, post/asset ID, previous/resulting moderation/visibility/security status, reviewer, source upload/link, timestamp, correlation |
| Profile/company verification and public visibility | actor, identity/profile/company ID, previous/resulting verification/visibility/moderation, reviewer, evidence assets, timestamp |
| Proposal/invitation/contract status | actor, project/profile/proposal/invitation/contract IDs, previous/resulting state, consent/acceptance context, reason, correlation |
| Timesheet/payroll approval/rejection | worker/admin actor, assignment/timesheet/settlement IDs, previous/resulting status, hours/amount snapshot, reason, timestamp |
| Compliance/verification document decision | actor/reviewer, evidence asset, target profile/project/user, previous/resulting decision/status, independence/reason |
| RELU result override/review | actor, run/result ID, model/prompt/input/output snapshot, previous/resulting status, override reason |
| Admin role/trust/security action | admin actor, target user, previous/resulting role/status/trust/security status, request context |

No evidence collection is activated.

Produce: OpenStaff evidence-producing boundary map: `PASS WITH RISKS`.

## WP G10BU-J Governance Applicability Matrix

| Capability | Required/Likely governance families |
|---|---|
| Project create/update/publish | REQUIRED: authority, ownership, evidence, event, lifecycle, constraint, validation; LIKELY_REQUIRED: decision, claim, verification, policy |
| Public post moderation/publishing | REQUIRED: evidence, decision, policy, accountability; LIKELY_REQUIRED: compliance, finding, remediation for moderation failures |
| Profile/company verification | REQUIRED: evidence, decision, verification, accountability; LIKELY_REQUIRED: authority, compliance, policy |
| Proposal/invitation/contract transitions | LIKELY_REQUIRED: authority, evidence, consent, decision, lifecycle, obligation, compliance |
| Timesheet/payroll approvals | LIKELY_REQUIRED: authority, evidence, decision, obligation, compliance, accountability |
| Compliance/verification cases | REQUIRED: evidence, verification, decision, compliance, accountability |
| RELU review/override | LIKELY_REQUIRED: evidence, decision, accountability, policy, finding for override disputes |
| Auth/session/security events | LIKELY_REQUIRED: evidence, event, accountability, policy |
| Messaging/notifications | CONDITIONAL: evidence/event only for moderation, abuse, delivery, or project-linked disputes |
| Taxonomy/reference reads | NOT_APPLICABLE for governance controls except admin import/commit evidence |
| Dashboard/read-only feeds | NOT_APPLICABLE except provenance and freshness metadata |
| Response/Participation | REQUIRED by existing EXEC G8/G9/G10 contracts, but runtime is ABSENT |

No `REQUIRED` classification is based on theory alone; required rows are tied to current state-changing repository operations or frozen EXEC-78 contracts.

Produce: OpenStaff governance applicability matrix: `PASS WITH RISKS`.

## WP G10BU-K Non-Applicability & Over-Governance Audit

OpenStaff governance non-applicability matrix:

| Area | Non-applicability result |
|---|---|
| Public read-only discovery pages and static legal/marketing pages | governance registers unnecessary; cache/provenance may suffice |
| Dashboard KPI cards and derived summaries | derived projections, not authoritative objects |
| Notification read/dismiss preferences | low-risk user preference state; no governance decision unless tied to regulated delivery |
| Message read receipts | communication UX state; not operational Participation |
| Taxonomy search/read APIs | reference lookup; governance needed only for import/commit/admin mutation |
| RELU suggestions before apply/override | advisory output; no authority or decision until applied/reviewed |
| Local onboarding route state and browser storage | presentation/draft state; not acting-entity authority |
| Public comments/reviews basic submission | moderation/abuse relevant, but not full governance unless used for compliance/finding decisions |
| Fallback/demo helper paths | should be bounded or retired, not governed into product truth |

Produce: OpenStaff governance non-applicability matrix: `PASS`.

## WP G10BU-L Runtime Integration Boundary Map

| Boundary class | Current implementation location | Current behavior | Governance relevance | Risk |
|---|---|---|---|---|
| Route/controller guards | `JwtGuard`, `RolesGuard`, `PermissionsGuard`, controller decorators | authenticate and authorize route access | authority and denial evidence supplement | broad RBAC too coarse |
| Project service writes | `projects`, project child services | create/update/project child mutations | protected write/evidence/authority | high coupling but best initial target |
| PublicPost service writes | `public-posts` | publish/moderate/upload/link/RELU tasks | evidence/moderation | public visibility risk |
| Audit service | `audit.service.ts` | generic AuditLog/SecurityEvent | reusable evidence foundation | lacks acting entity/revision/lineage |
| Notification service | notification event/delivery APIs | emits delivery/user notifications | downstream event evidence | notification not lifecycle truth |
| Compliance/verification services | compliance/verification modules | evidence and review operations | high governance relevance | domain complexity |
| Workforce/timesheet/payroll services | workforce/timesheets/payroll | execution and approval operations | high evidence/authority relevance | commercial/workflow risk |
| RELU services | relu/gemini | advisory runs/reviews/overrides | AI evidence/review | advisory must stay non-authoritative |
| Prisma writes | schema-backed services | business SoR writes | evidence hook candidate | no governance transaction contract yet |

Produce: OpenStaff governance/runtime integration boundary map: `COMPLETE_WITH_RISKS`.

## WP G10BU-M Business Data & System-of-Record Alignment

Business SoR / governance SoR separation matrix:

| Object family | Business persistence source | Derived copies/projections | Governance SoR relationship |
|---|---|---|---|
| Account/session/security | `User`, `UserSession`, `SecurityEvent` | auth responses, security admin UI | business auth SoR; not governance authority register |
| Identity/profile/company | `IdentityProfile`, `IdentityCompanyProfile`, `Profile` | public pages, cards, onboarding state | business identity/profile SoR; future authority relationship may need separate governance record |
| Public marketplace | `PublicPost*` | feeds, job/professional/pool pages | marketplace SoR; not governance evidence SoR |
| Project workspace | `Project*` models | project detail UI, dashboard | project business SoR; governance evidence would observe writes |
| Legacy hiring | `Actor/Job/Application` | admin hiring/workforce views | legacy business SoR; migration ambiguity |
| Workforce/time/payroll | workforce/timesheet/payroll models | worker/admin dashboards | execution/commercial SoR; governance evidence separate |
| Compliance/verification | compliance/verification models | compliance pages | evidence-like business records, but not Governance Evidence Foundation registers |
| Audit/security/notification | `AuditLog`, `SecurityEvent`, `NotificationEvent/Delivery` | admin audit/security/notifications | reusable business audit/event foundation; not canonical governance SoR |
| RELU/taxonomy | RELU and taxonomy models | RELU admin/public suggestions/chips | advisory/reference SoR; not authority |

A business database does not automatically become a governance register. A governance register does not replace the business database.

Produce: business SoR / governance SoR separation matrix: `PASS WITH RISKS`.

## WP G10BU-N Existing Implementation Gap Analysis

OpenStaff governance implementation-gap register:

| Gap type | Gap | Impact |
|---|---|---|
| Business | active `User/Profile/Project/PublicPost` model coexists with legacy `Actor/Job/Application` flows | source-of-truth and migration ambiguity |
| Business | Response and Participation runtime records are absent | canonical G8/G9/G10 domains cannot be planned as direct implementation without new schema/API |
| Governance | no runtime acting-entity context, authority relationship ID, authority revision, or delegation proof | governance authority cannot be enforced yet |
| Governance | generic permissions do not express domain/action authority | protected writes need finer action vocabulary |
| Runtime | no governance middleware/command boundary/protected-write contract | integration cannot safely start across all domains |
| Evidence | `AuditLog` lacks first-class acting entity, authority revision, domain revision, lineage, idempotency, and result semantics | usable foundation, incomplete governance evidence |
| Authority | admin roles are broad and not separated from governance approver/reviewer/verifier roles | over-authorized governance interpretation risk |
| Documentation | exact first workflow and business risk appetite were not previously fixed | BU resolves recommendation but does not authorize implementation |
| Commit hygiene | AA through BU docs are local/untracked with unrelated app changes present | controlled commit possible but isolation requires care |

Produce: OpenStaff governance implementation-gap register: `COMPLETE_WITH_RISKS`.

## WP G10BU-O Minimal Viable Governance Boundary

OpenStaff Minimal Viable Governance v1 boundary:

Included minimum subset:

| Component | Why required | Business capability | Risk controlled | Why not deferrable |
|---|---|---|---|---|
| Protected write boundary descriptor | identifies exact business operation under governance observation | Project create/update/publish or PublicPost moderation | uncontrolled scope creep | first integration must be exact |
| Authenticated account attribution | current runtime already has `User` | Project/PublicPost writes | actor ambiguity | all writes need actor |
| Business object reference | target object ID/type | Project/PublicPost | wrong-target evidence | all evidence needs target |
| Previous/resulting business state snapshot | existing services can read before/write after | Project/PublicPost status/visibility | silent mutation | basic audit integrity |
| Existing permission result reference | use current guards as business permission input | Project/PublicPost | bypass confusion | governance must not replace app permission |
| Generic audit evidence adapter | reuse `AuditLog` shape as foundation with explicit limitations | selected write | no traceability | first planning needs existing hook |
| Correlation/request context | already partially available in AuditService | selected write | replay/debug gap | minimal lineage |
| Explicit non-authority statement | preserves governance/app boundary | all included writes | accidental B4/G.11 claims | mandatory |

Excluded/deferred:

| Component | Classification |
|---|---|
| Full governance register SoR | deferred; unsupported for first narrow integration |
| Response/Participation runtime | future-only; absent schema/API |
| BN enforcement | unsupported; BN remains NEVER_MATERIALIZED |
| Remediation/finding closure | unnecessary for first write observation |
| Full authority relationship/delegation engine | deferred but required before true governance authorization |
| Compliance determination engine | future-only |
| Readiness/B4/G.11 automation | prohibited |

Recommended first workflow basis: a narrow Project write evidence boundary is smallest while still touching real business value, ownership, lifecycle, UI/API, and existing audit surfaces.

Produce: OpenStaff Minimal Viable Governance v1 boundary: `PASS WITH RISKS`.

## WP G10BU-P Candidate First Implementation Unit

Candidate units:

| Candidate | Scope | Objects | Governance components | Data/API/UI/permission/evidence impact | Coupling/risk/prerequisites |
|---|---|---|---|---|---|
| FIU-1 Project write evidence boundary | `ProjectsController.create/update`, `ProjectsService`, project status/visibility/document-adjacent writes | Project, ProjectDocument optional | account attribution, target reference, before/after state, permission result, audit adapter | additive evidence only; no schema if using current AuditLog, UI can remain unchanged | medium coupling; requires exact write list and audit payload contract |
| FIU-2 PublicPost moderation evidence boundary | admin public post/media/document status changes | PublicPost/assets | moderator attribution, before/after moderation/visibility/security, reason | additive audit/moderation evidence | public-facing sensitivity; requires moderation reason discipline |
| FIU-3 Verification case review evidence boundary | admin verification review | VerificationCase, VerificationDecision | reviewer attribution, evidence asset refs, decision state, before/after | high governance value | narrower but compliance-sensitive; requires reviewer policy clarity |

Recommended first implementation unit: `FIU-1 Project write evidence boundary`.

Rationale: Project writes are current, user-facing, owned by a clear business object, guarded by `JwtGuard`, `PermissionsGuard`, role checks, and `ProjectAccessPolicy`, exposed in frontend and API, and already adjacent to audit, documents, compliance, invitations/proposals/contracts, and execution panels. A narrow evidence boundary can be planned without implementing Response/Participation, changing business workflow, or claiming governance authorization.

Selection is planning only and does not authorize implementation.

Produce: first OpenStaff governance implementation-unit recommendation: `FIU-1 PROJECT WRITE EVIDENCE BOUNDARY`.

## WP G10BU-Q Implementation Handoff Readiness

Outcome: `IMPLEMENTATION_PLANNING_READY_WITH_RISKS`.

Readiness basis:

- actual business domains, capabilities, objects, actors, lifecycle states, permissions, events, evidence candidates, SoR boundaries, and gaps were identified from repository evidence
- Minimal Viable Governance v1 can be scoped narrowly to a Project write evidence boundary
- implementation planning can now avoid unlimited abstract governance-contract expansion

Risks:

- active/legacy model split remains unresolved
- acting-entity and authority relationship runtime is absent
- Response/Participation runtime is absent
- current audit model is generic and incomplete for canonical governance evidence
- BN remains absent and enforcement must stay boundary-only

## WP G10BU-R Governance Foundation Scope-Control Decision

Decision: `GOVERNANCE_FOUNDATION_SUFFICIENT_FOR_IMPLEMENTATION_PLANNING`.

No additional abstract Governance Evidence Foundation contract is required before drafting an implementation plan for FIU-1. Missing runtime concepts should be handled inside implementation planning as scoped design/engineering tasks, not as another open-ended governance architecture phase.

Produce: Governance Foundation scope-control decision: `GOVERNANCE_FOUNDATION_SUFFICIENT_FOR_IMPLEMENTATION_PLANNING`.

## WP G10BU-S Commit Baseline Preparation Assessment

Controlled governance commit readiness assessment:

| Check | Result |
|---|---|
| governance docs AA through BU local/untracked | YES |
| index files changed | `STATUS.md`, `docs/proof/exec78/README.md` |
| unrelated worktree changes exist | YES, pre-existing app/web source modifications and untracked assets remain |
| governance docs can be isolated | YES, with careful path-specific staging only |
| generated/duplicate/incomplete artifact risk | RISK: many local docs are untracked; BU does not stage |
| BN absence documented | YES, BS/BT/BU retain `NEVER_MATERIALIZED` |
| STATUS/README/spec ordering | CONSISTENT after BU indexing |

Result: `READY_WITH_RISKS`.

Do not stage, commit, or push from BU.

Produce: controlled governance commit readiness assessment: `READY_WITH_RISKS`.

## WP G10BU-T Final Verdict

| Deliverable | Result |
|---|---|
| OpenStaff business-domain inventory completeness | COMPLETE_WITH_RISKS |
| business capability mapping completeness | COMPLETE_WITH_RISKS |
| canonical business-object inventory completeness | COMPLETE_WITH_RISKS |
| actor/acting-entity alignment | COMPLETE_WITH_RISKS |
| lifecycle alignment | COMPLETE_WITH_RISKS |
| permission/authority separation | PASS_WITH_RISKS |
| Response/Participation alignment | PASS_WITH_RISKS |
| business-event/governance-event mapping | COMPLETE_WITH_RISKS |
| evidence-producing boundary mapping | PASS_WITH_RISKS |
| governance applicability | PASS_WITH_RISKS |
| governance non-applicability | PASS |
| runtime integration boundaries | COMPLETE_WITH_RISKS |
| business/governance SoR separation | PASS_WITH_RISKS |
| implementation gaps | COMPLETE_WITH_RISKS |
| Minimal Viable Governance boundary | PASS_WITH_RISKS |
| first implementation-unit recommendation | FIU-1 PROJECT WRITE EVIDENCE BOUNDARY |
| implementation-planning readiness | IMPLEMENTATION_PLANNING_READY_WITH_RISKS |
| Governance Foundation scope-control decision | GOVERNANCE_FOUNDATION_SUFFICIENT_FOR_IMPLEMENTATION_PLANNING |
| controlled governance commit readiness | READY_WITH_RISKS |

Mandatory stop lines:

| Stop line | Result |
|---|---|
| application code changes | NONE |
| frontend changes | NONE |
| backend changes | NONE |
| schema changes | NONE |
| API changes | NONE |
| migration changes | NONE |
| database changes | NONE |
| permission changes | NONE |
| runtime changes | NONE |
| production changes | NONE |
| governance register creation | NONE |
| governance object instantiation | NONE |
| evidence collection activation | NONE |
| business workflow mutation | NONE |
| Response implementation | NONE |
| Participation implementation | NONE |
| protected writes | NONE |
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

Verdict: `EXEC-78G.10BU PASS WITH RISKS`.

Risk basis: OpenStaff business alignment and implementation-planning handoff are sufficient for a narrow first implementation plan, but the repo still carries a current/legacy domain split, no canonical acting-entity runtime, no Response/Participation runtime, generic audit evidence, broad RBAC, manual commercial dependencies, unrelated worktree changes, and the inherited BN absence/reference risk.
