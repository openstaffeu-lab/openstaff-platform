# EXEC-78F.1C Authenticated Shell UX Contract & Navigation Specification

Date: 2026-06-06

Verdict: `PASS WITH RISKS`

Status: UX architecture and navigation specification only. No UI, code, routes, APIs, database schema, permissions, guards, authentication, authorization, build, tests, deployment, infrastructure, or implementation were changed or run.

## 1. Authenticated Shell Layout Contract

The Authenticated Shell is the persistent operating frame for a signed-in user. It owns orientation, destination navigation, account entry, Notification entry, responsive composition, and safe identity presentation.

It does not own route access, acting-entity authority, permissions, Feed content, Project execution, Messages, Notifications, Compliance workflows, Workspace records, or RELU decisions.

### Canonical Structure

Desktop:

1. persistent top header
2. left product identity
3. center destination navigation
4. right account control
5. route-owned content region

Mobile:

1. compact top header
2. route-owned content region
3. fixed bottom destination navigation
4. overflow destination sheet opened from `More`
5. account menu opened from the top-header avatar

The Shell may provide stable spacing around route content. It must not restyle, wrap, summarize, or move the internal business controls of existing pages during F.1.

### Ownership Matrix

| Shell region | Owner | Allowed responsibility | Forbidden responsibility |
|---|---|---|---|
| header | Shell presentation | logo, current destination, Notification entry, account entry | guards, redirects, authority resolution, domain actions |
| primary navigation | Shell presentation | links to approved existing destinations and active state | permissions, ownership claims, hidden-module advertising |
| account menu | Account presentation | safe identity display, Profile, Security, Logout | acting-entity switching, delegation, authority claims |
| Notification entry | Shell presentation plus Notification domain truth | destination and optional authorized unread badge | unread synthesis, notification lifecycle changes |
| mobile bottom navigation | Shell presentation | compact access to approved destinations | public menu reuse, domain previews, Logout duplication |
| content region | owning route/module | existing page content and behavior | Shell-owned business state |
| footer | public presentation only | existing public marketing/footer content | authenticated operational controls |

### Always Present In Authenticated Mode

- OpenStaff logo linked to `/dashboard`
- one responsive navigation presentation
- account/avatar control
- route-owned content region
- deterministic active destination state
- accessible keyboard and screen-reader labels

### Conditional In Authenticated Mode

- Notification badge, only when the Notification domain provides an authorized unread count
- non-authoritative identity summary, only from existing safe account data
- mobile `More` menu at widths where all approved destinations cannot fit
- contextual `Publish` actions inside owning workflows, never as universal primary navigation
- authenticated framing on `/jobs`, `/companies`, and `/professionals` when the session is ready and authenticated

### Never Present In Authenticated Mode

- global Search
- public marketing navigation
- public marketing footer
- public chatbot or public engagement controls
- unfinished or unsupported destinations
- disabled or coming-soon navigation
- acting-entity switch controls
- permission, delegation, or authority claims
- message previews, document previews, compliance evidence, or private object data
- Workspace execution controls inside the header or navigation
- RELU as navigation, assistant, or floating control

### Content Boundary

The Shell ends at the route content boundary. Dashboard, Opportunities, Companies, Professionals, Projects, Messages, Notifications, Profile, Publish, and Security retain their existing content ownership and semantics.

The Shell must not add:

- Dashboard aggregation
- Project actions
- Workspace task controls
- Message content
- Notification lifecycle actions
- Compliance status synthesis
- entity-owned writes

## 2. Desktop Navigation Contract

### Header Geometry

- target height: 64 pixels
- sticky at the top of the viewport
- full-width background and bottom boundary
- constrained inner width aligned with existing application content
- no second navigation row
- no control may change header height on hover, active state, loading, or badge changes

### Left Area

The left area contains the OpenStaff logo and product identity.

Authenticated home behavior:

