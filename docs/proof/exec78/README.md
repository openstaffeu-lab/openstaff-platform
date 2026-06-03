# EXEC-78 Proof

Last updated: 2026-06-03

Verdict: `OWNER APPROVED FOR EXEC-78C.3 IMPLEMENTATION; architecture, workflow, UX, and readiness blueprint is complete and owner approval has been recorded for account/identity separation, compliance wording, geography source of truth, publishing rights, RELU extraction boundaries, and password/2FA policy`

## EXEC-78C.3A Owner Approval

Owner approval was recorded on 2026-06-03 with the following direction:

1. Account creation must be authentication-only.
2. Account should activate after email verification.
3. Professional Identity, Company Identity, and Both must be supported.
4. Profile, company, and public visibility require approval.
5. RELU AI assists extraction, drafting, taxonomy mapping, compliance analysis, and recommendations.
6. RELU AI never approves, certifies, publishes, or bypasses human review.
7. Manual fallback remains available but should not be the primary profile creation experience.
8. Publishing lifecycle must support Draft, Ready For Review, Submitted, Approved, Published, Live, Paused, Archived, and Deleted.
9. Geography must use OpenStaff canonical IDs enhanced by Google Places, not replaced by Google Places.
10. Compliance wording must remain assistance/readiness only, not legal certification.
11. Password policy should move toward minimum 8 characters plus uppercase, lowercase, and number for new passwords.
12. Email OTP remains default 2FA now; authenticator app is future; SMS OTP requires later cost/privacy approval.

EXEC-78D planning may proceed from this approved blueprint. No implementation was started in EXEC-78C.3A.

## EXEC-78C.3 Scope

EXEC-78C.3 is an architecture, workflow, UX, and readiness audit only. No redesign work, deployment, backend business logic, permissions, payment logic, or RELU core logic changed.

The pass realigns OpenStaff around the approved product model:

- Professional Network
- Opportunity Feed
- Contractor Ecosystem
- Procurement Platform
- Compliance Layer
- RELU AI Workspace

The blueprint separates account authentication from professional/company identity, public profile visibility, compliance evidence, publishing lifecycle, moderation, geography, and RELU-assisted drafting.

See `EXEC78C3_IDENTITY_PROFILE_COMPLIANCE_ARCHITECTURE.md` for the complete blueprint.

## EXEC-78C.3 Files Created

- `EXEC78C3_IDENTITY_PROFILE_COMPLIANCE_ARCHITECTURE.md`

## EXEC-78C.3 Files Updated

- `STATUS.md`
- `docs/proof/exec78/README.md`

## EXEC-78C.3 Architecture Findings

| Area | Finding |
|---|---|
| account | current registration creates account, profile, identity, company identity, onboarding, and subscription records together; target account model should be authentication-only |
| account approval | current account approval overlaps with identity/profile approval; target account should activate after email verification and not require admin approval |
| 2FA | current implementation supports email OTP and recovery-code behavior; SMS OTP and authenticator app remain future decisions |
| identity | target model should let users choose Professional Identity, Company Identity, or Both after account activation |
| RELU profile extraction | RELU should extract profile/company data from documents and links, map to NACE/ESCO/Uniclass, and produce reviewable drafts only |
| compliance | current generic compliance evidence model is a foundation, but EU/UK/Ireland/Nordics evidence types and reviewer boundaries need owner-approved product policy |
| geography | current country/region/city coverage is readiness-level only; production needs canonical country, region, county/admin2, city, locality, postal code, alias, and external mapping layers |
| publishing | current public post visibility uses public/private, moderation status, and free-form status; target lifecycle needs Draft through Deleted with explicit owner/moderator control |
| dashboard | target dashboard should become an operating console for account, identity, profile, company, compliance, publishing, and RELU queues |
| visibility | public availability should be computed from account, identity, profile/company, moderation, lifecycle, compliance policy, and visibility settings |
| password | visible copy and new password flows are aligned to 8 characters; recommended future policy adds uppercase, lowercase, and number requirements |

## EXEC-78C.3 Validation

This was a documentation-only pass. Build, lint, tests, browser automation, Cloud Run, database, schema, and migration validation were not run because no executable code, UI, backend, schema, route, permission, payment, or RELU implementation changed.

## EXEC-78C.3 Final Recommendation

Verdict: `OWNER APPROVED FOR IMPLEMENTATION`.

