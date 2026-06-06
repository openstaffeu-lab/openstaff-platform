# EXEC-78F.1 Authenticated Shell Implementation Report

Date: 2026-06-06

Verdict: `PASS WITH RISKS`

## A. Executive Summary

EXEC-78F.1 implements the constrained authenticated OpenStaff Shell defined by EXEC-78F.0B-F.0E and EXEC-78F.1A-F.1C.

Implemented:

- persistent authenticated header over existing operational routes
- frozen desktop destination order
- compact desktop overflow at 768-1199 pixels
- mobile top header and five-slot bottom navigation
- non-authoritative account menu
- Notification-domain unread badge
- public, onboarding, loading, and authenticated shell separation
- active states, `aria-current`, keyboard focus, responsive overflow controls, and safe-area handling

Not implemented:

- new routes or route aliases
- global Search
- acting-entity switching
- authority, delegation, or permission behavior
- Institution, Procurement, Governance, or unsupported Workspace modules
- RELU navigation or authenticated floating assistant
- Message previews or synthesized unread counts
- Dashboard, Workspace, Notification, or Message domain changes

No route page, API, database schema, Prisma model, permission, guard, authentication, authorization, Workspace execution behavior, Notification domain logic, or Message domain logic was modified.

## B. Files Modified

### Created

- `apps/admin/web/lib/authenticated-navigation.ts`
- `apps/admin/web/components/layout/AuthenticatedNavbar.tsx`
- `apps/admin/web/components/layout/AuthenticatedAccountMenu.tsx`
- `apps/admin/web/components/layout/ShellIcon.tsx`
- `docs/proof/exec78/exec78f1-browser-proof.cjs`
- `docs/proof/exec78/exec78f1/browser-proof.json`
- `docs/proof/exec78/exec78f1/screenshots/*.png`
- `EXEC78F1_IMPLEMENTATION_REPORT.md`

### Updated

- `apps/admin/web/components/layout/AppShell.tsx`
- `apps/admin/web/components/layout/Header.tsx`
- `apps/admin/web/components/layout/MobileNavigation.tsx`
- `STATUS.md`
- `docs/proof/exec78/README.md`

### Confirmed Unchanged

- `apps/admin/web/context/AuthContext.tsx`
- `apps/admin/web/lib/auth-redirect.ts`
- all route pages
- API contracts and helpers
- Message and Notification pages/domain actions
- `MessagingDock`
- Workspace/Project execution behavior
- route paths and semantics

## C. Implementation Summary

### Shell Modes

`AppShell` now resolves presentation-only modes:

- `PUBLIC`
- `ONBOARDING`
- `LOADING`
- `AUTHENTICATED`

Onboarding remains focused. Auth-capable routes render a neutral header while session readiness resolves, preventing authenticated navigation and identity data from flashing before session truth.

Signed-in users retain the authenticated frame on `/jobs`, `/companies`, `/professionals`, and their detail families without changing public accessibility, route content, data queries, or paths.

### Desktop Header

The 64-pixel authenticated header implements:

1. Dashboard -> `/dashboard`
2. Opportunities -> `/jobs`
3. Companies -> `/companies`
4. Professionals -> `/professionals`
5. Projects -> `/projects`
6. Messages -> `/messages`
7. Notifications -> `/notifications`

At 1200 pixels and above, all destinations are visible. From 768 through 1199 pixels, Companies and Professionals move into `More`; no other entries are added.

Active states are pathname-derived, include `aria-current="page"`, and do not alter layout geometry.

### Mobile Shell

The mobile top header contains:

- logo
- Notifications
- account avatar

The fixed bottom navigation contains:

- Home
- Explore
- Projects
- Messages
- More

`More` contains Companies and Professionals only. It uses a modal dialog, focus entry/containment, Escape handling, backdrop dismissal, focus restoration, scroll locking, stable five-column sizing, and safe-area padding.

### Account Menu

The account menu contains:

- descriptive account/profile identity
- Profile
- Security
- Logout

It does not present acting entity, authority, delegation, scopes, or switching.

### Notifications And Messages

The Notification badge reads only the existing `/notifications/unread-count` contract. Failure or unavailable truth removes the badge. Counts are refreshed on route changes, window focus, and a 60-second interval.

Messages remains a destination-only link. No Message unread count, preview, participant, attachment, or conversation metadata was added. `MessagingDock` was not modified.

## D. Validation Results

