# OpenStaff Design System Specification

Version: `v0.1`
Date: `2026-05-06`
Scope: `Front-end public + Backoffice`
Status: `For visual approval before implementation`

## 1. Product Intent

OpenStaff is positioned as a European workforce platform with two complementary surfaces:

- `openstaff.eu`: the public marketplace layer for discovery, trust, onboarding, and conversion
- `backoffice.openstaff.eu`: the operational control center for contracts, moderation, AI orchestration, roles, and platform health

The design language must communicate:

- industrial trust
- operational clarity
- cross-border scale
- verified work relationships
- controlled automation through AI

The visual system should feel more like a serious infrastructure product than a generic job board.

## 2. Design Principles

1. `Structured confidence`
   Interfaces should feel deliberate, ordered, and enterprise-safe.

2. `Human + operational`
   Public pages should feel warm and opportunity-driven; backoffice should feel precise and command-oriented.

3. `Dense, not noisy`
   Information-rich surfaces are encouraged, but hierarchy must remain obvious.

4. `AI as an operator, not a gimmick`
   Gemini / Relu surfaces should look like managed systems, not novelty widgets.

5. `Composable CMS-first thinking`
   Brand, hero, navigation, footer, and promotion surfaces should be manageable as content modules.

## 3. Brand Foundation

Source-aligned tokens already present in code:

- Navy: `#1B2A6B`
- Navy Light: `#2A3F9F`
- Mint: `#00E87A`
- Mint Dark: `#00C060`
- Surface BG: `#F0F2F8`
- Card BG: `#FFFFFF`
- Muted Text: `#8892B0`
- Danger: `#E53E3E`
- Warning: `#F6AD55`
- Info: `#3B82F6`

### Tone split

- Public front-end: bright, optimistic, European, opportunity-led
- Backoffice: dark-shell, mission-control, real-time, secure

## 4. Typography

Recommended hierarchy based on current implementation direction:

- Display / Headline: `Montserrat`
- UI / Body / Forms: `Inter`

### Type scale

- Display XL: `56/60`, weight `800`
- Display L: `48/54`, weight `800`
- H1: `36/42`, weight `700`
- H2: `28/34`, weight `700`
- H3: `22/28`, weight `700`
- Body L: `18/30`, weight `400`
- Body: `16/26`, weight `400`
- Body S: `14/22`, weight `500`
- Label XS: `12/18`, weight `600`, uppercase tracking

## 5. Spacing and Layout

### Spacing scale

- `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

### Radius scale

- Input / small chip: `12`
- Card / panel: `20`
- Hero surface / modal / dashboard rail: `28`

### Shadows

- Public cards: soft atmospheric shadow
- Admin panels: lower blur, stronger edge contrast

### Grid

- Public page container: `max-width 1240px`
- Admin content container: `max-width 1440px`
- Dashboard KPI grid: `4` columns desktop, `2` tablet, `1` mobile

## 6. Surface Model

### Public

- Layer 0: soft radial gradients
- Layer 1: white or frosted white surfaces
- Layer 2: strong navy hero blocks
- Accent: mint for CTAs and state emphasis

### Backoffice

- Layer 0: deep navy/ink background
- Layer 1: elevated dark panels
- Layer 2: light data cards on dark canvas
- Accent: cyan or mint for active states, warnings in amber, blockers in red

## 7. UI Kit

### 7.1 Buttons

#### Primary CTA

- Background: mint
- Text: navy
- Radius: `16`
- Weight: `700`
- Usage: registration, create, approve, move-forward actions

#### Secondary CTA

- Background: transparent / white
- Border: navy
- Text: navy
- Usage: explore, learn more, view details

#### Admin Primary

- Background: cyan or mint
- Text: near-black
- Usage: save, publish, trigger AI actions

#### Danger Button

- Background: `#E53E3E`
- Text: white
- Usage: delete, revoke, block

### 7.2 Inputs and Forms

Form language:

- rounded `16-20px`
- clear border contrast
- strong focus ring in mint/cyan
- helper text always visible for critical flows
- error state uses border + message + icon

Form sections:

- authentication
- actor verification
- contract approval
- AI configuration
- CMS link / banner management

### 7.3 Cards

#### Category Card

- used in public homepage
- icon + label + short descriptor

#### Job Card

- title, location, category, contract type, pay band, urgency

#### Professional Card

- avatar, verified badge, trades, languages, availability

#### KPI Card

- label
- value
- delta or context
- color rail

#### Control Card

- used in dashboard for moderation, AI queue, unresolved issues

