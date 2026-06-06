# EXEC-78F.1A Authenticated Shell Implementation Readiness & Delivery Plan

Date: 2026-06-06

Verdict: `PASS WITH RISKS`

Status: implementation-readiness and delivery planning only. No UI, routes, APIs, database schema, permissions, guards, authentication, authorization, deployment, infrastructure, build, lint, tests, or implementation were changed or run.

## 1. Executive Readiness Assessment

EXEC-78F.1A converts the binding EXEC-78F.0B, F.0C, F.0D, and F.0E contracts into a conservative implementation sequence for the first authenticated shell delivery.

The approved implementation posture is:

- implement a persistent authenticated frame around existing routes
- expose only production-ready destinations
- preserve existing route, authentication, onboarding, and deep-link behavior
- treat navigation as presentation only
- keep acting-entity presentation non-authoritative
- add no new entity-owned write behavior
- use the Notification domain as the sole unread truth
- keep Dashboard summary-oriented
- route Workspace entry to the existing `/projects` execution surface
- keep RELU inside its current owning workflows
- expose no global Search

F.1 is not ready to implement:

- authoritative acting-entity switching
- Combined execution
- authority/delegation/scope enforcement
- new Company or Institution writes
- global Search
- new Workspace aggregate modules
- new Dashboard aggregation
- new procurement or Institution surfaces
- notification count synthesis

The shell can be implemented safely only within those limits.

## 2. Binding Inputs

### EXEC-78F.0B

Binding shell invariants:

- no global Search
- unfinished modules hidden
- explicit acting entity for writes
- contextual RELU only
- existing route behavior preserved
- Notification domain owns Delivery Truth and Unread Truth
- Shell owns orientation, context presentation, entry, and status only

### EXEC-78F.0C

Binding context rules:

- Identity/Session domain owns authority truth
- browser context is only an untrusted per-tab hint
- navigation state and authority state are independent
- Combined is selection/aggregation only
- writes fail closed without complete authority resolution
- deep links do not silently switch authority

### EXEC-78F.0D

Binding execution rules:

- Workspace coordinates execution
- Workspace does not own every operational object
- Dashboard summarizes; Workspace executes
- Projects, Contracts, Documents, Compliance, Messages, Notifications, and Audit retain domain ownership

### EXEC-78F.0E

Binding authority rules:

- representation, delegation, participant role, and Execution Scope are separate
- delegation only narrows authority
- Project role does not imply signatory/delegation/Compliance authority
- no new write may bypass acting-entity and scope resolution
- the ten F.1 acceptance rules are mandatory

No F.1 implementation decision may weaken these contracts.

## 3. Area Readiness Matrix

| Area | Readiness | Current foundation | Blockers | Dependencies | Risk |
|---|---|---|---|---|---|
| Shell | READY WITH CONSTRAINTS | `AppShell`, `Header`, `Navbar`, `Footer`, `MobileNavigation`, root layout | authenticated/public mode separation and stable responsive frame not implemented | AuthContext, route classification, existing UI config | high |
| Navigation | READY WITH CONSTRAINTS | existing public nav and authenticated routes | no canonical authenticated nav builder; unfinished destinations must remain hidden | Shell, AuthContext, route inventory | high |
| Acting Entity Context | PRESENTATION ONLY | `AuthUser.identityState`, Professional/Company/Both onboarding state | no authoritative persistence, relationship, revision, delegation, or scope model | Identity/Session domain, F.0C/F.0E future implementation | critical |
| Notifications | ENTRY READY; BADGE CONDITIONAL | `/notifications`, project notifications, message unread concepts | single authorized unread source and deduplication not proven for shell | Notification domain | high |
| Dashboard | EMBEDDING READY; EXPANSION DEFERRED | existing `/dashboard` account/profile/listing status | no aggregate read model for Workspace, Compliance, Messages, Assets, RELU | source modules and future Dashboard read model | medium/high |
| Workspace Entry | READY AS EXISTING DESTINATION | `/projects`, `/projects/[id]`, `/messages` | no canonical Workspace Home or aggregate submodules | Project domain and route-preservation rules | medium |
| RELU Placement | READY TO PRESERVE | contextual profile, publish, project integrations | public chatbot must not bleed into authenticated shell; no shell RELU | owning workflows | medium |
| Route Preservation | READY WITH HIGH VALIDATION | route inventory, auth redirects, onboarding routes, deep links | shell wrapper can alter active state, layout, redirects, history, mobile behavior | routing/layout implementation | high |
| Deep-Link Preservation | READY WITH HIGH VALIDATION | existing direct routes and `auth-redirect` behavior | no acting-entity deep-link resolver; new switching prohibited | Auth/session, existing routes | high |
| Session Handling | READY TO CONSUME; NOT CHANGE | `AuthContext`, token bootstrap/refresh/logout | session implementation changes are out of scope | Auth domain | high |
| Context Persistence | NOT READY FOR AUTHORITY | current local/session browser storage for unrelated state | no approved acting-entity source, revision, validation, recovery, or cross-tab invalidation | Identity/Session domain | critical |

