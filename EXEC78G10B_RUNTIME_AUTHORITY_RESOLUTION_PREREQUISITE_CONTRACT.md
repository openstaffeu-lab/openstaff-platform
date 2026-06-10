# EXEC-78G.10B Runtime Authority Resolution Prerequisite Contract

Date: 2026-06-08

Verdict: `PASS WITH RISKS`

Authority-resolution readiness: `READY FOR SCHEMA/API PLANNING; RUNTIME CAPABILITY STILL BLOCKED`

G.11 authorization: `BLOCKED - NOT AUTHORIZED`

Status: authority-resolution prerequisite architecture only. No route, API, controller, service, DTO, Prisma schema, permission, runtime logic, UI, migration, deployment artifact, Response implementation, Participation implementation, or G.11 work was created or changed.

## A. Executive Finding

EXEC-78G.10B closes the architecture ambiguity around trusted acting-entity and authority resolution.

The repository currently has:

- trusted JWT account authentication with a current `User` lookup
- account lifecycle suspension enforcement
- account roles and broad role permissions
- Professional and Company identity records
- legacy Profile ownership checks
- legacy Firebase Actor authentication and platform roles
- object-local Project owner/admin checks
- generic audit and security-event foundations

The repository does not currently have:

- a canonical runtime Authority Relationship record
- an authority-revision source of truth
- action/object-scoped authority resolution
- a canonical delegation chain
- one trusted acting-entity request context
- canonical Institution identity backing
- complete authority-resolution audit attribution

Therefore:

- current account authentication is reusable
- current entity records are candidate identity mappings
- current roles, permissions, ownership comparisons, Profile ownership, Project ownership, and legacy Actor context cannot authorize protected Response or Participation writes
- the canonical `AuthorityResolutionResult` and fail-closed behavior are now defined
- the prerequisite is ready for schema/API planning only
- runtime authority readiness remains blocked until separately implemented and proven
- Response and Participation remain unauthorized
- G.11 remains blocked

## B. Ownership Boundaries

| Concern | Canonical owner | Responsibility |
|---|---|---|
| account authentication | Authentication/Session | validate token/session, load current account, reject missing/suspended account |
| entity identity | Identity domain | own Professional, Company, and future Institution identity truth |
| Authority Relationship | Identity/Representation | own account-to-entity authority relationship and lifecycle |
| authority revision | Identity/Representation | issue and validate current revision/epoch |
| delegation | Representation/Delegation | own chain, source relationship, scope narrowing, expiry, and revocation |
| entity selection | requesting client/Shell | request exactly one entity; selection is an untrusted hint |
| resolution orchestration | future trusted authority-resolution boundary | combine trusted owner results without becoming their source of truth |
| action policy | Response or Participation domain | decide whether resolved scope permits the requested domain action |
| target-object policy | target/domain owner | validate object visibility, lifecycle, ownership, and action scope |
| resolution audit | authority-resolution boundary and Audit owner | record outcome and attribution without becoming authority owner |
| final protected write | Response or Participation owner | revalidate required result and fail closed before commit |

No owner may substitute account role, visibility, Profile ownership, Project ownership, or Participation for a current Authority Relationship.

## C. WP G10B-A Current Authority Baseline Audit

### Current Runtime Inventory

