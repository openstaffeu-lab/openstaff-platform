# EXEC-78F.1B Authenticated Shell Technical Baseline & Change Map

Date: 2026-06-06

Verdict: `PASS WITH RISKS`

Status: pre-implementation audit and change planning only. No UI, routes, APIs, database schema, permissions, guards, authentication, authorization, deployment, infrastructure, build, lint, tests, or implementation were changed or run.

## 1. Technical Baseline Inventory

### Shell and Shared Infrastructure

| File/component | Current purpose and behavior | F.1 modification safety | Risk | Rollback strategy |
|---|---|---|---|---|
| `apps/admin/web/app/layout.tsx` | Root Next.js layout. Installs `AuthProvider`, `UiConfigProvider`, `StatusConsoleReporter`, `AppShell`, and global `MessagingDock` for every route. | Avoid modification unless structurally unavoidable. It is the provider and global composition root. | critical | restore exact provider/component order; no provider or global component migration |
| `apps/admin/web/components/layout/AppShell.tsx` | Applies branding variables and renders one shared Header, content area, marketing Footer, and MobileNavigation for public and authenticated routes. | Primary safe F.1 integration point for public/onboarding/authenticated presentation selection. | high | revert shell-mode classification and return to the current unconditional composition |
| `apps/admin/web/components/layout/Header.tsx` | Thin sticky wrapper around `Navbar`. | Safe only for selecting/passing shell presentation concerns. It must not acquire auth, route, Workspace, or notification business logic. | medium | restore wrapper to `<Navbar />` |
| `apps/admin/web/components/Navbar.tsx` | Public marketing header with inert desktop/mobile Search inputs, Romanian marketing links, contact modal, language selector, Profile/Login/Register/Logout. Authenticated behavior is limited to Profile and Logout. | High-risk but necessary presentation change. Preserve public behavior while moving authenticated destinations to a separate presentation. | critical | retain current public Navbar as known-good path; authenticated presentation must be independently removable |
| `apps/admin/web/components/layout/Footer.tsx` | Marketing-heavy global footer with public business, support, legal, contact, app, coverage, and trust content. | Do not change its content in F.1. `AppShell` may omit it from authenticated operational mode if approved. | medium | restore unconditional Footer rendering |
| `apps/admin/web/components/layout/MobileNavigation.tsx` | Fixed four-column mobile nav. Reads `config.header.menu`, slices 3 items when authenticated, and adds Logout. It currently reuses public configuration for authenticated users. | Necessary F.1 change. Must consume the same authenticated allowlist as desktop navigation. | high | restore current configuration-driven implementation |
| `apps/admin/web/context/UiConfigContext.tsx` | Loads public `/ui-config`; provides public branding/header/footer configuration. | Read-only dependency. Do not make it authority or authenticated navigation truth. | high | no change expected |
| `apps/admin/web/lib/ui-config.ts` | Defines public UI config and default public menu, including Projects, Professionals, Pools, public Compliance, Logistics, and RELU AI. | Do not reuse as authenticated allowlist. Public config must remain public. | high | no change expected |
| `apps/admin/web/components/messaging/MessagingDock.tsx` | Authenticated global floating message dock. Polls `/conversations`, computes its own message unread count, displays conversation context and message previews, and links mostly to Projects or `/profile#messages`. | Do not modify in the base shell package. Treat as a separate existing operational surface and notification-consistency risk. Do not copy its unread count into shell Notifications. | high | no change expected; isolate any later work |

### Authentication and Routing Infrastructure

| File/component | Current purpose and behavior | F.1 modification safety | Risk | Rollback strategy |
|---|---|---|---|---|
| `apps/admin/web/context/AuthContext.tsx` | JWT session bootstrap, refresh, login, register, logout, current user/subscription/features, and auth readiness. Tokens currently persist through API storage helpers. | Read-only dependency. F.1 must consume `isReady`, `isAuthenticated`, and authorized user display fields without changing session behavior. | critical | no F.1 change permitted |
| `apps/admin/web/lib/auth-redirect.ts` | Stores safe requested path in `sessionStorage`; resolves inactive accounts to Security, missing/incomplete identity to onboarding, and completed users to Dashboard. | Read-only dependency. All redirect semantics are frozen. | critical | no F.1 change permitted |
| `apps/admin/web/lib/onboarding.ts` | Stores onboarding draft state in `localStorage`; defines current onboarding steps. | Read-only dependency. It is not acting-entity authority. | critical | no F.1 change permitted |