| Validation | Result | Evidence |
|---|---|---|
| TypeScript | PASS | `npx.cmd tsc --noEmit` exited 0 after build completion |
| lint | PASS WITH WARNINGS | `npm.cmd run lint` exited 0 with 21 pre-existing warnings and 0 errors |
| standard production build | PASS | `npm.cmd run build` completed all 58 routes with Turbopack |
| webpack production build | PASS | `npx.cmd next build --webpack` completed all 58 routes |
| browser route matrix | PASS | 10/10 required desktop/mobile route checks passed |
| compact desktop | PASS | 1024px `More` contains Companies and Professionals only |
| narrow mobile | PASS | 320px navigation and `More` have no horizontal overflow |
| account semantics | PASS | descriptive identity plus Profile, Security, Logout; no authority language |
| public/auth separation | PASS | signed-in `/` remains public; signed-out `/jobs` is public; signed-in `/jobs` is authenticated |
| onboarding separation | PASS | `/onboarding/identity-type` uses focused onboarding mode |
| forbidden Shell inventory | PASS | no Search, unfinished modules, aggregates, RELU destination, or placeholders |
| no-write scan | PASS | no mutation/write handler patterns found in Shell/navigation implementation |
| diff whitespace | PASS | `git diff --check` returned no errors |

The first standard build attempt encountered a transient Turbopack CSS worker timeout. A webpack build passed immediately, and the standard Turbopack build then passed on retry. No code change was required for the retry.

The proof report is:

- `docs/proof/exec78/exec78f1/browser-proof.json`

## E. Screenshots And Evidence Inventory

### Required Desktop

- [Dashboard](docs/proof/exec78/exec78f1/screenshots/desktop-dashboard.png)
- [Opportunities](docs/proof/exec78/exec78f1/screenshots/desktop-opportunities.png)
- [Projects](docs/proof/exec78/exec78f1/screenshots/desktop-projects.png)
- [Messages](docs/proof/exec78/exec78f1/screenshots/desktop-messages.png)
- [Notifications](docs/proof/exec78/exec78f1/screenshots/desktop-notifications.png)

### Required Mobile

- [Dashboard](docs/proof/exec78/exec78f1/screenshots/mobile-dashboard.png)
- [Opportunities](docs/proof/exec78/exec78f1/screenshots/mobile-opportunities.png)
- [Projects](docs/proof/exec78/exec78f1/screenshots/mobile-projects.png)
- [Messages](docs/proof/exec78/exec78f1/screenshots/mobile-messages.png)
- [Notifications](docs/proof/exec78/exec78f1/screenshots/mobile-notifications.png)

### Supplemental

- [1024px desktop More menu](docs/proof/exec78/exec78f1/screenshots/desktop-1024-more.png)
- [320px mobile More sheet](docs/proof/exec78/exec78f1/screenshots/mobile-320-more.png)
- [Mobile account menu](docs/proof/exec78/exec78f1/screenshots/mobile-account-menu.png)

All required route screenshots reported:

- correct active destination
- authenticated shell mode
- 64-pixel header
- zero authenticated Search inputs
- zero forbidden Shell text
- zero horizontal overflow
- zero layout shift on desktop hover
- zero console errors
- zero page errors

## F. Accessibility Verification

Verified:

- semantic navigation landmarks with accessible labels
- `aria-current="page"` for active destinations
- visible keyboard focus styles
- icon-only Notification and account controls have accessible names
- account and overflow controls expose expanded state
- account and desktop overflow menus close with Escape
- mobile `More` is a labeled modal dialog
- mobile dialog receives focus, traps Tab focus, and restores focus on close
- mobile touch targets are at least 44 pixels
- five equal mobile slots remain readable at 320 pixels
- Notification badge includes unread screen-reader context
- active state uses more than color alone

## G. Known Limitations And Risks

1. Notification badge refresh is eventually consistent. It refreshes on navigation, focus, and every 60 seconds; Notification actions do not currently broadcast a shared client event.
2. The existing global `MessagingDock` remains independent from the new shell by contract. It may warrant a later ownership and responsive-placement review.
3. Lint retains 21 pre-existing warnings outside the changed shell files.
4. The first Turbopack build attempt timed out in its CSS worker, although both webpack and the subsequent standard Turbopack build passed.
5. Public discovery routes use authentication state to select presentation. Their content and route semantics remain unchanged, but this boundary requires continued regression coverage.

## H. Rollback Assessment

Rollback is isolated and reversible:

1. Revert `AppShell.tsx`, `Header.tsx`, and `MobileNavigation.tsx`.
2. Remove `AuthenticatedNavbar.tsx`, `AuthenticatedAccountMenu.tsx`, `ShellIcon.tsx`, and `authenticated-navigation.ts`.
3. Restore unconditional public Header/Footer/MobileNavigation composition.
4. Remove EXEC-78F.1 proof artifacts and documentation entries if the implementation is fully withdrawn.

No database, API, route, permission, authentication, authorization, or domain rollback is required.

## I. Final Verdict

EXEC-78F.1 PASS WITH RISKS