### Readiness Interpretation

`READY WITH CONSTRAINTS` means implementation may proceed only with existing read behavior and approved presentation changes.

`PRESENTATION ONLY` means F.1 may show safe account/identity information but may not claim or persist executable authority.

`NOT READY FOR AUTHORITY` means the feature must remain absent rather than approximated.

## 4. Exact EXEC-78F.1 Scope

### In Scope

F.1 may implement:

1. A persistent authenticated shell frame using the existing root layout and shell components.
2. Clear separation between public navigation presentation and authenticated navigation presentation.
3. Authenticated destination navigation for existing stable routes only.
4. Desktop and mobile navigation grouping using the same destination contract.
5. Existing account/avatar, logout, language, and security entry behavior.
6. A non-authoritative account/identity indicator based on existing authorized `AuthUser` data.
7. A Notifications destination entry without a badge unless one authorized unread source is confirmed.
8. A Messages destination entry without synthesizing unread truth.
9. Existing `/dashboard` rendered inside the shell without adding unscoped aggregation.
10. Workspace entry mapped honestly to existing `/projects`.
11. Existing `/projects`, `/messages`, `/notifications`, `/profile`, `/publish`, `/security`, `/companies`, `/professionals`, and `/jobs` route semantics preserved.
12. Active-destination presentation derived from current route only.
13. Accessibility, responsive behavior, focus order, keyboard navigation, and mobile overflow work required for the shell.
14. Automated and manual validation for route, auth, deep-link, navigation, and responsive regressions.

### Approved Destination Set

The first authenticated destination set should use existing routes:

| Label | Existing destination | Treatment |
|---|---|---|
| Dashboard | `/dashboard` | permanent authenticated destination |
| Feed | `/jobs` | honest discovery label over existing behavior; no ranking changes |
| Companies | `/companies` | existing destination |
| Professionals | `/professionals` | existing destination |
| Workspace | `/projects` | entry to current Project execution; no generic Workspace claims |
| Messages | `/messages` | existing destination |
| Notifications | `/notifications` | existing destination |
| Profile | `/profile` | account/avatar or contextual destination |
| Publish | `/publish` | contextual command/destination, not universal primary nav |
| Security | `/security` | account/avatar destination |

If a label would misrepresent the existing route, the existing label must be retained until a truthful mapping is approved.

### Out of Scope

F.1 must not implement:

- new routes or aliases
- new APIs or read models
- database or schema changes
- permission, guard, authentication, or authorization changes
- authoritative acting-entity persistence
- functional Professional/Company/Institution switching
- delegation or Execution Scope enforcement
- new entity-owned writes
- Institution navigation or surfaces
- Procurement navigation or surfaces
- global Search input, shortcut, suggestions, counts, previews, or route
- Workspace Contracts/Documents/Compliance aggregate destinations
- generic Governance navigation
- RELU primary navigation, floating assistant, or shell assistant
- Dashboard task execution or broad operational aggregation
- Contract, Compliance, Document, or collaboration content in the shell
- notification count aggregation across Messages, Dashboard, and Workspace
- route semantic changes
- visual redesign of individual business surfaces

### Deferred

Deferred to later approved phases:

