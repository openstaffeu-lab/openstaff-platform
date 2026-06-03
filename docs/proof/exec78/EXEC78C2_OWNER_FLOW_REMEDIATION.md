# EXEC-78C.2 Owner Flow Remediation

Date: 2026-06-03

Verdict: `PARTIAL PASS`

EXEC-78C.2 stabilizes the owner/superadmin account, profile, public visibility, location, taxonomy, and publishing UX before real data population. The code-level remediation is complete and validation gates pass, but final PASS is not claimed because local browser automation and real owner/Google-key runtime proof could not be completed in this environment.

## Discovery Results

| Area | Route | Component | API / Save Behavior | Current Blocker | Fix |
|---|---|---|---|---|---|
| Register | `/register` | `app/register/page.tsx` | `POST /auth/register`, then onboarding state | Post-register path existed, but owner journey needed clearer dashboard continuation | Post-login default now routes completed users to `/dashboard` |
| Login | `/login` | `app/login/page.tsx` | `POST /auth/login`; 2FA challenge routes to `/two-factor` | Password placeholder said 6 characters | Placeholder now says `Minimum 8 characters` |
| 2FA | `/two-factor`, `/security` | two-factor/security pages | `verifyTwoFactorChallenge`, security setup APIs | Flow was functional, but owner path needed dashboard security CTA | Dashboard now surfaces Security as a pipeline action |
| Dashboard | `/dashboard` | `app/dashboard/page.tsx` | `GET /public-posts/me`, auth user state | Statuses were present but not operationally clear | Added account/profile/public visibility/latest post pipeline and next action CTA |
| Profile workspace | `/profile` | `app/profile/page.tsx` | `PUT /profile`; taxonomy and geography save through existing fields | Places filled free text only; ESCO/Uniclass labels were weak | Added structured location matching, review message, and selected taxonomy labels |
| Public profile | `/profiles/[slug]` | `app/profiles/[slug]/page.tsx` | `GET /profiles/public/:slug` | Generic unavailable copy hid known reason | API now returns business-readable 403 reason; page renders it |
| Company onboarding | `/onboarding/company` | `app/onboarding/company/page.tsx` | `upsertCompanyProfile`, lookup helper | Places selection did not warn about structured matching | Added manual review note after Places selection |
| Publish | `/publish` | `app/publish/page.tsx` | `POST/PATCH /public-posts`; backend moderation preserved | Dense flow and ambiguous create/save action | Added Save draft, Submit for review, Cancel, Delete, preview CTA, and lifecycle copy |
| Taxonomy | profile/publish | NACE/ESCO/Uniclass selectors | Search endpoints plus profile/post code persistence | ESCO/Uniclass selections rendered mostly as bare codes | Chips and public profile now render code plus label where available |
| Location selectors | profile/publish/company | `LocationAutocomplete` plus selectors | Existing country/region/city IDs remain source of structured state | Google selection did not normalize into internal IDs | Added reusable matcher for country/region/city where safe |

## Files Changed

- `apps/admin/api/src/auth/auth.service.ts` - formatting-only lint cleanup.
- `apps/admin/api/src/profiles/profiles.service.ts` - public profile unavailable reasons.
- `apps/admin/web/app/dashboard/page.tsx` - owner setup pipeline.
- `apps/admin/web/app/login/page.tsx` - password policy copy.
- `apps/admin/web/app/onboarding/company/page.tsx` - location review messaging.
- `apps/admin/web/app/profile/page.tsx` - structured location matching and taxonomy labels.
- `apps/admin/web/app/profiles/[slug]/page.tsx` - unavailable reason and readable taxonomy.
- `apps/admin/web/app/publish/page.tsx` - lifecycle UX, draft/review actions, location matching.
- `apps/admin/web/components/EscoMultiSelect.tsx`
- `apps/admin/web/components/NaceSearchInput.tsx`
- `apps/admin/web/components/UniclassMultiSelect.tsx`
- `apps/admin/web/lib/auth-redirect.ts`
- `apps/admin/web/lib/location/matchOpenStaffLocation.ts`

## Validation

| Gate | Result |
|---|---|
| Web build | PASS - `apps/admin/web -> npm.cmd run build` exited 0 |
| Web lint | PASS - `apps/admin/web -> npm.cmd run lint` exited 0 with 0 errors and existing warnings |
| API build | PASS - `apps/admin/api -> npm.cmd run build` exited 0 |
| API lint | PASS - `apps/admin/api -> npm.cmd run lint` exited 0 with 0 errors and existing warnings |
| API tests | PASS - `apps/admin/api -> npm.cmd test -- --runInBand` passed 19 suites / 38 tests |

## Browser Proof

Local built app startup was attempted with `next start` and standalone `server.js`. Foreground standalone startup reached Ready, but detached process startup did not remain available long enough for route probing, and temporary Playwright npx runner module resolution failed. No production owner account, real Google Places key, or real moderation account proof was executed in this task.

## Remaining Risks

1. Real owner/superadmin browser proof must still be completed on production or a stable local server with valid credentials.
2. Google Places runtime with the real restricted browser key must still be verified.
3. Draft semantics use existing `visibility: PRIVATE`; backend moderation status is intentionally not bypassed.
4. ESCO/Uniclass persisted public display is now more readable where labels are available; existing posts that only carry raw codes may still need taxonomy lookup enrichment later.
5. No schema, migration, guard, payment, pricing, feed ranking, Cloud Run config, or RELU decision-authority changes were made.