- logo click routes to `/dashboard`
- logo does not change acting-entity context
- logo does not imply Dashboard authority
- logo remains keyboard focusable with an accessible name such as `OpenStaff Dashboard`

### Center Area

The canonical desktop order is frozen as:

1. Dashboard -> `/dashboard`
2. Opportunities -> `/jobs`
3. Companies -> `/companies`
4. Professionals -> `/professionals`
5. Projects -> `/projects`
6. Messages -> `/messages`
7. Notifications -> `/notifications`

`Opportunities` is the truthful label for the current `/jobs` discovery route. `Projects` is the truthful label for the current `/projects` execution surface. F.1 must not label these destinations `Feed` or `Workspace` because the current routes do not yet implement those complete canonical modules.

### Active State Rules

Only one primary destination may be active.

| Destination | Active path rule |
|---|---|
| Dashboard | exact `/dashboard` |
| Opportunities | `/jobs` and descendants |
| Companies | `/companies` and descendants |
| Professionals | `/professionals`, descendants, and legacy `/profiles/[slug]` public profile detail when reached as Professional discovery |
| Projects | `/projects` and descendants |
| Messages | `/messages` and descendants |
| Notifications | `/notifications` and descendants |

Active state requirements:

- use pathname state only
- include `aria-current="page"` on the active link
- use color, weight, and a stable indicator rather than color alone
- never infer permission or authority from active state
- never resize or shift neighboring destinations

Profile, Publish, Security, onboarding, auth, and public marketing routes do not activate a primary destination unless a separately defined parent relationship is truthful. In F.1, Profile and Security remain account-menu contexts and Publish remains contextual.

### Hover And Focus

- hover changes foreground/background emphasis without moving layout
- focus uses a clearly visible focus ring
- focus order follows visual order
- no hover preview, popover, private data, or unread content is allowed
- destination labels remain visible on pointer-capable desktop widths

### Responsive Collapse

| Viewport width | Presentation |
|---|---|
| 1200 pixels and above | all seven destinations displayed in canonical order |
| 768 to 1199 pixels | Dashboard, Opportunities, Projects, Messages, Notifications, then `More`; Companies and Professionals appear in `More` in canonical order |
| below 768 pixels | mobile top header plus mobile bottom navigation |

The desktop/tablet `More` control is a navigation overflow control, not a destination. It contains only Companies and Professionals. It must not contain account actions, Logout, hidden modules, Search, RELU, or placeholders.

### Right Area

The right area contains the avatar/account control only. Notification remains in the frozen navigation order on desktop and must not be duplicated beside the avatar.

## 3. Mobile Navigation Contract

### Mobile Top Header

The compact top header contains:

1. OpenStaff logo linked to `/dashboard`
2. Notification icon linked to `/notifications`
3. avatar/account control

The Notification icon is intentionally in the top header so the bottom navigation can remain stable at narrow widths. It is not duplicated in the bottom bar.

### Mobile Bottom Navigation

The fixed bottom navigation uses five equal-width slots:

| Visual label | Destination/action | Accessible label |
|---|---|---|
| Home | `/dashboard` | Dashboard |
| Explore | `/jobs` | Opportunities |
| Projects | `/projects` | Projects |
| Messages | `/messages` | Messages |
| More | opens destination sheet | More destinations |

Compact labels are approved only for mobile fit. Desktop retains `Dashboard` and `Opportunities`.

The `More` sheet contains:

1. Companies -> `/companies`
2. Professionals -> `/professionals`

No approved destination is hidden without a reachable alternative:

- Notifications is in the top header
- Profile and Security are in the account menu
- Companies and Professionals are in `More`
- Logout is in the account menu

### Mobile Active State

- `Home` is active for `/dashboard`
- `Explore` is active for `/jobs` and descendants
- `Projects` is active for `/projects` and descendants
- `Messages` is active for `/messages` and descendants
- `More` is active for Companies or Professionals routes
- the top Notification icon is active for `/notifications` and descendants
- the avatar may receive a selected treatment for Profile or Security, but it must not look like an authority selector