### Route Owners

| File/route | Current purpose and auth behavior | F.1 modification safety | Risk | Rollback strategy |
|---|---|---|---|---|
| `apps/admin/web/app/page.tsx` (`/`) | Public homepage, discovery previews, marketing content, and public `GeminiChatbot`. | No F.1 business-page changes. Must retain public shell and chatbot boundary. | high | no change expected |
| `apps/admin/web/app/dashboard/page.tsx` (`/dashboard`) | Owner setup/status dashboard using `AuthUser` and `/my-public-posts`. It does not actively redirect when token is absent. | Page content frozen. Shell compatibility only; do not add aggregation or guard behavior. | high | no page change expected |
| `apps/admin/web/app/profile/page.tsx` (`/profile`) | Authenticated profile workspace with taxonomy, assets/documents, location, RELU inputs, and writes. Redirects unauthenticated users using remembered local path. | Do not modify. Existing writes are outside shell scope. | critical | no page change permitted |
| `apps/admin/web/app/publish/page.tsx` (`/publish`) | Publishing drafts/lifecycle, media/documents, taxonomy, and contextual RELU. Without token it stops loading private references/posts rather than redirecting immediately. | Do not modify. Publish is contextual navigation only. | critical | no page change permitted |
| `apps/admin/web/app/projects/page.tsx` (`/projects`) | Authenticated Project list/command board. Redirects unauthenticated users while preserving current location; updates query through history replacement. | Do not modify. Use as honest current Workspace entry. | critical | no page change permitted |
| `apps/admin/web/app/projects/new/page.tsx` (`/projects/new`) | Subscription-gated Project creation using existing AuthContext feature state. | Do not modify or relabel semantics. | critical | no page change permitted |
| `apps/admin/web/app/projects/[id]/page.tsx` | Authenticated Project execution detail and strongest current Workspace-like surface. Preserves requested location on auth redirect. | Do not modify. Deep-link regression target. | critical | no page change permitted |
| `apps/admin/web/app/messages/page.tsx` (`/messages`) | Authenticated inbox; redirects to `/login`; loads `/messages/conversations`. | Do not modify. Destination entry only. | high | no page change expected |
| `apps/admin/web/app/messages/[id]/page.tsx` | Authenticated conversation thread with attachments and writes. | Do not modify. Deep-link regression target. | critical | no page change permitted |
| `apps/admin/web/app/notifications/page.tsx` (`/notifications`) | Authenticated Notification center. Uses Notification API for list, unread count, preferences, read/dismiss actions. | Do not modify. This is the only approved candidate source for a future shell Notification badge. | high | no page change expected |
| `apps/admin/web/app/security/page.tsx` (`/security`) | Account 2FA setup/status/recovery. It waits when token is absent rather than actively redirecting. | Do not modify. Account-menu destination only. | critical | no page change permitted |
| `apps/admin/web/app/jobs/page.tsx` (`/jobs`) | Public jobs/opportunities listing through `JobsPageClient`. | No page change. Approved Feed label only if presented as current discovery behavior. | medium | no page change expected |
| `apps/admin/web/app/companies/page.tsx` (`/companies`) | Public listing inferred from marketplace professional/public-post data. | No page change. Label may remain Companies but must not imply first-class Company Hub maturity. | medium | no page change expected |
| `apps/admin/web/app/professionals/page.tsx` (`/professionals`) | Public professional/subcontractor marketplace-derived listing. | No page change. Destination is valid, but entity-centric redesign is deferred. | medium | no page change expected |
| `apps/admin/web/app/login/page.tsx` (`/login`) | Login and 2FA handoff. Authenticated users are redirected through `resolveAuthenticatedRoute`. | No change. Public/auth shell classification must not interfere. | critical | no page change permitted |
| `apps/admin/web/app/register/page.tsx` (`/register`) | Authentication-only registration followed by `/onboarding/identity-type`. | No change. | critical | no page change permitted |
| `apps/admin/web/app/onboarding/layout.tsx` | Focused onboarding progress wrapper around all onboarding pages. | No change. `AppShell` should classify onboarding as focused mode and avoid duplicate operational navigation. | high | no page/layout change expected |
| `apps/admin/web/app/onboarding/page.tsx` | Server redirect to `/onboarding/welcome`. | No change. | critical | no change permitted |
| `apps/admin/web/app/onboarding/identity-type/page.tsx` | Professional, Company, or Both identity creation selection. | No change; identity creation is not acting-entity switching. | critical | no change permitted |
| onboarding `welcome`, `identity`, `company`, `completion`, and legacy `step-*` pages | Existing onboarding data collection, verification, and progression. Several pages redirect to login only at action time or when token-dependent work runs. | No change. Preserve all current behavior exactly. | critical | no change permitted |