| Structure | Current behavior | Reuse classification | Protected-write authority classification |
|---|---|---|---|
| `JwtGuard` | validates bearer token, reloads `User`, rejects missing/suspended account, sets `request.user` | `REUSE` for account authentication | necessary but insufficient |
| JWT `sub` | current `User.id` after database lookup | `REUSE` as account ID | never an acting entity by itself |
| `User.role` | account-level platform role | `REUSE WITH LIMITS` for existing administration | cannot prove entity representation or object scope |
| `RolesGuard` | role allowlist with SUPERADMIN bypass | `EXISTING ONLY` | cannot authorize future entity-attributed Response/Participation writes |
| `RolePermission`/`PermissionsGuard` | broad role permissions such as READ/WRITE | `EXISTING ONLY` | generic permission is insufficient for G.10 action vocabulary |
| `IdentityProfile` | one Professional-like identity record per User | `CANDIDATE ENTITY MAPPING` | record existence/ownership does not itself prove current action authority |
| `IdentityCompanyProfile` | Company identity with `ownerUserId`; multiple records possible per User | `CANDIDATE ENTITY MAPPING` | owner link is a relationship input, not a complete revisioned authority result |
| legacy `Profile` | one account-linked public/operational profile | `LEGACY PRESENTATION/DOMAIN RECORD` | must not become canonical Professional/Company authority |
| legacy `Actor` | separate Firebase identity, actor type, platform role, jobs/applications | `LEGACY ISOLATED` | prohibited as canonical authority for Response/Participation |
| `FirebaseAuthGuard` | authenticates Firebase token and sets `request.actor`; marked deprecated | `LEGACY ONLY` | cannot satisfy canonical account/entity resolution |
| `ProjectAccessPolicy` | allows admin or `user.sub === project.createdById` | `OBJECT-LOCAL EXISTING POLICY` | does not establish entity representation |
| Public Post ownership | author/admin checks based on `authorUserId` and account role | `SOURCE-LOCAL EXISTING POLICY` | cannot resolve acting entity or Response authority |
| Invitation/Proposal checks | compare Profile user and project creator to account ID | `CURRENT DOMAIN POLICY` | Profile/account shortcuts cannot become Participation authority |
| `AuditLog` | actor user, entity/action, before/after, metadata, request ID | `FOUNDATION WITH GAPS` | lacks first-class acting entity, relationship, revision, delegation, scope, and outcome fields |
| `SecurityEvent` | records auth/RBAC denials and request context | `FOUNDATION WITH GAPS` | may support security outcomes but does not replace domain resolution audit |
| onboarding identity selection | creates/loads Professional and Company identity data | `ENTITY DISCOVERY INPUT` | onboarding state/selection is not current authority |
| verification status | records identity/company verification | `POLICY INPUT` | verification is not representation authority |

### Reusable Foundations

The following may be reused by a future separately approved implementation:

1. `JwtGuard` account validation and fresh `User` lookup.
2. `User.id` as authenticated account identity.
3. `IdentityProfile.id` as the provisional Professional entity mapping, subject to owner approval.
4. `IdentityCompanyProfile.id` as the provisional Company entity mapping, subject to relationship/revision support.
5. request ID, IP address, and user-agent extraction from `AuditService`.
6. existing audit/security event patterns as implementation references.
7. domain-local target and lifecycle checks after authority resolution.

Reuse does not upgrade a record or guard into canonical authority.

### Baseline Evidence Index

| Evidence | Current responsibility |
|---|---|
| `apps/admin/api/src/auth/jwt.guard.ts` | JWT verification, current User lookup, suspended-account denial, account request context |
| `apps/admin/api/src/auth/roles.guard.ts` | account-role allowlist and SUPERADMIN bypass |
| `apps/admin/api/src/access-control/permissions.guard.ts` | broad role-permission checks and RBAC denial audit |
| `apps/admin/api/src/access-control/access-control.constants.ts` | current generic role-to-permission defaults |
| `apps/admin/api/src/auth/firebase-auth.guard.ts` | deprecated Firebase Actor authentication track |
| `apps/admin/api/src/auth/platform-roles.guard.ts` | legacy Actor platform-role checks |
| `apps/admin/api/src/projects/project-access.policy.ts` | account/admin Project ownership checks |
| `apps/admin/api/src/public-posts/public-posts.service.ts` | account-based Public Post authorship and moderation checks |
| `apps/admin/api/src/projects/project-invitations.service.ts` | Profile owner and Project creator Invitation checks |
| `apps/admin/api/src/projects/project-proposals.service.ts` | Profile/account and Project creator Proposal checks |
| `apps/admin/api/src/onboarding/onboarding.service.ts` | Professional/Company identity creation and legacy Profile synchronization |
| `apps/admin/api/src/audit/audit.service.ts` | generic audit/security event persistence and request-context extraction |
| `apps/admin/api/prisma/schema.prisma` | User, identity, Profile, Actor, role permission, audit, and session records |