## 8. High-Fidelity Mockup Specification

## 8.1 Public Home Page

### Goal

Make `openstaff.eu` feel like the trusted entry point for European project staffing.

### Required sections

1. Top navigation
   - logo
   - sectors
   - professionals
   - projects
   - compliance
   - AI assistant
   - login / register

2. Hero
   - large statement around global work structure
   - trust metrics
   - dual CTAs
   - side panel with live market snapshot

3. Sector grid
   - Data Center
   - Photovoltaic
   - HoReCa
   - Environment
   - Construction
   - PCB Design
   - Logistics

4. Featured projects
   - live cards
   - urgency / verification states

5. Verified professionals
   - featured talent strips

6. Platform proof
   - how verification works
   - contract assurance
   - AI support

7. Footer
   - dynamic legal, contact, partner, policy, social modules

## 8.2 Backoffice Dashboard

### Goal

Make `backoffice.openstaff.eu` feel like a central operations cockpit for staffing, moderation, contracts, finance, and AI systems.

### Required sections

1. Left rail
   - persistent navigation
   - system status summary

2. Top header
   - page title
   - environment indicator
   - role badge
   - search / quick actions / notifications

3. KPI row
   - active projects
   - pending contracts
   - professionals awaiting review
   - unresolved incidents
   - Relu queue
   - Gemini action volume

4. Operations board
   - moderation queue
   - contract pipeline
   - new posts / media / comments
   - cross-border alerts

5. AI governance panel
   - Gemini agent health
   - Relu queue
   - fallback / failure state

6. CMS quick-edit panel
   - homepage hero
   - banners
   - footer links
   - legal link sets

## 9. CMS Modular Structure

The CMS must manage global presentation without code changes for common content operations.

### Core entities

#### `site_settings`

- platform name
- support email
- primary phone
- social links
- legal entity info
- footer copyright

#### `brand_assets`

- primary logo
- inverse logo
- favicon
- monochrome mark
- logo usage notes

#### `hero_blocks`

- page key
- eyebrow
- title
- subtitle
- primary CTA label/url
- secondary CTA label/url
- background media
- trust metrics
- status

#### `banner_slots`

- slot key
- page placement
- headline
- body
- CTA label/url
- variant
- start date
- end date
- active flag

#### `footer_link_groups`

- group title
- sort order
- visibility rules

#### `footer_links`

- group id
- label
- url
- external/internal
- locale
- sort order

#### `navigation_items`

- surface: public/admin
- label
- target
- icon
- visibility by role
- feature flag
- sort order

#### `ui_announcements`

- severity
- message
- CTA
- target surface
- display window

## 10. Component Architecture

Recommended reusable component groups:

### Public

- `PublicShell`
- `HeroPanel`
- `TrustMetric`
- `SectorCard`
- `ProjectCard`
- `ProfessionalCard`
- `SectionHeader`
- `BannerStrip`
- `FooterLinkGroup`

### Backoffice

- `AdminShell`
- `AdminHeader`
- `SidebarNav`
- `KpiCard`
- `QueueCard`
- `DataTable`
- `InlineStatusBadge`
- `ControlPanelCard`
- `CmsQuickEditCard`

### Shared primitives

- `Button`
- `Input`
- `Select`
- `Textarea`
- `Checkbox`
- `RadioGroup`
- `Tabs`
- `Modal`
- `Drawer`
- `Toast`
- `EmptyState`
- `ErrorState`
- `Skeleton`

## 11. States and Behavior

Every major screen should define:

- loading
- empty
- partial failure
- unauthorized
- degraded API
- successful data state

This is especially important for:

- AI Control
- Public Posts moderation
- Contracts
- Professionals review
- CMS blocks

## 12. Accessibility

Minimum baseline:

- AA contrast
- visible focus states
- keyboard navigation
- semantic tables
- aria labels for action buttons
- readable empty/error states

## 13. Approval Gate Before Implementation

Implementation must not begin until these are approved:

1. Public Home Page mockup
2. Backoffice Dashboard mockup
3. UI Kit primitives
4. CMS module map

Validation flow:

1. Review locally
2. Adjust layout/content hierarchy
3. Approve mockups
4. Then implement
5. Then commit
6. Then deploy

## 14. Local Preview Deliverables

This specification is paired with local visual mockups:

- `docs/design-system/mockups/home-page.html`
- `docs/design-system/mockups/dashboard.html`
- `docs/design-system/mockups/styles.css`

These are approval artifacts only and should be reviewed before production implementation.