## 2. Route Behavior Baseline

### Shell Modes

Canonical F.1 shell modes:

- `PUBLIC`: public/marketing/auth-entry presentation
- `ONBOARDING`: focused onboarding presentation; no operational navigation
- `AUTHENTICATED`: persistent operational frame over approved existing destinations

Shell classification is presentation only. It must not become a guard.

### Required Route Matrix

| Route | Current access behavior | Current redirect behavior | Expected F.1 shell mode | Authenticated nav visibility | Semantic freeze |
|---|---|---|---|---|---|
| `/` | public | none | PUBLIC, even when signed in unless later separately approved | no operational nav requirement | unchanged |
| `/login` | public auth entry | authenticated user -> resolved Security/onboarding/Dashboard/remembered path | PUBLIC | hidden | unchanged |
| `/register` | public auth entry | successful registration -> `/onboarding/identity-type` | PUBLIC | hidden | unchanged |
| `/dashboard` | intended authenticated; currently renders from optional auth state without active redirect | none in page | AUTHENTICATED when signed in; unauthenticated presentation must not gain false nav | Dashboard active | unchanged; do not add guard |
| `/profile` | authenticated | missing/expired auth -> Login with remembered path | AUTHENTICATED | Profile contextual/account entry | unchanged |
| `/publish` | authenticated functionality but page currently tolerates missing token state | no immediate page redirect | AUTHENTICATED when signed in | Publish contextual command | unchanged; do not add guard |
| `/jobs` | public discovery | none | PUBLIC by default; authenticated shell treatment only if implementation explicitly classifies it without changing content | Feed active when reached through authenticated frame | unchanged |
| `/companies` | public discovery | none | PUBLIC by default; may display authenticated frame only under explicit route-mode policy | Companies active | unchanged |
| `/professionals` | public discovery | none | PUBLIC by default; may display authenticated frame only under explicit route-mode policy | Professionals active | unchanged |
| `/projects` | authenticated | missing/expired auth -> Login with remembered path | AUTHENTICATED | Workspace active | unchanged |
| `/projects/new` | authenticated and subscription-gated | relies on auth/feature state; parent route patterns redirect elsewhere | AUTHENTICATED | Workspace active | unchanged |
| `/projects/[id]` | authenticated | missing/expired auth -> Login with remembered path | AUTHENTICATED | Workspace active | unchanged |
| `/messages` | authenticated | missing/expired auth -> `/login` | AUTHENTICATED | Messages active | unchanged |
| `/messages/[id]` | authenticated | missing/expired auth -> `/login` | AUTHENTICATED | Messages active | unchanged |
| `/notifications` | authenticated | missing/expired auth -> `/login` | AUTHENTICATED | Notifications active | unchanged |
| `/security` | authenticated functionality; page waits without token | no active redirect in page | AUTHENTICATED when signed in | Security in account menu | unchanged; do not add guard |
| `/onboarding` | onboarding entry | server redirect -> `/onboarding/welcome` | ONBOARDING | operational nav hidden | unchanged |
| `/onboarding/welcome` | token-dependent onboarding | action/login recovery as currently implemented | ONBOARDING | hidden | unchanged |
| `/onboarding/identity-type` | token-dependent identity creation | action without token -> `/login` | ONBOARDING | hidden | unchanged |
| `/onboarding/identity` | token-dependent identity onboarding | existing action/load redirects to `/login` | ONBOARDING | hidden | unchanged |
| `/onboarding/company` | token-dependent Company onboarding | existing action redirects to `/login`; progression depends on identity choice | ONBOARDING | hidden | unchanged |
| `/onboarding/completion` | token-dependent verification/completion | existing action/progression behavior | ONBOARDING | hidden | unchanged |
| `/onboarding/step-*` | legacy onboarding flow | existing client progression | ONBOARDING | hidden | unchanged |