### Prohibited Authority Shortcuts

| Shortcut | Why it is unsafe | Required classification |
|---|---|---|
| `request.user.sub` equals entity owner field | proves an account link only; no revision, scope, delegation, or action validation | never sufficient alone |
| `User.role` is EMPLOYER/CONTRACTOR/ADMIN | account role is not entity representation | role may be policy input only |
| generic `Permission.WRITE` | no domain action or object scope | prohibited for protected actions |
| `Profile.userId` match | legacy one-profile ownership may collapse Professional/Company modes | prohibited as canonical entity authority |
| `IdentityProfile.userId` match | candidate direct Professional relationship, but unrevisioned | relationship input only |
| `IdentityCompanyProfile.ownerUserId` match | candidate Company ownership, but no relationship lifecycle/revision/delegation | relationship input only |
| Project `createdById` match | object ownership check, not entity authority | Project-local policy only |
| Public Post `authorUserId` match | source ownership check, not acting-entity resolution | Opportunity-local policy only |
| accepted Invitation/Proposal | workflow fact, not entity authority | prohibited |
| active Participation | scoped eligibility, not representation | prohibited |
| Conversation membership | communication access only | prohibited |
| verification/approval status | trust/policy fact, not representation | prohibited |
| subscription entitlement | commercial entitlement, not authority | prohibited |
| UI mode or route | presentation/navigation state | prohibited |
| Combined Mode | aggregation only | always reject |
| legacy `Actor`/Firebase context | separate deprecated identity track | prohibited for canonical writes |
| SUPERADMIN bypass | administrative platform power is not silent entity representation | requires explicit separately governed override policy; absent by default |

### Current Ambiguity Sources

- one account can own a Professional identity and multiple Company identities
- legacy `Profile` can represent different profile types under one user link
- current request context carries account and role, not selected entity
- current Company ownership has no authority revision
- current role permissions are broad and account-scoped
- Project/Public Post ownership is stored against account IDs
- legacy Firebase Actor IDs may appear in `request.user.sub` on legacy routes
- development authentication bypasses can create elevated test contexts
- no canonical Institution entity exists

Any protected write receiving one of these ambiguous contexts must fail closed.

## D. WP G10B-B Canonical Resolution Contract

### Resolution Input

The future resolution boundary receives:

```text
AuthorityResolutionRequest {
  accountId: trusted authenticated User ID
  requestedActingEntity: {
    entityType: PROFESSIONAL | COMPANY | INSTITUTION
    entityId: canonical entity ID
  }
  requestedAction: action-specific permission
  target: {
    domain: domain name
    objectType: object type
    objectId: object ID or null for create
  }
  presentedAuthorityRevision: optional stale-detection hint
  presentedDelegationId: optional delegation selection hint
  requestId: request identifier
  correlationId: optional cross-domain identifier
}
```

Only `accountId` from trusted authentication is authoritative at input. Entity, revision, and delegation inputs request a resolution and must be checked against owner truth.

### Canonical `AuthorityResolutionResult`

```text
AuthorityResolutionResult {
  decision: ALLOW | DENY | UNRESOLVED

  accountId: trusted User ID
  actingEntityType: PROFESSIONAL | COMPANY | INSTITUTION | null
  actingEntityId: canonical entity ID | null

  relationshipId: owner-issued relationship ID | null
  authorityRevision: owner-issued current revision | null
  delegationId: validated delegation ID | null
  delegationChainReference: validated chain reference | null

  resolvedActionScope: action-specific scope | null
  targetObjectScope: validated domain/object scope | null
  resolutionTimestamp: timestamp
  validUntil: optional earliest expiry boundary

  denialCategory: safe category | null
  ambiguityClassification: safe classification | null

  authorityOwner: owner identifier
  policyVersion: resolution policy/version reference
  requestId: request identifier
  correlationId: optional correlation identifier
}
```

