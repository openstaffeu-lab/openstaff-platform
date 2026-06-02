# EXEC-78B.1 Production Homepage Alignment

Date: 2026-06-02

Verdict: `PASS`

## Executive Summary

EXEC-78B.1 corrected the live public web reality for `https://openstaff.eu` after the visual reality audit failed the previous production state.

The public web now renders the required homepage headline and subtitle, uses the approved enterprise-blue palette for the live header, hero, and footer, uses the required blue and green CTA colors, suppresses obvious proof/internal marketplace records from public list surfaces through frontend filtering, and is deployed to production on `openstaff-web-00031-wq4`.

No backend API, Prisma schema, migration, guard, permission, RELU Builder logic, API Cloud Run service, payment logic, pricing enforcement, routing architecture, or workflow behavior was changed.

## Source Files Modified

| File | Purpose |
|---|---|
| `apps/admin/web/app/page.tsx` | Updated hero headline/subtitle and required `Publish now` CTA color. |
| `apps/admin/web/lib/api.ts` | Added public marketplace proof/internal-label suppression for public list responses. |
| `docs/proof/exec78/EXEC78B1_PRODUCTION_HOMEPAGE_ALIGNMENT.md` | Captures this proof. |
| `docs/proof/exec78/README.md` | Adds EXEC-78B.1 proof summary. |
| `STATUS.md` | Adds EXEC-78B.1 status closure. |

## Component Trace

| Component | Path | Result |
|---|---|---|
| Root layout | `apps/admin/web/app/layout.tsx` | Wraps public web in `AppShell`; unchanged. |
| App shell | `apps/admin/web/components/layout/AppShell.tsx` | Renders `Header`, route children, `Footer`, and `MobileNavigation`; unchanged. |
| Header | `apps/admin/web/components/layout/Header.tsx` | Renders `Navbar`; unchanged. |
| Navbar | `apps/admin/web/components/Navbar.tsx` | Already used the enterprise-blue branch state; included in deployed public web. |
| Homepage | `apps/admin/web/app/page.tsx` | Updated required copy and CTA color. |
| Footer | `apps/admin/web/components/layout/Footer.tsx` | Already used `#1E3A8A` main footer and `#172554` bottom bar; included in deployed public web. |
| Public feed API client | `apps/admin/web/lib/api.ts` | Filters obvious proof/internal marketplace records from public list responses. |
| Public project cards | `apps/admin/web/components/JobCard.tsx` | Receives filtered public project arrays; unchanged. |
| Public actor cards | `apps/admin/web/components/ActorCard.tsx` | Receives filtered public professional/subcontractor arrays; unchanged. |
| Public project list | `apps/admin/web/components/JobsPageClient.tsx` | Uses filtered `getMarketplaceFeed`; unchanged. |
| Public professional list | `apps/admin/web/app/professionals/page.tsx` | Uses filtered `getMarketplaceProfessionals`; unchanged. |

## Homepage Copy Proof

Production browser audit on `https://openstaff.eu/` returned:

| Field | Production value | Status |
|---|---|---|
| Badge | `AI-POWERED PROCUREMENT & STAFFING` | PASS |
| Headline | `Professional Networks Connected` | PASS |
| Subtitle | `Connect companies and professionals through one intelligent workspace.` | PASS |
| Primary CTA | `Explore` | PASS |
| Secondary CTA | `Publish now` | PASS |

The previous production headline `Your place where projects find the right professionals.` and long NACE/ESCO-heavy subtitle are no longer rendered.

## Live Color Proof

Production browser computed styles on `https://openstaff.eu/` returned:

| Surface | Computed production color | Required color | Status |
|---|---|---|---|
| Header background | `rgb(30, 58, 138)` / `#1E3A8A` | `#1E3A8A` | PASS |
| Hero background | `rgb(30, 58, 138)` / `#1E3A8A` | `#1E3A8A` | PASS |
| Footer background | `rgb(30, 58, 138)` / `#1E3A8A` | `#1E3A8A` | PASS |
| Footer bottom bar | `rgb(23, 37, 84)` / `#172554` | `#172554` | PASS |
| Explore CTA | `rgb(37, 99, 235)` / `#2563EB` | `#2563EB` | PASS |
| Publish CTA | `rgb(16, 185, 129)` / `#10B981` | `#10B981` | PASS |

## Public Feed Cleanup Proof

Frontend public list filtering was added in `apps/admin/web/lib/api.ts`.

The filter suppresses public marketplace list records when the searchable public fields contain obvious internal/proof labels:

- `Exec`
- `EXEC`
- `proof`
- `test`
- `demo`
- `mock`
- `sandbox`

Searched fields include `id`, `slug`, `title`, `description`, `summary`, `domain`, `location`, `ownerName`, `ownerType`, `value`, and public taxonomy code arrays.

Production browser audit found `flaggedCards = 0` and `obviousProofTextPresent = false` on:

- `/`
- `/jobs`
- `/professionals`
- `/companies` redirecting to `/professionals`

No production data was deleted. This pass only hides obvious internal/proof records from public list rendering through the existing public web frontend.

## Local Validation

Run from `apps/admin/web`:

| Command | Result |
|---|---|
| `npm.cmd run build` | PASS |
| `npm.cmd run lint` | PASS with 0 errors and 21 existing warnings |

## Deployment Proof

| Area | Proof |
|---|---|
| Cloud Build config | `apps/admin/web/cloudbuild.web.yaml` |
| Final Cloud Build ID | `8fc05dd6-130b-44ac-99b9-76f7767e969e` |
| Build status | `SUCCESS` |
| Deployed image | `europe-west1-docker.pkg.dev/openstaff-platform/openstaff-repo/openstaff-web:8fc05dd6-130b-44ac-99b9-76f7767e969e` |
| Cloud Run service | `openstaff-web` |
| Region | `europe-west1` |
| Latest ready revision | `openstaff-web-00031-wq4` |
| Traffic | `100%` to `openstaff-web-00031-wq4` |

An earlier same-task build `609aff9a-c7e0-4642-ae0f-ebde9cee53ee` also succeeded, but the final production revision is tied to `8fc05dd6-130b-44ac-99b9-76f7767e969e`.

## Production Browser Audit

Desktop and mobile Playwright audit covered:

- `/`
- `/projects`
- `/professionals`
- `/pricing`
- `/companies`
- `/login`
- `/register`
- `/jobs`

Result:

| Check | Result |
|---|---|
| Homepage headline/subtitle | PASS |
| Header/hero/footer enterprise-blue palette | PASS |
| CTA colors | PASS |
| Public proof/test card scan | PASS |
| Console errors | PASS, none |
| Page errors | PASS, none |
| Unexpected 4xx/5xx responses | PASS, none |
| Mobile horizontal overflow | PASS, none |
| `/companies` behavior | PASS, permanent redirect to `/professionals` remains intact |
| `/projects` behavior | PASS, redirects unauthenticated visitors to `/login?next=%2Fprojects` without browser errors |

## Remaining Risks

1. Proof/internal records still exist in production data; EXEC-78B.1 hides them from public frontend list surfaces only. Backend/admin cleanup should still be handled separately if owners want the data removed or moderated.
2. Direct detail URLs for a known proof/internal record may still resolve if a user already has the ID or slug. This pass did not change backend detail access because backend changes were explicitly out of scope.
3. `/projects` remains an authenticated workspace route and redirects anonymous users to login; `/jobs` remains the actual public opportunity list.
4. Lint still reports 21 existing warnings and 0 errors.

## Final Decision

EXEC-78B.1 is `PASS`.

Do not start EXEC-78B.2 until the owner explicitly scopes the next pass.