EXEC-78D planning may proceed from the owner-approved account/identity split, identity approval boundaries, compliance wording, geography source-of-truth strategy, publishing lifecycle permissions, RELU extraction boundaries, and password/2FA policy.

## EXEC-78C.2 Scope

EXEC-78C.2 remediated the owner/superadmin flow across login copy, post-login routing, dashboard state logic, public profile unavailable reasons, structured location matching, taxonomy selector readability, and publish lifecycle actions.

Validation passes for web build/lint and API build/lint/tests. Final PASS is not claimed because local browser automation could not be completed in this environment and real owner/Google-key production proof remains pending.

See `docs/proof/exec78/EXEC78C2_OWNER_FLOW_REMEDIATION.md` for the full discovery matrix, changed files, validation results, and remaining risks.

## EXEC-78C.1B Scope

EXEC-78C.1B added a reusable Google Places-based location autocomplete foundation for the public web app.

OpenStaff location autocomplete is an enhancement layer only. Existing manual country, region, city, locality, VAT, currency, and location fields remain usable if Google is unavailable or if a form is not ready for deeper integration.

Integration into existing flows must remain incremental and only happen where the current form structure allows it safely, without introducing risk.

## EXEC-78C.1B Files Created

- `apps/admin/web/lib/location/location-types.ts`
- `apps/admin/web/lib/location/parseGooglePlace.ts`
- `apps/admin/web/lib/location/googleMapsLoader.ts`
- `apps/admin/web/hooks/useLocationAutocomplete.ts`
- `apps/admin/web/components/location/LocationAutocomplete.tsx`
- `docs/proof/exec78/EXEC78C1B_LOCATION_AUTOCOMPLETE.md`

## EXEC-78C.1B Files Updated

- `apps/admin/web/package.json`
- `apps/admin/web/package-lock.json`
- `apps/admin/web/.env.example`
- `apps/admin/web/app/register/page.tsx`
- `apps/admin/web/app/onboarding/company/page.tsx`
- `apps/admin/web/app/profile/page.tsx`
- `apps/admin/web/app/publish/page.tsx`
- `apps/admin/web/components/projects/ProjectWorkspaceForm.tsx`
- `docs/proof/exec78/README.md`
- `STATUS.md`

## EXEC-78C.1B Google Cloud Requirements

Required APIs:

- Maps JavaScript API
- Places API New

Geocoding API is not required by this implementation and should only be enabled if a future flow needs it.

The browser key is configured through `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. The key must be HTTP-referrer restricted to `https://openstaff.eu/*`, `https://www.openstaff.eu/*`, and approved localhost development origins only when needed. API restrictions should allow only Maps JavaScript API and Places API.

No key value is committed or documented.

## EXEC-78C.1B Validation

| Gate | Status | Evidence |
|---|---|---|
| package | PASS | `@googlemaps/js-api-loader` added in `apps/admin/web` with lockfile update |
| parser | PASS | normalizes place ID, formatted address, locality, region, country, country code, lat/lng, sanitized types, and confidence |
| loader | PASS | uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, caches Places library loading, and returns UI-safe missing-key/load errors |
| hook | PASS | debounced autocomplete, session tokens, European-first global bias, country/default-country options, details-on-selection only |
| component | PASS | accessible combobox/listbox UI with loading, empty, error, selected summary, keyboard support, and manual fallback text |
| integrations | PASS | low-risk wiring in register, company onboarding, profile service area, publish location label, and project create/edit location |
| build | PASS | `apps/admin/web -> npm.cmd run build` exited `0` |
| lint | PASS | `apps/admin/web -> npm.cmd run lint` exited `0`; 0 errors, existing warnings only |

See `docs/proof/exec78/EXEC78C1B_LOCATION_AUTOCOMPLETE.md` for the full proof.

## EXEC-78A Scope

EXEC-78A was completed as an architecture, strategy, audit, and documentation-only pass.

No implementation was started.

## Files Created

- `EXEC78A_PRODUCT_ARCHITECTURE.md`
- `docs/proof/exec78/README.md`

## Files Updated

- `STATUS.md`

## Audit Inputs