### Mobile Sizing And Overflow

- five stable equal columns
- minimum interactive target: 44 by 44 pixels
- icons above short labels
- no horizontal scrolling
- no dynamic width based on unread count
- badge overlays must not affect slot dimensions
- bottom safe-area inset must be respected
- content bottom padding must prevent the bar from covering page actions
- labels must remain readable at 320-pixel viewport width

### Mobile Overflow Behavior

- `More` opens a modal sheet or menu with a clear heading
- Escape, backdrop click, and destination selection close it
- focus moves into the sheet and returns to `More` on close
- body scroll is controlled while open
- no account actions are duplicated in `More`
- no disabled, future, internal, or unauthorized destination is rendered

## 4. Account Menu Contract

### Avatar Behavior

- use the approved avatar when available
- otherwise use stable initials or a neutral account icon
- avatar opens an account menu
- avatar is never labeled as an acting-entity switcher
- menu state is local presentation state and carries no authority

### Identity Display

The menu may display:

- account display name
- account email where already authorized for the signed-in user
- a neutral identity summary such as `Professional profile`, `Company profile`, or `Professional and Company profiles`

The menu must not display:

- `Acting as`
- `Authorized as`
- permission or scope claims
- delegation status
- signatory status
- a Company or Institution selector
- Combined as an execution actor

Identity presentation is descriptive account context only. It is not acting-entity truth.

### Menu Actions

Frozen order:

1. Profile -> `/profile`
2. Security -> `/security`
3. Logout -> existing Logout action

Logout remains an action, not a navigation destination. It must not appear in the primary desktop navigation, mobile bottom navigation, or mobile `More` menu.

### Menu Interaction

- button exposes `aria-expanded` and menu relationship
- keyboard navigation is supported
- Escape and outside click close the menu
- route selection closes the menu
- destructive-looking styling is reserved for Logout
- menu opening must not fetch private domain data

## 5. Notifications Contract

### Placement

- desktop: seventh primary destination
- mobile: top-header icon
- account menu: absent
- mobile bottom navigation: absent

### Unread Source Of Truth

Notification unread state belongs only to the Notification domain.

Allowed:

- an authorized result from the existing Notification unread-count contract
- no badge when that source is unavailable, loading, invalid, or not integrated

Forbidden:

- message unread count
- Project notification count
- Dashboard task count
- Workspace alert count
- client-side synthesis across modules
- placeholder or optimistic counts

### Badge Behavior

- zero or unavailable: no badge
- 1 through 99: exact count
- above 99: `99+`
- badge has an accessible unread description
- badge never changes destination width
- badge does not reveal notification title, type, source object, or private content

### Responsibility Boundary

The Shell may display and route. The Notifications module owns fetching, read/dismiss state, delivery truth, and history. Opening the destination must not automatically mark all notifications read.

## 6. Messages Contract

### Placement

- desktop: sixth primary destination
- mobile: fourth bottom destination
- mobile top header: absent
- account menu: absent

### Active State

Messages is active for `/messages` and all message-thread descendants.

### Unread Behavior

F.1 must not add a Messages badge unless the Message domain later provides a separately approved single unread truth. Notification unread truth must never be reused.

The existing `MessagingDock` remains a separate current surface and must not be copied into Shell navigation.

### Privacy Boundary

The Shell may show only the `Messages` destination label and icon.

It must not show:

- sender identity
- last-message preview
- attachment name
- Project or Contract context
- participant count
- conversation existence hints
- message-search suggestions

Messages remains destination-only. The Message module owns content, participants, unread state, and actions.

## 7. Public And Authenticated Separation Contract

### Public Shell

Public shell applies to:

- `/`
- `/login`
- `/register`
- password recovery and reset routes
- public legal, pricing, status, trust, and marketing routes
- unauthenticated visits to `/jobs`, `/companies`, and `/professionals`

Public shell may retain:

- public navigation
- public Search where it already belongs
- public marketing footer
- public homepage chatbot
- public account-entry actions

Public Search and chatbot behavior must not be imported into authenticated presentation.

### Onboarding Shell

Onboarding shell applies to `/onboarding` and all descendants.

It contains only the focused onboarding presentation owned by the existing onboarding layout. It must not show:

- authenticated primary navigation
- mobile bottom navigation
- public marketing navigation
- global Search
- public chatbot
- operational Notification or Message entry
- acting-entity controls

Onboarding identity selection creates or configures identity records. It is not acting-entity switching.

### Authenticated Shell

Authenticated shell applies after auth readiness confirms a signed-in session on:

- `/dashboard`
- `/profile`
- `/publish`
- `/projects` and descendants
- `/messages` and descendants
- `/notifications` and descendants
- `/security`
- `/jobs`, `/companies`, and `/professionals` and descendants when visited by a signed-in user

Using the authenticated frame on public discovery routes changes presentation only. It must not change:

- public accessibility
- route path
- route content
- data query
- visibility rules
- browser history
- deep-link behavior

### Transition Rules

- before auth readiness resolves, do not flash authenticated destinations or private identity data
- unauthenticated to authenticated transition occurs through existing login and redirect behavior
- authenticated to onboarding transition preserves focused onboarding mode
- Logout destroys authenticated presentation and follows existing logout routing
- navigating from authenticated Dashboard to Opportunities, Companies, or Professionals retains authenticated framing
- navigating to `/` deliberately enters the public homepage; `/` does not become authenticated home

## 8. Forbidden UX Inventory

The following are prohibited in authenticated header, desktop navigation, mobile navigation, overflow menus, account menu, shortcuts, badges, and shell empty states:

| Forbidden UX | Enforcement |
|---|---|
| global Search input, icon, shortcut, suggestion, preview, or count | absent from authenticated DOM |
| Institutions | hidden |
| Procurement | hidden |
| Governance | hidden |
| Workspace Home aggregate | hidden |
| Contracts aggregate | hidden |
| Documents aggregate | hidden |
| Compliance aggregate | hidden |
| Admin/backoffice/internal tools for normal users | hidden |
| RELU destination | hidden |
| floating RELU assistant or chatbot | absent |
| disabled destination | absent |
| coming-soon or teaser destination | absent |
| acting-entity switcher | absent |
| Combined execution control | absent |
| synthesized unread count | absent |
| message or notification preview | absent |
| Workspace execution content in Shell | absent |

Hidden means not rendered. CSS concealment, disabled anchors, inaccessible placeholders, and feature-teaser copy do not satisfy this contract.

## 9. UX Validation Matrix

This task performs no validation. The following matrix is mandatory during implementation.

### Primary Screenshot Matrix

Authenticated desktop viewport: `1440 x 900`.

| Route | Required proof |
|---|---|
| `/dashboard` | full seven-item navigation, Dashboard active, no Search, account control |
| `/jobs` | authenticated frame retained, Opportunities active, public route content unchanged |
| `/projects` | Projects active, no Workspace content in header |
| `/messages` | Messages active, no previews or synthesized badge |
| `/notifications` | Notifications active, authorized badge behavior only |

Authenticated mobile viewport: `390 x 844`.

| Route | Required proof |
|---|---|
| `/dashboard` | Home active, compact header, five-slot bottom navigation |
| `/jobs` | Explore active, authenticated frame retained |
| `/projects` | Projects active, page actions not covered |
| `/messages` | Messages active, no preview leakage |
| `/notifications` | top Notification control active, no duplicate bottom item |

### Breakpoint Proof

| Viewport | Route/state | Required proof |
|---|---|---|
| `1024 x 768` | `/dashboard` | compact desktop order, Companies/Professionals reachable through `More` |
| `1024 x 768` | `More` open | only Companies and Professionals visible |
| `320 x 720` | `/dashboard` | no horizontal overflow; Home, Explore, Projects, Messages, More fit |
| `320 x 720` | mobile `More` open | readable labels, focus containment, no forbidden entries |
| `390 x 844` | account menu open | safe identity wording, Profile, Security, Logout only |

