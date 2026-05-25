# EXEC-68 2FA Login Fix

Date: 2026-05-25

## Fixed Behavior

1. Password login returns `challengeRequired`.
2. Existing local token state is cleared so a previous session cannot bleed into the OTP step.
3. Challenge metadata is stored in sessionStorage with `challengeId`, masked destination, email, relative expiry, and absolute `expiresAt`.
4. `/two-factor` reloads the valid challenge or rejects expired challenge state with a visible error.
5. OTP verification stores access/refresh tokens, clears challenge state, refreshes AuthContext, then redirects.
6. Resend updates the active challenge id and expiry.

## Files

- `apps/admin/web/context/AuthContext.tsx`
- `apps/admin/context/AuthContext.tsx`
- `apps/admin/web/app/login/page.tsx`
- `apps/admin/app/login/page.tsx`
- `apps/admin/web/app/two-factor/page.tsx`
- `apps/admin/app/two-factor/page.tsx`
- `apps/admin/web/lib/api.ts`
- `apps/admin/lib/api.ts`

