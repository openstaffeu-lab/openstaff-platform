# EXEC-78D.1 Account & Identity Separation Implementation

Date: 2026-06-03

Verdict: `PASS`

## A. Executive Summary

EXEC-78D.1 implements the first owner-approved architecture step from EXEC-78C.3A: account registration is separated from identity/profile/company onboarding.

Registration now creates the authentication account and security/session baseline only. Public profile, professional identity, company identity, and onboarding context are no longer eagerly created during registration. Identity selection now begins at `/onboarding/identity-type` with Professional Identity, Company Identity, and Both options.

No RELU Builder logic, pricing/payment logic, compliance evidence model, geography schema, permissions/guards, or publishing lifecycle implementation was changed.

## B. Discovery Results

| Area | Current implementation before EXEC-78D.1 | Blocker | EXEC-78D.1 fix |
|---|---|---|---|
| register route/form | `apps/admin/web/app/register/page.tsx` asked for account type, company name, VAT, country, language, timezone, and phone | identity/company data was collected before account separation | registration form now collects only email, password, country, language, timezone, and optional phone |
| auth register DTO | `RegisterDto` required `actorType` and `displayName` | account creation could not be authentication-only | `actorType` and `displayName` are optional |
| auth registration service | `AuthService.register` created `User`, `Profile`, `IdentityProfile`, optional `IdentityCompanyProfile`, and `OnboardingSession` | account, identity, profile, and onboarding were coupled | registration now creates only `User`, default subscription/session response, notifications, and security audit |
| user/profile creation | public profile was created as private/pending/offline at registration | public profile existed before identity selection | draft legacy profile is created only when identity/company onboarding is saved |
| company creation | company identity could be created at registration | company identity was coupled to account creation | company identity is created by `/onboarding/company` only |
| onboarding session | created at registration | onboarding state existed before identity selection | onboarding session is lazily created by `OnboardingService.ensureOnboardingContext` |
| account approval | new users were `PENDING` and `OFFLINE` until login | account approval was being used as an account existence gate | new account rows are `APPROVED` and `LIVE`; public identity/profile/company gates remain separate |
| email/2FA | email OTP 2FA exists; email ownership verification exists in trust APIs; registration did not enforce email verification | adding a new verification gate would exceed this task | current email/2FA behavior is preserved; routing can send non-live accounts to `/security` |
| dashboard routing | routing relied on `onboardingDone`, previously derived from `Boolean(user.profile)` | removing eager profile creation would route incorrectly | `/auth/me` now returns identity state and onboarding state; web routing uses that state |
| identity routes | `/onboarding/identity` and `/onboarding/company` existed; no identity type route existed | user could not choose Professional, Company, or Both first | `/onboarding/identity-type` added |

## C. Model Before / After

Before:

- `/auth/register` created account, profile, professional identity, optional company identity, onboarding session, and subscription.
- `onboardingDone` was effectively tied to whether a legacy public profile existed.
- Company/professional choice was made inside the registration form.

After:

- `/auth/register` creates account and authentication/session baseline only.
- `/onboarding/identity-type` records the selected path.
- `/onboarding/identity` creates or updates a draft/incomplete professional identity and draft legacy profile only when saved.
- `/onboarding/company` creates or updates a draft/incomplete company identity and draft legacy profile only when saved.
- Public profile/company visibility remains private, pending moderation, and offline until approval gates pass.

## D. Files Changed

Backend:

- `apps/admin/api/src/auth/auth.service.ts`
- `apps/admin/api/src/auth/dto/register.dto.ts`
- `apps/admin/api/src/auth/auth.service.spec.ts`
- `apps/admin/api/src/onboarding/onboarding.service.ts`
- `apps/admin/api/src/onboarding/onboarding.service.spec.ts`

Frontend:

- `apps/admin/web/app/register/page.tsx`
- `apps/admin/web/app/onboarding/identity-type/page.tsx`
- `apps/admin/web/app/onboarding/company/page.tsx`
- `apps/admin/web/context/AuthContext.tsx`
- `apps/admin/web/lib/api.ts`
- `apps/admin/web/lib/auth-redirect.ts`
- `apps/admin/web/lib/onboarding.ts`