### Result Invariants

An `ALLOW` result is valid only when:

- account identity is current and active
- exactly one acting entity is resolved
- entity type and ID match canonical identity truth
- one active Authority Relationship is selected
- current authority revision is known
- action scope includes the requested action
- target scope includes the requested object or create boundary
- delegation, when used, is valid, unexpired, unrevoked, and no broader than its source
- no conflict or ambiguity remains
- resolution is fresh at the protected boundary
- required resolution audit can be recorded

`ALLOW` does not grant authority permanently. It describes one validated decision for one action, entity, target, policy version, and time boundary.

`DENY` is a resolved negative result.

`UNRESOLVED` means owner truth, uniqueness, freshness, or required evidence could not be established. `UNRESOLVED` always blocks execution.

### Safe Denial Categories

- `ACCOUNT_UNAUTHENTICATED`
- `ACCOUNT_INACTIVE`
- `ACTING_ENTITY_REQUIRED`
- `ACTING_ENTITY_INVALID`
- `COMBINED_MODE_PROHIBITED`
- `ENTITY_UNSUPPORTED`
- `ENTITY_NOT_FOUND_OR_NOT_VISIBLE`
- `RELATIONSHIP_NOT_FOUND_OR_NOT_AUTHORIZED`
- `RELATIONSHIP_REVOKED`
- `AUTHORITY_REVISION_STALE`
- `ACTION_SCOPE_DENIED`
- `TARGET_SCOPE_DENIED`
- `DELEGATION_INVALID`
- `DELEGATION_EXPIRED`
- `DELEGATION_REVOKED`
- `AUTHORITY_AMBIGUOUS`
- `AUTHORITY_CONFLICT`
- `AUTHORITY_SOURCE_UNAVAILABLE`
- `AUTHORITY_UNRESOLVED`
- `AUDIT_UNAVAILABLE`

External responses must avoid disclosing unrelated entity, relationship, delegation, or target existence.

### Ambiguity Classifications

| Classification | Meaning |
|---|---|
| `MULTIPLE_ENTITY_MATCHES` | request cannot resolve one canonical entity |
| `MULTIPLE_ACTIVE_RELATIONSHIPS` | more than one relationship could satisfy the action without explicit policy |
| `MULTIPLE_DELEGATION_PATHS` | delegation chain is not uniquely resolvable |
| `IDENTITY_MODEL_CONFLICT` | Professional/Company/legacy Profile/Actor records disagree |
| `ACCOUNT_CONTEXT_CONFLICT` | JWT account and legacy actor/session identity conflict |
| `TARGET_SCOPE_CONFLICT` | action scope and target-object scope disagree |
| `REVISION_CONFLICT` | presented and owner-current revisions differ |
| `UNSUPPORTED_ENTITY_MAPPING` | entity type is canonical but has no approved runtime backing |

Ambiguity is never resolved by choosing the first record, newest record, UI-selected mode, broadest role, or highest privilege.

## E. Entity Mapping Contract

### Professional

Provisional canonical mapping: `IdentityProfile.id`.

Required future relationship semantics:

- account is linked to the Professional entity through one owner-issued relationship
- self-owned Professional authority is explicit, revisioned, revocable, and action scoped
- `IdentityProfile.userId` may seed relationship establishment but cannot replace the relationship result
- legacy `Profile.id` cannot substitute

Readiness: `READY FOR SCHEMA/API PLANNING; NOT RUNTIME-READY`.

### Company

Provisional canonical mapping: `IdentityCompanyProfile.id`.

Required future relationship semantics:

- owner, representative, delegated administrator, reviewer, publisher, and other scopes remain distinct
- `ownerUserId` may seed an owner relationship but cannot replace revisioned action authority
- multiple Company identities require explicit entity selection
- Company verification and subscription do not create representation authority

Readiness: `READY FOR SCHEMA/API PLANNING; NOT RUNTIME-READY`.

### Institution

Current mapping: none approved.

Rules:

