# EXEC-78F.1D Responsive Device Certification & Shell Hardening

Date: 2026-06-06

Verdict: `PASS WITH RISKS`

## A. Executive Summary

EXEC-78F.1D certifies the authenticated Shell across desktop, compact desktop, tablet portrait, tablet landscape, mobile portrait, and mobile narrow viewports.

The certification confirms:

- 64-pixel authenticated header across every viewport
- exact navigation breakpoint behavior
- no horizontal overflow
- visible active states
- Companies and Professionals as the only compact `More` destinations
- aligned Notification badge and avatar controls
- correct forward and reverse keyboard order
- Escape dismissal and focus restoration
- mobile modal focus trapping
- sticky header and fixed mobile bottom navigation
- safe mobile coexistence with the existing MessagingDock
- public, onboarding, and authenticated presentation separation

One hardening defect was found and resolved: desktop `More` and account menus dismissed with Escape but did not explicitly return focus to their trigger controls. Focus restoration is now implemented and certified.

No destinations, routes, APIs, schemas, permissions, guards, authentication, authorization, domain behavior, Workspace behavior, Notification logic, or Message logic were added or changed.

## B. Viewport Certification Matrix

| Class | Viewport | Header | Overflow | Navigation mode | Active state | More | Badge/avatar | Sticky/fixed | Result |
|---|---:|---|---|---|---|---|---|---|---|
| desktop | 1440x900 | 64px | none | full seven destinations | PASS | not required | aligned | sticky header | PASS |
| compact desktop | 1199x900 | 64px | none | compact plus More | PASS | Companies, Professionals | aligned | sticky header | PASS |
| tablet portrait | 768x1024 | 64px | none | compact plus More | PASS | correct | aligned | sticky header | PASS |
| tablet portrait | 820x1180 | 64px | none | compact plus More | PASS | correct | aligned | sticky header | PASS |
| tablet portrait | 834x1194 | 64px | none | compact plus More | PASS | correct | aligned | sticky header | PASS |
| tablet landscape | 1024x768 | 64px | none | compact plus More | PASS | correct | aligned | sticky header | PASS |
| tablet landscape | 1180x820 | 64px | none | compact plus More | PASS | correct | aligned | sticky header | PASS |
| tablet landscape | 1194x834 | 64px | none | compact plus More | PASS | correct | aligned | sticky header | PASS |
| mobile portrait | 390x844 | 64px | none | top header plus five-slot bottom nav | PASS | modal sheet | aligned | header and bottom nav fixed | PASS |
| mobile narrow | 320x720 | 64px | none | top header plus five-slot bottom nav | PASS | modal sheet | aligned | header and bottom nav fixed | PASS |

Machine-readable evidence:

- `docs/proof/exec78/exec78f1d/certification.json`

## C. Tablet Results

All six required tablet viewports passed:

- `768x1024`
- `820x1180`
- `834x1194`
- `1024x768`
- `1180x820`
- `1194x834`

For every viewport:

- header height remained exactly 64 pixels
- full desktop navigation remained hidden
- mobile bottom navigation remained hidden
- compact destinations were Dashboard, Opportunities, Projects, Messages, Notifications
- `More` contained Companies and Professionals only
- active Dashboard state was visible through `aria-current="page"`
- Notification badge stayed within header bounds
- Notification and avatar vertical centers differed by no more than one pixel
- no horizontal overflow occurred
- Escape dismissed `More` and account menus
- focus returned to the originating control
- sticky header remained at viewport position `y = 0` after scrolling
- no console errors or page errors occurred

## D. Responsive Breakpoint Verification

| Width | Expected | Full navigation | Compact navigation | Mobile navigation | Result |
|---:|---|---|---|---|---|
| 767px | mobile | hidden | hidden | visible | PASS |
| 768px | compact | hidden | visible | hidden | PASS |
| 1199px | compact | hidden | visible | hidden | PASS |
| 1200px | full | visible | hidden | hidden | PASS |

No breakpoint leakage was detected.

## E. Accessibility Results

### Keyboard Order

Compact desktop forward order:

1. OpenStaff Dashboard
2. Dashboard
3. Opportunities
4. Projects
5. Messages
6. Notifications
7. More
8. Open account menu

Reverse `Shift+Tab` order was the exact inverse through the Shell controls.

### Menu And Modal Behavior

- desktop `More` exposes `aria-expanded`
- account menu exposes `aria-expanded`
- mobile `More` exposes `aria-expanded` and `aria-haspopup="dialog"`
- active destinations expose `aria-current="page"`
- desktop `More` closes with Escape and restores focus
- account menu closes with Escape and restores focus
- mobile dialog receives initial focus
- `Shift+Tab` from the first control wraps to the last
- `Tab` from the last control wraps to the first
- Escape closes the mobile dialog and restores focus to `More`