Documentation:

- `docs/proof/exec78/EXEC78D1_ACCOUNT_IDENTITY_SEPARATION.md`
- `docs/proof/exec78/README.md`
- `STATUS.md`

## E. Routing Behavior

After registration:

1. Account is created and session is issued using the existing auth flow.
2. User is routed to `/onboarding/identity-type`.
3. User chooses Professional Identity, Company Identity, or Both.

After login:

- Non-live account: `/security`
- Active account with no selected identity type: `/onboarding/identity-type`
- Professional selected without professional identity draft: `/onboarding/identity`
- Company selected without company identity draft: `/onboarding/company`
- Both selected without professional identity draft: `/onboarding/identity`
- Both selected with professional identity but without company identity: `/onboarding/company`
- Incomplete onboarding: existing onboarding route based on current step
- Completed onboarding: `/dashboard`

## F. Approval Gates

Account activation does not imply:

- verified professional identity
- verified company identity
- public profile visibility
- public company visibility
- publishing rights
- compliance approval

Draft legacy profiles created during onboarding use:

- `visibility: PRIVATE`
- `moderationStatus: PENDING`
- `status: OFFLINE`

Public routes still require separate profile/company visibility and moderation gates.

## G. Tests Added / Updated

Added:

- `apps/admin/api/src/auth/auth.service.spec.ts`
- `apps/admin/api/src/onboarding/onboarding.service.spec.ts`

Coverage:

- registration creates active account without auto-created public profile records
- account can be active while `profile` remains `null`
- Both identity path is represented in `/auth/me`
- professional draft profile creation is private/pending/offline
- company draft profile creation is private/pending/offline

## H. Backoffice Impact

Backoffice account review is preserved because `User` records still exist immediately after registration.

Backoffice identity/company review remains available after onboarding starts because `IdentityProfile`, `IdentityCompanyProfile`, `OnboardingSession`, and verification cases are still managed by existing onboarding and verification services.

No backoffice redesign was performed.

## I. Validation Results

| Gate | Status | Evidence |
|---|---|---|
| Prisma validate | PASS | `apps/admin/api -> npx.cmd prisma validate` exited `0` |
| Prisma generate | PASS | `apps/admin/api -> npx.cmd prisma generate` exited `0` |
| focused API tests | PASS | `apps/admin/api -> npm.cmd test -- --runInBand auth.service.spec.ts onboarding.service.spec.ts` exited `0`; 2 suites, 4 tests |
| full API tests | PASS | `apps/admin/api -> npm.cmd test -- --runInBand` exited `0`; 21 suites, 42 tests |
| API build | PASS | `apps/admin/api -> npm.cmd run build` exited `0` |
| API lint | PASS | `apps/admin/api -> npm.cmd run lint` exited `0`; 0 errors, 415 existing warnings |
| web build | PASS | `apps/admin/web -> npm.cmd run build` exited `0`; route list includes `/onboarding/identity-type` |
| web lint | PASS | `apps/admin/web -> npm.cmd run lint` exited `0`; 0 errors, 21 existing warnings |

## J. Remaining Risks

1. Email ownership verification is not newly enforced in EXEC-78D.1; existing trust/2FA flows are preserved.
2. Account-level country/language/phone do not have dedicated `User` columns; durable profile preference storage begins in onboarding identity context without schema changes.
3. The existing legacy `Profile` model remains single-profile per account, so the Both identity path creates professional and company identity records but still uses one legacy public profile until a later multi-profile/public-page design.
4. Existing users who already have eager-created profile/identity records are not migrated in this task.
5. Publishing rights remain approval-gated by existing public profile/post moderation behavior; the full publishing lifecycle is not changed in EXEC-78D.1.

## K. Follow-Up Tasks

1. EXEC-78D.2 should implement explicit email verification/account activation policy if owner wants email verification to block account activation.
2. Add durable account preference fields in a future schema pass if country/language/phone must be stored on `User`.
3. Decide whether Both requires separate professional and company public pages instead of one legacy `Profile`.
4. Add migration/backfill strategy for existing users created before EXEC-78D.1.
5. Continue dashboard operating-console redesign after account/identity separation stabilizes.