### Route Baseline Risk

Current route protection is not uniform. F.1 must preserve this baseline rather than silently standardize it:

- `/profile`, `/projects`, `/messages`, and `/notifications` actively redirect
- `/dashboard`, `/publish`, and `/security` do not enforce the same immediate redirect pattern
- onboarding pages have mixed load-time and action-time auth handling

Guard normalization requires a separate approved task.

## 3. Authenticated Destination Allowlist

### Primary Destinations

| Approved label | Destination | Baseline truth | Label recommendation |
|---|---|---|---|
| Dashboard | `/dashboard` | current setup/status dashboard | `Dashboard` |
| Feed | `/jobs` | public active jobs/project/request discovery list, not canonical personalized Feed | prefer `Opportunities` if `Feed` would overstate current behavior; `Feed` is allowed only with clear current-discovery semantics |
| Companies | `/companies` | marketplace-derived Company/contractor listing | `Companies` is acceptable; do not claim full Company Hubs |
| Professionals | `/professionals` | marketplace-derived Professional/subcontractor listing | `Professionals` |
| Workspace | `/projects` | current Project intake/execution area | prefer `Projects` in visible nav if `Workspace` would imply unavailable Contracts/Documents/Compliance aggregates; grouping may identify it as Workspace context |
| Messages | `/messages` | current authenticated inbox | `Messages` |
| Notifications | `/notifications` | current authenticated Notification center | `Notifications` |

### Contextual/Account Destinations

| Approved label | Destination | Placement |
|---|---|---|
| Profile | `/profile` | avatar/account menu or contextual navigation |
| Publish | `/publish` | contextual command, not universal primary destination |
| Security | `/security` | avatar/account menu |

### Safer Initial Label Set

For truthful first implementation, the recommended visible set is:

- Dashboard
- Opportunities
- Companies
- Professionals
- Projects
- Messages
- Notifications

Use:

- Profile and Security in the account menu
- Publish as a contextual action

This avoids claiming that `/jobs` is already the canonical ranked Feed or that `/projects` already provides the complete Workspace architecture.

## 4. Forbidden Destination Denylist

The following must be absent from authenticated desktop nav, mobile nav, avatar menu, mega/overflow menus, shortcuts, command surfaces, badges, disabled controls, and teaser copy:

| Forbidden destination/exposure | Reason |
|---|---|
| global Search | no no-leak implementation; current Navbar Search is inert and must not appear authenticated |
| Institutions | no first-class route/data/authority implementation |
| Procurement | no standalone production-ready route/read model |
| Governance | generic destination is undefined and could conflate public Compliance with authenticated governance |
| Workspace Home aggregate | no canonical route/read model |
| Workspace Contracts aggregate | only object-level Contract panels exist |
| Workspace Documents aggregate | only object-level documents exist |
| Workspace Compliance aggregate | only object-level/project Compliance exists |
| Contracts aggregate | unsupported route/read model |
| Documents aggregate | unsupported route/read model |
| Compliance aggregate | `/compliance` is public information, not authenticated execution governance |
| Admin/backoffice links for normal users | authorization and exposure leakage |
| `/relu-builder` | internal SuperAdmin tooling |
| design preview routes | internal visual tooling |
| RELU primary navigation | violates contextual RELU contract |
| floating authenticated RELU assistant | violates contextual RELU contract |
| disabled/coming-soon/placeholders | unfinished modules must remain hidden, not advertised |