- Institution cannot map to Company, Profile, Actor, role, email domain, or public organization label
- Institution writes return `ENTITY_UNSUPPORTED` or safe equivalent
- Institution reads may use separately approved public/read models but do not create write authority
- no fallback to Professional or Company is allowed

Readiness: `UNSUPPORTED; FAIL CLOSED`.

### Combined Mode

Current and future mapping: none.

Rules:

- never an entity type
- never a relationship owner
- never an authority source
- never a resolver input except as an invalid value
- never converted automatically to Professional or Company

Readiness: `PROHIBITED`.

## F. WP G10B-C Fail-Closed Matrix

| Condition | Resolution result | Protected-write behavior | Recovery |
|---|---|---|---|
| missing account | deny `ACCOUNT_UNAUTHENTICATED` | no mutation | authenticate |
| suspended/inactive account | deny `ACCOUNT_INACTIVE` | no mutation | account-owner recovery |
| missing acting entity | deny `ACTING_ENTITY_REQUIRED` | no mutation | explicit selection, full resolution |
| Combined Mode | deny `COMBINED_MODE_PROHIBITED` | no mutation | select one supported entity |
| invalid entity type/ID | deny safe invalid/not-visible category | no mutation, no existence leak | correct selection |
| unsupported Institution write | deny `ENTITY_UNSUPPORTED` | no mutation | wait for approved backing |
| unresolved ownership | unresolved | no mutation | owner-data correction and re-resolution |
| missing relationship | deny safe relationship category | no mutation | establish approved relationship |
| revoked relationship | deny `RELATIONSHIP_REVOKED` | no mutation; cached context invalid | select another valid entity or restore through owner process |
| stale authority revision | deny `AUTHORITY_REVISION_STALE` | no mutation | discard context and fully re-resolve |
| missing action scope | deny `ACTION_SCOPE_DENIED` | no mutation | obtain separately authorized scope |
| target outside scope | deny `TARGET_SCOPE_DENIED` | no mutation | correct target or authority |
| delegation missing/invalid | deny `DELEGATION_INVALID` | no mutation | full chain re-resolution |
| delegation expired | deny `DELEGATION_EXPIRED` | no mutation | new valid delegation |
| delegation revoked | deny `DELEGATION_REVOKED` | no mutation | invalidate chain; no fallback |
| multiple entity matches | deny `AUTHORITY_AMBIGUOUS` | no mutation | explicit canonical entity |
| multiple valid relationships | deny `AUTHORITY_AMBIGUOUS` unless owner policy selects uniquely | no mutation | explicit policy/resolution |
| conflicting account/Actor context | deny `AUTHORITY_CONFLICT` | no mutation | use canonical JWT account context |
| unavailable authority source | unresolved `AUTHORITY_SOURCE_UNAVAILABLE` | no mutation | retry only after owner source recovery |
| incomplete resolution evidence | unresolved `AUTHORITY_UNRESOLVED` | no mutation | complete owner evidence |
| audit path unavailable | deny `AUDIT_UNAVAILABLE` | no protected mutation | restore required audit capability |
| result expired before commit | stale/unresolved | no mutation | re-resolve immediately |

### Stale-Context Rules

- client or session authority hints are never sufficient
- authority revision is compared to current owner truth
- acting-entity switching invalidates prior results
- account/session change invalidates prior results
- target/action change invalidates prior results
- relationship/delegation change invalidates prior results
- retry restarts full resolution
- a prior `ALLOW` cannot authorize a later request
- the write-owning domain must reject a result outside its validity boundary

### Revocation Rules

- relationship revocation blocks future protected actions immediately at validation time
- delegation revocation invalidates that chain and dependent scopes
- revocation does not transfer authority to another entity or account
- revocation does not delete prior audit or domain history
- no resolver may fall back to account role, ownership shortcut, or another relationship without explicit selection and validation

### Administrative Override

No implicit SUPERADMIN entity-representation override is approved.

Any future emergency/admin override requires:

- a separate action-specific policy
- explicit target entity and object
- reason and elevated audit
- bounded duration/scope
- no silent use of normal entity actions