| Area | Evidence |
|---|---|
| Homepage messaging | `apps/admin/web/app/page.tsx` currently positions OpenStaff around projects, professionals, NACE, RELU AI, approved project feed, verified network, and operational delivery. |
| Pricing implementation | `apps/admin/web/app/pricing/pricing-page-client.tsx` renders plan cards from `/plans`, uses BASIC/BRONZE/GOLD/ENTERPRISE codes, manual upgrade requests, private contact counts, and RELU AI capability copy. |
| Pricing constants | `apps/admin/web/lib/constants/pricing.ts` also defines FREE/PRO/BUSINESS/ENTERPRISE labels, creating a product naming mismatch that needs decision before implementation. |
| Subscription backend | `apps/admin/api/src/subscriptions/subscriptions.service.ts` exposes active plans, maps entitlements, records manual upgrade requests, and keeps billing operator-reviewed. |
| Plan seed values | `apps/admin/api/prisma/seed.ts` seeds BASIC, BRONZE, GOLD, and ENTERPRISE with private contact limits of 5, 25, 100, and unlimited respectively. |
| Messaging enforcement | `apps/admin/api/src/private-messaging/private-messaging.service.ts` enforces `PRIVATE_CONTACTS_PER_MONTH`. |
| Public feed rules | `apps/admin/api/src/public-posts/public-posts.service.ts` exposes only `PUBLIC`, `APPROVED`, `LIVE` posts to anonymous/public readers. |
| Public feed types | Prisma currently supports `PROJECT`, `PROFESSIONAL`, and `SUBCONTRACTOR_POOL` public post types. |
| RELU product boundary | `docs/RELU_AI_PRODUCTIZATION_BASELINE.md` defines RELU as advisory, editable, and human-approved. |
| Funnel and upgrade tracking | `docs/FUNNEL_VISIBILITY_BASELINE.md` documents registration, publish, upgrade, and moderation funnel events. |

## Decisions Captured

| Topic | Verdict | Notes |
|---|---|---|
| Current implementation | `KEEP CURRENT` | No product code should change in EXEC-78A. |
| Homepage messaging | `MODIFY COPY` | The requested headline/subtitle are directionally useful but understate procurement, opportunity discovery, compliance, and RELU AI. |
| Pricing architecture | `REQUIRE PRODUCT DECISION` | Starter/Professional/Business/Enterprise need approved mapping to existing BASIC/BRONZE/GOLD/ENTERPRISE and FREE/PRO/BUSINESS/ENTERPRISE concepts. |
| Feed architecture | `REQUIRE PRODUCT DECISION` | Ranking weights, promotion rules, visibility tiers, and RELU ranking authority need approval before implementation. |
| RELU monetization | `REQUIRE PRODUCT DECISION` | Usage quotas, task entitlements, overage rules, and provider-cost controls must be defined before enforcement. |
| Compliance claims | `REQUIRE PRODUCT DECISION` | A1, PPS, ID06, CSCS, CIS, UTR, and regional requirements need conservative product/legal wording. |

## Hard Constraint Proof

| Constraint | Status |
|---|---|
| No UI changes | PASS |
| No backend changes | PASS |
| No schema changes | PASS |
| No route changes | PASS |
| No permission changes | PASS |
| No pricing implementation | PASS |
| No RELU code changes | PASS |
| Do not start EXEC-78B | PASS |

## Validation

This was a documentation-only pass. Build, lint, tests, Cloud Run, database, and browser validation were not run because no executable code, UI, backend, schema, route, permission, pricing, or RELU implementation changed.

## Final Recommendation

OpenStaff should use `EXEC78A_PRODUCT_ARCHITECTURE.md` as the product architecture baseline before any future Pricing redesign, feed ranking implementation, subscription enforcement, visibility restriction, homepage restructuring, or enterprise rollout.

Next implementation remains blocked until the open product decisions in EXEC-78A are approved.

## EXEC-78A.1 Scope

EXEC-78A.1 converts the open product decisions from EXEC-78A into an owner-approval decision matrix.

No implementation was started.

## EXEC-78A.1 Files Created

- `EXEC78A1_PRODUCT_DECISION_MATRIX.md`

## EXEC-78A.1 Files Updated

- `docs/proof/exec78/README.md`
- `STATUS.md`

## EXEC-78A.1 Decisions Captured

