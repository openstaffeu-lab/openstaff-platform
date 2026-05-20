# EXEC-42 Proof

Last updated: `2026-05-20`

## Scope

EXEC-42 focuses on real onboarding closure gaps observed in browser testing:

1. password recovery
2. progressive registration
3. company autofill
4. geo and locale defaults
5. RELU AI profile generation visibility
6. taxonomy suggestion visibility
7. dashboard and homepage visibility cleanup

## Implemented Proof

### Password recovery

- `apps/admin/api/src/auth/auth.service.ts` now supports password reset request and confirmation with hashed tokens, expiry, single use, rate limiting, audit logging, and session revocation
- `apps/admin/web/app/login/page.tsx` now links to forgot-password
- `apps/admin/web/app/forgot-password/page.tsx` and `apps/admin/web/app/reset-password/page.tsx` now expose the user-facing flow

### Progressive onboarding

- `apps/admin/web/app/register/page.tsx` now starts with a lighter two-step registration flow
- `apps/admin/api/src/onboarding/onboarding.service.ts` now exposes regional defaults and company lookup support
- `apps/admin/web/app/onboarding/company/page.tsx` now supports fiscal or VAT autofill plus manual override

### RELU AI and taxonomy visibility

- `apps/admin/web/app/onboarding/completion/page.tsx` now surfaces a visible RELU AI action, summary, ESCO candidates, NACE or category candidates, Uniclass candidates, and missing-information guidance

### Dashboard and homepage visibility

- `apps/admin/web/app/dashboard/page.tsx` now shows approval and moderation state plus the latest owner listing state
- `apps/admin/web/app/page.tsx` now uses approved-feed wording rather than synthetic launch or EXEC-style language
- `apps/admin/web/components/ActorCard.tsx` now uses a calmer approved-profile presentation and prefers public profile slugs when available

## Local Validation

- `apps/admin/api -> npx.cmd prisma validate` ✅
- `apps/admin/api -> npx.cmd prisma generate` ✅
- `apps/admin/api -> npm.cmd run build` ✅
- `apps/admin/web -> npm.cmd run build` ✅
- `apps/admin -> npm.cmd run build` ✅

## Remaining Live Blockers

EXEC-42 is not yet an honest live PASS because the following proof items remain open:

1. no provider-backed password-reset email delivery is configured
2. no live browser proof has yet confirmed company registration, professional registration, password recovery, admin approval, and approved homepage visibility on production
3. no new production deployment has yet been promoted for the EXEC-42 codepath
4. company lookup still uses a provider abstraction and deterministic baseline matches rather than a fully live registry integration