Until approved, administrators may perform existing platform administration only and cannot silently act as a Professional, Company, or Institution in protected Response/Participation writes.

## G. Resolution Sequence

The future protected boundary must perform:

1. authenticate and load the current account
2. validate account lifecycle/session
3. parse exactly one requested entity
4. reject Combined Mode and unsupported mappings
5. load canonical entity truth
6. resolve active account-to-entity relationship
7. load current authority revision
8. validate presented revision for stale-context detection
9. resolve and validate delegation chain when requested/required
10. validate action-specific scope
11. validate target-object scope
12. classify conflicts or ambiguity
13. produce and audit `ALLOW`, `DENY`, or `UNRESOLVED`
14. let the write-owning domain validate its lifecycle/object policy
15. re-check freshness immediately before protected commit

Authentication, authority resolution, and domain authorization remain separate decisions.

## H. WP G10B-D Audit Readiness Mapping

### Required Audit Fields

Every resolution attempt must make the following auditable:

- event ID and timestamp
- request ID and correlation ID
- authenticated account ID, when known
- requested acting entity type and ID
- resolved acting entity type and ID, when any
- requested action
- target domain, type, and safe target reference
- relationship ID, when visible to trusted audit
- current and presented authority revisions
- delegation ID and chain reference, when used
- resolved action scope and target scope category
- decision: `ALLOW`, `DENY`, or `UNRESOLVED`
- safe denial category
- ambiguity classification
- authority owner and policy version
- result expiry/valid-until boundary
- source availability state
- IP/user-agent/request context under approved privacy policy

### Outcome Matrix

| Outcome | Minimum audit requirement | Severity guidance |
|---|---|---|
| success | entity, relationship, revision, action, target scope, policy version, timestamp | informational/protected-action evidence |
| denial | safe category, attempted entity/action/target, account when known | warning where policy/security relevant |
| stale | current versus presented revision category; never expose sensitive revision details externally | warning |
| revoked | relationship/delegation revocation category and attempted action | warning or critical by action |
| conflict | conflicting context classification and sources involved | warning |
| ambiguous | ambiguity classification and candidate count/category without sensitive disclosure | warning |
| unavailable | unavailable owner/source category and fail-closed result | operational warning |
| unresolved | missing evidence/category and fail-closed result | warning |

### Current Audit Readiness

`AuditLog`, `SecurityEvent`, and `AuditService` are reusable foundations for request context and generic event storage.

They are not yet sufficient proof because:

- acting entity is not first class
- Authority Relationship and revision are not first class
- delegation chain is not first class
- action/target scopes are not first class
- `ALLOW`/`DENY`/`UNRESOLVED` semantics are not standardized
- ambiguity classification is absent
- retention/redaction policy remains unresolved

Audit persistence design remains blocked under G.10A B2/B3.

## I. Validation and Proof Requirements

A future authority-resolution implementation must prove:

- valid Professional self-relationship
- valid Company owner/representative relationship
- explicit choice among multiple Companies
- missing entity denial
- Combined Mode denial
- Institution denial
- missing/revoked relationship denial
- stale revision denial and re-resolution
- action-scope denial
- target-scope denial
- valid, expired, revoked, circular, over-broad, and ambiguous delegation behavior
- account/legacy Actor conflict denial
- owner-source unavailable fail-closed behavior
- audit unavailable fail-closed behavior
- no existence leak
- no SUPERADMIN implicit representation
- audit records for every outcome category
- result freshness check before commit

These are future proof requirements, not tests run in G.10B.

## J. WP G10B-E Implementation Readiness Verdict

| Readiness question | Verdict |
|---|---|
| owner boundaries documented | `READY` |
| current baseline classified | `READY` |
| entity mappings classified | `READY FOR PLANNING` |
| canonical result contract | `READY FOR PLANNING` |
| fail-closed semantics | `READY` |
| audit requirements | `READY FOR AUDIT DESIGN` |
| schema/API planning for authority resolution | `READY WITH RISKS` |
| runtime authority resolution | `BLOCKED` |
| protected Response writes | `NOT AUTHORIZED` |
| protected Participation writes | `NOT AUTHORIZED` |
| EXEC-78G.11 | `BLOCKED - NOT AUTHORIZED` |