- acting-entity source of truth and context revision
- entity switcher persistence, validation, and recovery
- Company/Institution representative hierarchy
- authority relationship, delegation, and scope storage
- canonical `/feed`, `/opportunities`, `/workspace`, `/settings`, and `/search`
- first-class Institution and Procurement
- Workspace Home and aggregate modules
- Dashboard aggregate read model
- notification deduplication and cross-tab synchronization
- paid/enterprise navigation gates
- taxonomy/feed/search redesign
- no-leak global Search implementation
- shell-level authorized status indicators beyond proven sources

## 5. Work Package Breakdown

### WP0 - Baseline & Contract Lock

Objective:

- establish a testable pre-change baseline and implementation checklist

Dependencies:

- F.0B-F.0E contracts
- F.0 route inventory
- existing local development/test tooling

Deliverables:

- route and deep-link baseline
- authenticated/public layout inventory
- desktop/mobile screenshots
- current redirect and browser-history expectations
- approved destination allowlist
- forbidden destination denylist

Risk: medium.

Acceptance criteria:

- all current routes and redirects are documented before edits
- critical Rules 3, 4, 6, and 8 are explicit stop conditions
- no implementation begins without a rollback reference

### WP1 - Authenticated Shell Frame

Objective:

- create a stable authenticated presentation frame without changing route semantics

Dependencies:

- WP0
- existing `AuthContext`
- current `AppShell`, root layout, Header, Footer, MobileNavigation

Allowed work:

- authenticated/public shell mode selection
- stable header/content/footer/mobile frame
- route-safe loading behavior while auth initializes
- responsive layout and accessibility

Forbidden work:

- auth/session changes
- new redirects
- global Search
- Workspace content inside shell

Risk: high.

Acceptance criteria:

- authenticated routes share a persistent frame
- public routes preserve public presentation
- auth-loading state does not flash unauthorized destinations
- browser back/forward and direct deep links remain correct
- shell contains orientation and entry points only

Rollback unit:

- authenticated shell-mode changes can be reverted independently without touching domain pages

### WP2 - Navigation Layer

Objective:

- implement destination-only authenticated navigation over existing routes

Dependencies:

- WP1
- route allowlist
- hidden-module denylist

Allowed work:

- desktop/mobile destination groups
- active destination state
- avatar/account menu grouping
- truthful current-route labels

Risk: high.

Acceptance criteria:

- only approved existing destinations appear
- Institution, Procurement, Search, Governance, unsupported Workspace aggregates, and internal tools are absent
- no disabled or teaser entries exist
- navigation selection performs routing only
- nav visibility is not used as permission evidence
- mobile and desktop exposure rules match

Rollback unit:

- authenticated navigation configuration/component changes

### WP3 - Acting Entity Presentation

Objective:

- distinguish signed-in account identity from available identity information without creating executable authority

Dependencies:

- WP1
- existing authorized `AuthUser` fields
- F.0C/F.0E terminology

Allowed work:

- account name/avatar presentation
- read-only identity summary
- clear Professional/Company/Both identity wording when supported by existing data

Forbidden work:

- functional acting-entity switcher
- persisted acting-entity selection
- authority claims
- Institution mode
- Combined execution
- write attribution changes

Risk: critical.

Acceptance criteria:

- presentation explicitly distinguishes account from identity
- Combined is never shown as an execution actor
- no control suggests that choosing a label grants authority
- no new write behavior depends on shell state

Rollback unit:

- identity presentation block only

### WP4 - Notification & Message Entry

Objective:

- add reliable shell entry points to existing Notifications and Messages surfaces

Dependencies:

- WP1/WP2
- Notification domain
- existing `/notifications` and `/messages`

Allowed work:

- destination icons/labels
- unread badge only from a single existing recipient-authorized source
- severity-safe indicator only if already supported

Forbidden work:

- combining message, task, Dashboard, or project counts
- shell-calculated unread truth
- sensitive previews
- context switching from notifications

Risk: high.

Acceptance criteria:

- shell entry routes correctly
- no hidden count or sensitive preview
- badge omitted when single truth cannot be proven
- read/dismiss behavior remains owned by Notifications

Rollback unit:

- badge integration separate from basic destination entry

### WP5 - Dashboard Integration

Objective:

- preserve the existing Dashboard as an operational summary destination within the shell

Dependencies:

- WP1/WP2
- existing Dashboard behavior

Allowed work:

- shell spacing/layout compatibility
- destination highlighting
- safe links from current Dashboard to owning routes

Forbidden work:

- new aggregate read model
- raw Workspace/Contract/Compliance/Message data
- executing domain actions from shell or generic widgets
- speculative empty widgets

Risk: medium/high.

Acceptance criteria:

- existing Dashboard functions remain unchanged
- Dashboard shows no raw restricted content added by F.1
- actions route to owning surfaces
- Dashboard does not become Workspace

Rollback unit:

- shell/Dashboard integration styling and navigation state

### WP6 - Workspace Entry & Handoff Validation

Objective:

- expose current Project execution honestly as the initial Workspace entry without changing execution behavior

Dependencies:

- WP2
- current `/projects` and project deep links
- F.0D boundaries

Allowed work:

- Workspace navigation destination to `/projects`
- truthful label/supporting context
- active-route recognition for `/projects/*`

Forbidden work:

- new `/workspace` routes
- new handoff records
- Contract/Documents/Compliance aggregate navigation
- Project lifecycle or participant changes

Risk: medium.

Acceptance criteria:

- Workspace navigation reaches existing `/projects`
- `/projects/new`, `/projects/[id]`, and edit/deep links preserve behavior
- shell does not display operational contents
- Project execution remains Project-domain-owned

Rollback unit:

- Workspace destination mapping and active-state rules

### WP7 - Route, Deep-Link & Regression Validation

Objective:

- prove the shell introduces no route, authority, visibility, or ownership regression

Dependencies:

- WP1-WP6
- baseline from WP0

Risk: critical.

Acceptance criteria:

- all ten F.1 rules pass
- public/auth/onboarding/authenticated route matrix passes
- direct deep links and browser navigation pass
- no unfinished module or global Search exposure
- no new write path or acting-entity authority is introduced
- desktop/mobile accessibility and overflow checks pass
- failure of any critical rule blocks release

Rollback unit:

- each prior work package can be disabled/reverted independently

## 6. Dependency Matrix

| Dependency | Owner | F.1 use | Required before F.1 | Blocked/deferred behavior |
|---|---|---|---|---|
| Identity Domain | Identity/Profile domains | authorized account and existing identity summary | stable current `AuthUser` contract | authority relationships, Institution, delegation |
| Session Domain | Auth domain | existing bootstrap, refresh, logout, loading state | preserve current behavior | acting-entity persistence/revision/recovery |
| Notification Domain | Notification service/module | Notifications entry; optional proven unread count | recipient-authorized single truth | synthesized badges, dedup redesign |
| Workspace | Project/Workspace domains | entry to existing `/projects` | route behavior and deep links preserved | Workspace Home/aggregate modules |
| Dashboard | Dashboard module | existing page inside shell | existing read behavior preserved | broad aggregation/read model |
| Messages | Messaging domain | existing destination | route and thread behavior preserved | shell-owned previews/count synthesis |
| Compliance | Compliance domain | links/current source behavior only | public/authenticated distinction preserved | aggregate governance execution |
| RELU | owning workflow modules | preserve contextual modules | no shell-level RELU | assistant/nav/global presence |
| Search | future Search domain | none | not required because hidden | all global Search behavior |
| Companies/Professionals | entity/profile domains | existing discovery destinations | public visibility behavior preserved | new entity authority/hubs |
| Routes/Layout | web shell/routing owner | authenticated frame and active destination | route allowlist and regression matrix | route migration/aliases |

### Dependency Ownership Rule

F.1 may consume current authorized outputs. It may not compensate for a missing domain contract by inventing state in the shell.

## 7. Acceptance Matrix