### Current Exposure Finding

`Navbar.tsx` currently renders inert global Search inputs on desktop and mobile. F.1 authenticated presentation must omit them entirely.

`DEFAULT_PUBLIC_UI_CONFIG` includes public Compliance and RELU AI links. That public configuration must not feed authenticated navigation.

## 5. Exact Future Change Map

### Expected New Files

| Proposed file | Reason | Allowed scope | Forbidden changes | Acceptance criteria | Rollback unit |
|---|---|---|---|---|---|
| `apps/admin/web/lib/authenticated-navigation.ts` | central typed destination allowlist, route matching, shell-mode route classification, and denylist constants | presentation metadata for approved existing routes only | permission logic, API calls, acting-entity authority, future destinations, Search | desktop/mobile use one source; denylisted destinations absent; route matching tested | delete file and restore prior consumers |
| `apps/admin/web/components/layout/AuthenticatedNavbar.tsx` | authenticated desktop/header presentation separate from public marketing Navbar | logo, approved destination links, Messages/Notifications entry, account menu, non-authoritative identity summary | Search, RELU assistant/nav, unread synthesis, writes, Workspace content, entity switch execution | destination-only behavior; no hidden modules; no authority implication | remove component and restore public Navbar path |
| `apps/admin/web/components/layout/AuthenticatedAccountMenu.tsx` | isolate account display, Profile, Security, Logout, and safe identity summary | authorized existing `AuthUser` display fields and existing logout | persisted context, entity switching, authority claims, Institution, new writes | account versus identity wording clear; Combined non-executable | remove menu and return Profile/Logout controls |
| `apps/admin/web/lib/authenticated-navigation.spec.ts` or repository-consistent test location | focused tests for allowlist, denylist, route matching, and shell-mode classification | pure presentation-contract tests | domain authorization tests or route mutations | critical destinations hidden and active matching deterministic | remove test with corresponding feature rollback |

File names may follow an established local convention discovered during implementation, but ownership and responsibilities must remain equivalent.

### Expected Modified Files

| File | Reason | Allowed scope | Forbidden changes | Acceptance criteria | Rollback unit |
|---|---|---|---|---|---|
| `apps/admin/web/components/layout/AppShell.tsx` | choose PUBLIC, ONBOARDING, or AUTHENTICATED presentation and control authenticated Footer/MobileNavigation placement | consume pathname/auth readiness; compose existing/new presentation components | redirects, guards, token handling, business reads/writes, Workspace content | no auth flash; correct shell mode; domain pages unchanged | shell-mode composition |
| `apps/admin/web/components/layout/Header.tsx` | select public or authenticated header presentation if selection is not centralized in AppShell | presentation dispatch only | route policy, permissions, notifications fetching | Header remains thin and deterministic | Header dispatch |
| `apps/admin/web/components/Navbar.tsx` | preserve public Navbar while removing it from authenticated mode; optionally rename/refactor as public-only component | public behavior preservation and component separation | authenticated Search, domain nav, route behavior changes, contact flow changes | public desktop/mobile behavior remains unchanged | public Navbar refactor |
| `apps/admin/web/components/layout/MobileNavigation.tsx` | consume authenticated allowlist and hide on public/onboarding modes as appropriate | approved existing destinations, active state, account/logout entry | public config slicing, hidden modules, Search, authority controls, unread synthesis | desktop/mobile destination parity; no overflow; four critical rules pass | mobile authenticated nav |
| `apps/admin/web/components/layout/Footer.tsx` | no content change expected; modify only if a minimal prop is required by existing composition pattern | preserve public Footer | authenticated Dashboard/Workspace/status content, marketing redesign | public Footer unchanged | revert optional composition prop |

### Read-Only / No-Change Files

F.1 must not modify:

- `apps/admin/web/app/layout.tsx` unless a blocker proves AppShell cannot own presentation selection
- `apps/admin/web/context/AuthContext.tsx`
- `apps/admin/web/lib/auth-redirect.ts`
- `apps/admin/web/lib/onboarding.ts`
- `apps/admin/web/context/UiConfigContext.tsx`
- all route pages listed in the baseline
- API helpers
- Project, Message, Notification, Profile, Publish, Security, or onboarding business components
- `MessagingDock.tsx` in the base shell package

Any required change to a no-change file is a scope exception and must be reviewed before editing.

### Changed-File Allowlist Principle

The implementation PR should normally contain only:

- authenticated navigation metadata/tests
- authenticated header/account presentation
- AppShell/Header/MobileNavigation composition
- proof/validation artifacts

Domain-page or auth changes indicate scope drift.

## 6. Exact Validation Plan

This task does not run validation. The following is mandatory during implementation.

### Static and Build Commands

Run from `apps/admin/web`:

```powershell
npm.cmd run lint
npm.cmd run build
```

Optional focused formatting check if touched files are covered:

```powershell
npm.cmd run format:check
```

Run focused tests using the repository-consistent runner introduced or already available for pure navigation tests. Do not add a test framework casually; if no runner exists, validate pure contracts through the build plus a narrowly scoped Node/browser proof.

### Changed-File and Write-Handler Checks

From repository root:

```powershell
git diff --check
git diff --name-only
rg -n "fetch\\(|apiRequest|createPublicPost|updatePublicPost|deletePublicPost|router\\.(push|replace)|redirect\\(" apps/admin/web/components/layout apps/admin/web/components/Navbar.tsx apps/admin/web/lib/authenticated-navigation.ts
```

Expected:

- no new API/write calls in shell/navigation files
- routing calls limited to existing destination/logout presentation behavior
- no redirect/guard implementation in shell

### Forbidden Exposure Checks

Inspect changed authenticated shell files and rendered DOM for:

```text
Search
Institution
Procurement
Governance
Contracts
Documents
Compliance
RELU Builder
Coming soon
Disabled
```

The check must distinguish legitimate existing page content from forbidden shell navigation exposure.

### Browser Route and Deep-Link Matrix