| Topic | Decision |
|---|---|
| Homepage messaging | `MODIFY COPY`; use procurement/workforce/RELU AI positioning and keep `Professional Networks Connected` only as optional secondary copy. |
| Homepage feed ranking | Prioritize geography, language, user interest, RELU relevance, verification/completeness, recency, then capped/labeled promotion. |
| Pricing plan names | Starter, Professional, Business, Enterprise. |
| Active post limits | 1, 5, 25, custom/unlimited by contract. |
| Contact limits | 5/month, 25/month, 100/month, custom/unlimited fair-use. |
| Promoted content | 0/month, 1/month, 5/month, managed campaigns. |
| RELU credits | 20/month, 150/month, 1000/month, contract-defined. |
| Compliance wording | Assistance/readiness only; no legal certification claim. |
| Enterprise boundary | Multi-company, multi-country, procurement teams, ERP/API, high-volume publishing/contact, compliance workflows, custom RELU, managed onboarding. |

## EXEC-78A.1 Hard Constraint Proof

| Constraint | Status |
|---|---|
| No UI changes | PASS |
| No backend changes | PASS |
| No schema changes | PASS |
| No route changes | PASS |
| No permissions changes | PASS |
| No pricing implementation | PASS |
| No RELU code changes | PASS |
| Do not start EXEC-78B | PASS |

## EXEC-78A.1 Validation

This was a documentation-only decision-matrix pass. Build, lint, tests, Cloud Run, database, and browser validation were not run because no executable code, UI, backend, schema, route, permission, pricing, or RELU implementation changed.

## EXEC-78A.1 Final Recommendation

Verdict: `REQUIRE OWNER APPROVAL`.

The decision matrix is specific enough to scope EXEC-78B, but EXEC-78B should not begin until the owner approves or revises the recommended homepage messaging, feed ranking order, plan limits, visibility rules, RELU limits, compliance wording, and Enterprise boundary.

## EXEC-78B.1 Scope

EXEC-78B.1 corrected the live public homepage copy, enterprise-blue palette, and public feed reality after the production visual audit returned `FAIL`.

This was a focused public web alignment pass.

No backend API, Prisma schema, migration, guard, permission, RELU Builder logic, API Cloud Run service, payment logic, pricing enforcement, route architecture, or workflow behavior was changed.

## EXEC-78B.1 Files Created

- `docs/proof/exec78/EXEC78B1_PRODUCTION_HOMEPAGE_ALIGNMENT.md`

## EXEC-78B.1 Files Updated

- `apps/admin/web/app/page.tsx`
- `apps/admin/web/lib/api.ts`
- `docs/proof/exec78/README.md`
- `STATUS.md`

## EXEC-78B.1 Production Proof Summary

| Area | Status | Evidence |
|---|---|---|
| homepage headline | PASS | production renders `Professional Networks Connected` |
| homepage subtitle | PASS | production renders `Connect companies and professionals through one intelligent workspace.` |
| badge | PASS | production keeps `AI-POWERED PROCUREMENT & STAFFING` |
| header/hero/footer palette | PASS | production computed styles return header/hero/footer `#1E3A8A`; footer bottom `#172554` |
| CTA colors | PASS | production computed styles return Explore `#2563EB`; Publish `#10B981` |
| public feed cleanup | PASS | frontend public-list filter hides records containing obvious internal labels such as Exec, proof, test, demo, mock, and sandbox |
| local validation | PASS with warnings | `apps/admin/web -> npm.cmd run build` passed; `npm.cmd run lint` exited `0` with 21 existing warnings |
| Cloud Build | PASS | final build `8fc05dd6-130b-44ac-99b9-76f7767e969e` succeeded using `apps/admin/web/cloudbuild.web.yaml` |
| Cloud Run | PASS | `openstaff-web-00031-wq4` is READY with 100% traffic |
| browser audit | PASS | desktop/mobile checks for `/`, `/projects`, `/professionals`, `/pricing`, `/companies`, `/login`, `/register`, and `/jobs` had no console errors, page errors, unexpected 4xx/5xx, flagged proof/test cards, or mobile overflow |

## EXEC-78B.1 Remaining Risks

1. Proof/internal records are hidden from public frontend list surfaces but still exist in production data until a separate backend/admin cleanup pass.
2. Direct detail URLs for known proof/internal records may still resolve if users already know the ID or slug, because backend detail access was out of scope.
3. `/projects` remains an authenticated workspace route; `/jobs` remains the public opportunity list.
4. Lint still reports 21 existing warnings and 0 errors.

## EXEC-78B.1 Final Decision

Verdict: `PASS`.

EXEC-78B.2 was not started.