| Rule | Implementation impact | Validation method | Failure condition |
|---|---|---|---|
| 1. Authenticated Persistent Shell | wrap authenticated routes in stable frame after auth readiness | direct navigation across authenticated routes; refresh; desktop/mobile screenshots | frame disappears unexpectedly, flashes unauthorized nav, or changes route semantics |
| 2. Navigation Is Destination Only | nav contains links and presentation, no authorization logic | code review and route-click matrix | nav state grants/enables domain action or is treated as permission proof |
| 3. Unfinished Modules Hidden | strict allowlist; no disabled/future entries | DOM/link inventory on desktop/mobile | Institution, Procurement, Search, Governance, unsupported Workspace/internal route appears |
| 4. Explicit Acting Entity Required | no new entity-owned writes; presentation non-authoritative | code review of new handlers and write calls | any new write executes from shell/account/Combined state without F.0C resolution |
| 5. Combined Mode Cannot Execute | Both/Combined displayed only as summary | UI inspection and write-handler review | Combined appears as action owner or enables write |
| 6. No Global Search Exposure | remove/omit global Search from authenticated shell | DOM, keyboard shortcut, focus, route/link inspection | search input, suggestion, preview, count, shortcut, or discovery link appears |
| 7. RELU Remains Contextual | shell has no RELU assistant/nav; current modules preserved | route and component inventory | floating/persistent assistant or RELU primary destination appears |
| 8. Shell Does Not Absorb Workspace | shell contains orientation/navigation/status only | visual/code ownership review | documents, contracts, tasks, evidence, or collaboration render in shell |
| 9. Single Notification Truth | badge uses one authorized source or is omitted | compare shell and Notifications state; read/dismiss checks | shell synthesizes/diverges counts or leaks sensitive preview |
| 10. Route Behavior Preserved | no route/redirect/guard changes; wrapper only | automated route/deep-link/back-forward/auth matrix | redirect, deep link, auth flow, history, or route purpose changes |

### Critical Stop Conditions

Implementation and release stop immediately if:

- any unfinished module is exposed
- any new write lacks explicit acting-entity resolution
- any global Search experience is exposed
- the Shell absorbs Workspace responsibilities

## 8. Rollout Strategy

### Phase 1 - Shell Foundation

Work:

- WP0 baseline
- WP1 authenticated/public shell separation

Release gate:

- route/auth/deep-link smoke matrix passes

Rollback:

- revert authenticated shell-mode wrapper while retaining unchanged domain pages

### Phase 2 - Navigation Integration

Work:

- WP2 destination navigation
- WP3 non-authoritative identity presentation

Release gate:

- hidden-module inventory, mobile/desktop navigation, active state, and no-write review pass

Rollback:

- restore previous Navbar/MobileNavigation configuration independently from shell frame

### Phase 3 - Notification Integration

Work:

- WP4 Notifications and Messages entry
- badge only if single truth is proven

Release gate:

- recipient authorization, unread consistency, and redaction checks pass

Rollback:

- remove badge first; preserve plain destination entry
- revert entry integration if route behavior regresses

### Phase 4 - Dashboard Integration

Work:

- WP5 existing Dashboard compatibility

Release gate:

- current Dashboard behaviors and visibility remain unchanged

Rollback:

- revert Dashboard-specific shell styling/active-state integration

### Phase 5 - Workspace Handoff Validation

Work:

- WP6 `/projects` Workspace destination
- WP7 full regression validation

Release gate:

- Project deep links and all ten rules pass

Rollback:

- remove Workspace label/mapping and return to the existing Projects destination

### Rollout Principles

- one work package per reviewable change set where practical
- no mixed route migration or domain refactor
- feature/config separation for authenticated navigation where repository patterns allow
- badge integration isolated from base navigation
- each phase retains a known-good rollback point
- no deployment proceeds after a critical acceptance failure

## 9. Validation Strategy

### Architecture Validation

Review changed files against:

- F.0B Shell ownership/invariants
- F.0C context and navigation separation
- F.0D Shell/Dashboard/Workspace ownership
- F.0E authority and ten acceptance rules

Required evidence:

- changed-file ownership map
- destination allowlist/denylist
- confirmation that no domain write behavior changed

### Route Validation

Validate:

- public routes
- login/register/password/2FA/security routes
- onboarding routes
- Dashboard/Profile/Publish routes
- Companies/Professionals/Jobs
- Projects create/list/detail/edit
- Messages and Notifications
- internal/superadmin routes remain hidden from normal nav

Check:

- status/redirect result
- rendered shell mode
- active destination
- route purpose unchanged

### Deep-Link Validation

Test direct entry and refresh for:

- `/dashboard`
- `/profile`
- `/publish`
- `/projects`
- `/projects/new`
- representative `/projects/[id]`
- `/messages`
- representative `/messages/[id]`
- `/notifications`
- `/security`
- onboarding routes

Validate unauthenticated redirect and post-login return behavior without changing context or route semantics.

### Authority Validation

For F.1:

- prove no new entity-owned write handlers exist
- prove shell identity display is presentation-only
- prove Combined owns no action
- prove nav visibility is not consulted as authorization
- prove existing domain actions remain unchanged

Full F.0C/F.0E authority enforcement is deferred and must not be simulated.

### Notification Validation

Validate:

- Notifications route entry
- Messages route entry
- badge source, if any
- read/dismiss consistency
- logout/session transition
- no hidden counts
- no sensitive preview
- no count synthesis

If single unread truth cannot be proven, ship no badge.

### Navigation Validation

Validate desktop and mobile:

- approved destination inventory
- forbidden destination absence
- keyboard navigation
- focus visibility/order
- active-route highlighting
- overflow and text fit
- avatar/account menu
- public/authenticated mode separation

### Regression Validation

Planned implementation validation:

- focused component/unit tests for nav model and route classification
- existing web lint
- existing web build
- relevant existing tests
- browser automation for route/deep-link matrix
- desktop/mobile screenshots
- console/page/network error review
- browser back/forward and refresh checks
- authenticated/unauthenticated state checks

This task does not run those commands; it defines their required use during implementation.

## 10. Risk Matrix

| Risk | Likelihood | Impact | Mitigation | Release response |
|---|---|---|---|---|
| shell regression | medium | high | isolate shell mode, baseline screenshots, phased rollout | rollback WP1 |
| route regression | medium/high | critical | no route edits, deep-link/auth/history matrix | stop release |
| authority confusion | high | critical | presentation-only identity, no switcher/new writes | stop implementation path |
| notification inconsistency | medium/high | high | one source or no badge | remove badge |
| Workspace ownership drift | medium | high | `/projects` entry only; no operational content in shell | reject change |
| Dashboard ownership drift | medium | high | existing summary only; links to owners | reject widget/action |
| hidden module exposure | medium | critical | strict allowlist and DOM inventory | stop release |
| Search leakage | low if omitted | critical | no Search UI/shortcut/placeholder | stop release |
| RELU placement violation | medium | high | no shell RELU; preserve contextual modules | remove shell integration |
| auth loading flash | medium | high | defer authenticated nav until auth readiness | stop release |
| mobile navigation overload | high | medium | compact approved set and overflow menu | revise WP2 |
| misleading route label | medium | medium/high | truthful labels over existing semantics | retain existing label |
| public/auth shell bleed | medium | high | explicit route/auth shell classification | rollback classification |
| accidental domain refactor | medium | high | changed-file allowlist and package isolation | split/reject change |

## 11. Readiness Gates

| Gate | Status | Evidence |
|---|---|---|
| scope approved | PASS | exact In Scope, Out of Scope, and Deferred boundaries defined |
| work packages approved | PASS | WP0-WP7 include objective, dependencies, risk, acceptance, and rollback |
| dependency matrix approved | PASS | domain ownership and allowed F.1 consumption defined |
| acceptance matrix approved | PASS | all ten binding rules mapped to validation and failure conditions |
| validation strategy approved | PASS | architecture, route, deep-link, authority, notification, navigation, and regression plans defined |
| rollout strategy approved | PASS | five phased rollout units and rollback expectations defined |
| critical risks accepted | PASS WITH RISKS | authority persistence, notification deduplication, and domain read models constrain scope |

## 12. Final Readiness Verdict

EXEC-78F.1 is ready to begin only as a constrained authenticated shell implementation.

Approved first-release outcome:

- persistent authenticated frame
- destination-only navigation over existing routes
- hidden unfinished modules
- no global Search
- non-authoritative identity presentation
- Notifications/Messages entry with no synthetic unread truth
- current Dashboard preserved
- `/projects` used as the honest initial Workspace entry
- contextual RELU unchanged
- route/deep-link/session behavior preserved

Not approved:

- functional acting-entity switching
- new entity-owned writes
- Combined execution
- authority/delegation/scope implementation
- Institution/Procurement release
- global Search
- new Workspace or Dashboard data models
- shell-owned operational behavior

The plan is executable, phased, reversible, and aligned with every approved invariant. Residual risks remain because acting-entity persistence, authority enforcement, notification deduplication, Workspace aggregation, and Dashboard read models are not implemented.

EXEC-78F.1A PASS WITH RISKS