### Public And Onboarding Proof

| Viewport | Route | Required proof |
|---|---|---|
| `1440 x 900` | `/` unauthenticated | public shell and public-only chatbot boundary preserved |
| `390 x 844` | `/login` | no authenticated nav or bottom bar |
| `390 x 844` | `/onboarding/identity-type` | focused onboarding shell only |
| `1440 x 900` | `/jobs` unauthenticated | public access and public shell preserved |

### Validation Criteria

Active state:

- exactly one relevant destination active
- nested route matching correct
- `aria-current` present
- no active-state layout shift

Spacing and overflow:

- no horizontal viewport overflow
- no clipped labels or icons
- header and bottom bar retain stable dimensions
- page controls remain visible above mobile navigation

Accessibility:

- keyboard reaches destinations in visual order
- visible focus state
- account and overflow menus expose state
- Escape closes menus
- touch targets meet minimum size
- icon-only controls have accessible names
- badge count has screen-reader context

Navigation consistency:

- desktop and mobile use one approved destination contract
- public, onboarding, and authenticated modes do not bleed into each other
- no destination changes route semantics
- no hidden module appears in links, text, accessibility tree, or menu data

Privacy and governance:

- no Search element in authenticated DOM
- no private preview or raw data in Shell
- no new write handler in Shell files
- no authority language in identity presentation
- no RELU authenticated Shell placement

## 10. Risks And Implementation Readiness

| Risk | Impact | Required mitigation |
|---|---|---|
| auth-loading shell flash | private/authenticated destinations may appear before session truth | render a neutral stable frame until AuthContext readiness resolves |
| public discovery shell ambiguity | signed-in users could lose the persistent frame or public users could see authenticated controls | classify `/jobs`, `/companies`, and `/professionals` by auth readiness without changing route semantics |
| desktop density | seven labels may overflow at intermediate widths | use the frozen 1200-pixel collapse rule and two-item `More` menu |
| mobile label pressure | full desktop labels do not fit at 320 pixels | use frozen Home/Explore compact labels and five equal slots |
| Notification truth | badge could diverge from Notification center | use Notification unread truth only or omit badge |
| identity wording | safe profile state could be mistaken for authority | prohibit `Acting as`, switching, scopes, and delegation wording |
| active route ambiguity | legacy detail routes may activate the wrong destination | centralize path matching and test all route descendants |
| public chatbot bleed | public engagement may conflict with authenticated operational UX | render chatbot only in public presentation |
| Workspace ownership drift | Projects destination could cause Shell to absorb execution | keep Shell destination-only and preserve Project page ownership |
| existing MessagingDock duplication | two message entry patterns may compete | do not copy dock previews/counts into Shell; review dock separately later |

### Readiness Gates

| Gate | Status |
|---|---|
| authenticated Shell regions and boundaries frozen | PASS |
| desktop order, labels, active states, and collapse rules frozen | PASS |
| mobile destinations, compact labels, overflow, and account access frozen | PASS |
| account menu remains non-authoritative | PASS |
| Notification and Message ownership separated | PASS WITH RISKS |
| public/onboarding/authenticated transitions frozen | PASS WITH RISKS |
| forbidden UX inventory frozen | PASS |
| screenshot and accessibility matrix frozen | PASS |
| no implementation started | PASS |

### Implementation Readiness Verdict

EXEC-78F.1C is ready to guide the constrained shell implementation.

Residual risks remain around auth-loading presentation, authenticated framing of public discovery routes, Notification badge integration, legacy Professional detail-route matching, and the existing global `MessagingDock`. These risks are bounded by explicit UX rules and validation gates and do not require broadening F.1 scope.

## Final Verdict

EXEC-78F.1C PASS WITH RISKS