### Screen Reader And Focus

- navigation landmarks have distinct accessible names
- icon-only Notifications, account, and close controls have accessible labels
- Notification badge announces unread context
- visible focus rings are present on links, buttons, menus, and modal actions
- active state is communicated by semantics and visual treatment, not color alone

## F. Sticky, Overlay, And Safe-Area Results

Desktop and tablet:

- header remained sticky at the top after full-page scroll
- menus rendered above page content
- menu dismissal did not alter page position

Mobile:

- header remained fixed at the viewport top
- bottom navigation remained fixed at the viewport bottom
- content retained bottom spacing
- the `env(safe-area-inset-bottom)` rule remained applied
- modal overlay covered the viewport and locked body scrolling
- MessagingDock button remained above the bottom navigation without overlap at 390x844 and 320x720

The test environment reported a zero-pixel safe-area inset, as expected in headless Chromium; the CSS safe-area expression remained present and layout-safe.

## G. Visual Regression Evidence

### Desktop

- [Dashboard](docs/proof/exec78/exec78f1d/screenshots/desktop-dashboard.png)
- [Opportunities](docs/proof/exec78/exec78f1d/screenshots/desktop-opportunities.png)
- [Projects](docs/proof/exec78/exec78f1d/screenshots/desktop-projects.png)

### Tablet Portrait

- [Dashboard](docs/proof/exec78/exec78f1d/screenshots/tablet-portrait-dashboard.png)
- [Projects](docs/proof/exec78/exec78f1d/screenshots/tablet-portrait-projects.png)
- [More open](docs/proof/exec78/exec78f1d/screenshots/tablet-portrait-more-open.png)

### Tablet Landscape

- [Dashboard](docs/proof/exec78/exec78f1d/screenshots/tablet-landscape-dashboard.png)
- [Projects](docs/proof/exec78/exec78f1d/screenshots/tablet-landscape-projects.png)
- [More open](docs/proof/exec78/exec78f1d/screenshots/tablet-landscape-more-open.png)

### Mobile

- [Dashboard](docs/proof/exec78/exec78f1d/screenshots/mobile-dashboard.png)
- [Projects](docs/proof/exec78/exec78f1d/screenshots/mobile-projects.png)
- [More open](docs/proof/exec78/exec78f1d/screenshots/mobile-more-open.png)

## H. Validation Results

| Validation | Result |
|---|---|
| responsive certification script | PASS |
| original EXEC-78F.1 browser proof regression | PASS |
| TypeScript | PASS |
| lint | PASS with 21 existing warnings and 0 errors |
| Turbopack production build run 1 | PASS |
| Turbopack production build run 2 | PASS |
| all 58 routes generated | PASS |
| diff whitespace | PASS |

Certification command:

```powershell
node docs/proof/exec78/exec78f1d-responsive-certification.cjs
```

## I. Risk Resolution Review

| Risk | Classification | Assessment |
|---|---|---|
| Notification badge eventual consistency | Requires Future Work | current endpoint ownership is correct; navigation/focus/60-second refresh is acceptable for Shell, but domain-driven real-time invalidation remains future Notification work |
| MessagingDock coexistence | Mitigated | 390px and 320px geometry proves the dock remains above mobile navigation; ownership and future consolidation remain outside this phase |
| Turbopack timeout reproducibility | Mitigated | the earlier worker timeout did not reproduce; two consecutive F.1D Turbopack builds passed, alongside prior successful standard and webpack builds |
| public/authenticated presentation boundary | Mitigated | signed-in `/` remains public, signed-out `/jobs` remains public, signed-in `/jobs` is authenticated, and onboarding remains focused |

## J. Files Changed

Created:

- `EXEC78F1D_RESPONSIVE_DEVICE_CERTIFICATION.md`
- `docs/proof/exec78/exec78f1d-responsive-certification.cjs`
- `docs/proof/exec78/exec78f1d/certification.json`
- 12 screenshots under `docs/proof/exec78/exec78f1d/screenshots`

Hardened:

- `apps/admin/web/components/layout/AuthenticatedNavbar.tsx`
- `apps/admin/web/components/layout/AuthenticatedAccountMenu.tsx`

Updated for reusable proof setup:

- `docs/proof/exec78/exec78f1-browser-proof.cjs`

Updated:

- `STATUS.md`
- `docs/proof/exec78/README.md`

## K. Rollback Impact

The hardening rollback is limited to two focus-restoration changes:

- remove the desktop `More` trigger ref and Escape focus return
- remove the account trigger ref and Escape focus return

Certification scripts, screenshots, and documentation may be removed independently.

No route, API, schema, permission, guard, authentication, authorization, Workspace, Notification-domain, or Message-domain rollback is required.

## L. Final Verdict

EXEC-78F.1D PASS WITH RISKS
