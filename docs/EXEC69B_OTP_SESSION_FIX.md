# EXEC-69B OTP Session Fix

Date: 2026-05-25

## Fix Summary

EXEC-69B/69C closes the broken post-OTP session handoff by making OTP verification hydrate the active auth context synchronously before routing to the authenticated area.

Changed behavior:

- `AuthContext.completeSession(...)` was added on public web and backoffice.
- OTP verify now stores `accessToken`, `refreshToken`, and `user` before redirect.
- Temporary 2FA challenge state is removed only after `completeSession(...)` succeeds.
- Public login challenge state carries `redirectTo` from `?next=...`.
- Backoffice login challenge state carries `/dashboard` as its redirect target.
- Protected public routes can preserve intended routes through `loginPathForCurrentLocation()`.
- Backoffice `/two-factor` is explicitly public in `AdminAuthGuard`, preventing an OTP route bounce back to `/login`.

## OTP Verification Flow

1. Password login returns `challengeRequired`.
2. Client writes the challenge id, masked destination, expiry, email, and redirect target into sessionStorage.
3. Client enters `/two-factor`.
4. OTP verify calls `/auth/2fa/challenge/verify`.
5. API consumes the challenge and returns the full auth payload.
6. Client calls `completeSession(auth)`.
7. Client clears pending challenge storage.
8. Client redirects to the resolved authenticated route.

## Proof

Local browser proof with mocked API:

- Chrome desktop: OTP success lands on `/profile`; reload stays authenticated; logout clears token.
- Edge desktop user agent: OTP success lands on `/profile`; reload stays authenticated; logout clears token.
- Mobile Chrome profile: OTP success lands on `/profile`; reload stays authenticated; logout clears token.
- Backoffice: OTP success lands on `/dashboard`; access and refresh tokens are present after verification.

Real mailbox/live proof remains required for production PASS because no real test mailbox credentials were available in this workspace.