Validate at desktop and mobile widths:

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/profile`
- `/publish`
- `/jobs`
- `/companies`
- `/professionals`
- `/projects`
- `/projects/new`
- one valid `/projects/[id]`
- `/messages`
- one valid `/messages/[id]`
- `/notifications`
- `/security`
- `/onboarding`
- `/onboarding/welcome`
- `/onboarding/identity-type`
- `/onboarding/identity`
- `/onboarding/company`
- `/onboarding/completion`
- legacy `/onboarding/step-*`

For each route capture:

- unauthenticated result/redirect
- authenticated result
- shell mode
- active destination
- console errors
- page errors
- unexpected 4xx/5xx
- browser back/forward behavior
- refresh behavior

### Public/Authenticated Separation

Confirm:

- public Navbar/Search/contact/footer remain public-only
- authenticated shell has no global Search
- onboarding uses focused presentation without operational nav
- logout returns to existing Login behavior
- authentication loading does not flash authenticated destinations
- public homepage `GeminiChatbot` does not enter authenticated shell presentation

### Screenshot Requirements

Capture:

- public homepage desktop/mobile
- Login desktop/mobile
- onboarding desktop/mobile
- Dashboard desktop/mobile
- Projects desktop/mobile
- Messages desktop/mobile
- Notifications desktop/mobile

Verify:

- no overlap
- no horizontal overflow
- stable header height
- content not hidden behind sticky/fixed navigation
- mobile labels fit
- focus and active states remain visible

### DOM and Link Inventory

Programmatically collect authenticated shell links on desktop and mobile.

Allowed hrefs:

- `/dashboard`
- `/jobs`
- `/companies`
- `/professionals`
- `/projects`
- `/messages`
- `/notifications`
- `/profile`
- `/publish`
- `/security`
- `/`
- existing legal/logout behavior where applicable

Fail on forbidden destination labels/hrefs, disabled placeholders, or hidden internal links.

### Notification Validation

If no badge is implemented:

- verify no placeholder count or empty badge exists

If a badge is implemented:

- verify it uses only `getNotificationUnreadCount`
- verify read/dismiss updates match `/notifications`
- verify no Message/Project/Dashboard counts are added
- verify no sensitive preview is rendered

### Raw Data Exposure Check

Authenticated shell DOM and accessibility tree must not contain:

- message bodies
- private filenames
- Compliance evidence
- Contract content
- Project participant details
- hidden counts
- raw RELU output
- authority/delegation details

### No-New-Write Check

Code review and runtime network capture must confirm shell interactions produce no new domain writes beyond existing Logout and Notification-center behavior outside the shell.

## 7. Risk Review

| Risk | Baseline evidence | Mitigation | Stop/rollback condition |
|---|---|---|---|
| route regressions | route protection and redirects are currently inconsistent | no page/guard edits; route/deep-link matrix | any redirect, deep link, history, or semantic change |
| auth loading flash | `AuthContext` bootstraps asynchronously | render no authenticated destination set until `isReady` | unauthorized nav flashes before readiness |
| public/auth shell bleed | one AppShell/Navbar/Footer currently serves all routes | explicit three-mode classification and screenshots | public Search/footer appears in authenticated mode or operational nav appears public/onboarding |
| mobile navigation overload | current fixed four-column nav cannot fit full allowlist | use compact primary set plus accessible overflow/account menu | clipping, overlap, unreadable labels, or hidden critical destination |
| misleading labels | `/jobs` is not canonical Feed; `/projects` is not complete Workspace | prefer `Opportunities` and `Projects`; use grouping rather than overclaiming | label promises unavailable behavior |
| Notification badge inconsistency | Notifications and MessagingDock have separate unread concepts | Notification API only or no badge | synthetic/divergent count |
| identity presentation implies authority | existing `identityState` is onboarding/account data, not resolved authority | read-only wording; no switch or action affordance | identity label enables/claims write authority |
| RELU overexposure | public Chatbot and internal builder exist | no authenticated RELU nav/assistant; preserve contextual modules | RELU appears shell-level |
| Workspace ownership drift | `/projects` contains execution but not complete Workspace | visible label `Projects` preferred; shell links only | shell renders tasks/docs/contracts/evidence or claims aggregate Workspace |
| hidden module exposure | public config contains Compliance and RELU; future IA contains Institution/Procurement | independent authenticated allowlist | any denylisted item appears |
| Search leakage | Navbar currently has inert desktop/mobile Search | authenticated Navbar must omit Search entirely | any Search field/shortcut/suggestion appears |
| Messaging preview leakage | global MessagingDock renders message snippets | do not integrate previews into shell; assess separately | shell copies or broadens preview exposure |

## 8. Implementation Readiness Verdict

### Baseline Gates

| Gate | Status |
|---|---|
| exact implementation owners identified | PASS |
| route behavior matrix defined | PASS WITH RISKS |
| authenticated destination allowlist defined | PASS |
| forbidden destination denylist defined | PASS |
| exact future changed-file map defined | PASS |
| read-only/no-change file boundary defined | PASS |
| validation commands and browser matrix defined | PASS |
| technical risks and rollback conditions defined | PASS WITH RISKS |
| no implementation started | PASS |

### Final Technical Decision

EXEC-78F.1 may proceed with the following expected edit perimeter:

- central authenticated navigation metadata
- authenticated header/account presentation
- `AppShell` presentation-mode composition
- `Header` presentation dispatch if required
- public `Navbar` preservation/separation
- authenticated `MobileNavigation`
- focused navigation contract tests and browser proof

It must not modify auth/session/redirect/onboarding/domain behavior or add new routes, APIs, writes, Search, authority, Workspace aggregates, Institution, Procurement, or notification synthesis.

Residual risks remain because route protection is currently inconsistent, acting-entity authority is not implemented, the global MessagingDock has a separate unread model, and `/jobs`/`/projects` do not fully match the future Feed/Workspace architecture. The safer initial labels are `Opportunities` and `Projects`.

EXEC-78F.1B PASS WITH RISKS