G.10A blocker B1 is closed at the architecture-contract level only.

B1 remains open at the executable prerequisite level until a separately authorized phase implements and proves:

- canonical Authority Relationship storage/source
- authority revisions
- action/target scopes
- delegation validation
- trusted resolution boundary
- complete outcome audit

Closing this contract does not close G.10A blockers B2, B3, or B4.

## K. Risk Inventory

| Risk | Severity | Contract control | Remaining risk |
|---|---|---|---|
| account authentication is mistaken for entity authority | critical | explicit three-stage separation | current services often use account ownership |
| `ownerUserId` becomes permanent authority shortcut | critical | relationship input only | no relationship model exists |
| legacy Profile collapses entity modes | critical | prohibited mapping | legacy flows remain |
| Firebase Actor contaminates canonical context | critical | legacy isolation and conflict denial | two auth tracks coexist |
| broad role/permission grants protected write | critical | action/object scope required | current RBAC remains broad |
| SUPERADMIN silently impersonates entity | critical | no implicit override | existing admin bypass patterns exist |
| multiple Companies resolve by first record | critical | ambiguity denial | onboarding commonly reads first Company |
| stale authority reused | critical | owner revision and per-request freshness | revisions absent |
| delegation widens source authority | critical | chain must narrow and validate | delegation runtime absent |
| Institution maps to Company | critical | unsupported/fail closed | Institution model absent |
| audit metadata is incomplete or unqueryable | high | mandatory outcome fields | audit design blocked |
| unavailable owner source fails open | critical | `UNRESOLVED` blocks mutation | runtime resolver absent |

## L. Recommendations

1. Use this contract as the acceptance baseline for a separately approved authority-resolution schema/API planning phase.
2. Keep `JwtGuard` as account authentication, not entity authority.
3. Approve Professional and Company physical relationship mappings before implementation.
4. Keep Institution and Combined Mode fail-closed.
5. Design authority revision and delegation together; neither can be retrofitted safely after protected writes.
6. Close audit persistence and retention blockers before any authority resolver becomes executable.
7. Add no Response or Participation code until G.11 receives separate authorization.

## M. Validation

### Scope Validation

| Constraint | Result |
|---|---|
| routes/APIs/controllers/services/DTOs | NONE |
| Prisma/schema/migrations | NONE |
| permissions/runtime logic | NONE |
| UI/deployment artifacts | NONE |
| Response implementation | NONE |
| Participation implementation | NONE |
| G.11 implementation/authorization | NONE |

### Success-Criteria Validation

| Criterion | Result |
|---|---|
| owner boundaries documented | PASS |
| entity mappings classified | PASS |
| identity shortcuts classified and risk-assessed | PASS |
| Institution fail-closed | PASS |
| stale authority behavior | PASS |
| revoked authority behavior | PASS |
| ambiguous authority behavior | PASS |
| unsupported/unavailable authority behavior | PASS |
| all resolution outcomes mapped to audit | PASS WITH RISKS |
| Response/Participation remain unauthorized | PASS |
| G.11 remains blocked | PASS |

Build, lint, tests, Prisma validation, browser automation, API proof, and deployment were not run because this phase changed documentation only and prohibited implementation.

## N. Final Verdict

Verdict: `PASS WITH RISKS`.

The trusted authority-resolution prerequisite is now unambiguous and ready for schema/API planning. Current identity, role, permission, ownership, Profile, Project, and Actor shortcuts are classified and prohibited from independently authorizing protected writes. Missing, stale, revoked, ambiguous, conflicting, unsupported, unavailable, and unresolved contexts fail closed.

Runtime authority resolution remains `BLOCKED`.

Response implementation remains `NOT AUTHORIZED`.

Participation implementation remains `NOT AUTHORIZED`.

`EXEC-78G.11` remains `BLOCKED - NOT AUTHORIZED`.
