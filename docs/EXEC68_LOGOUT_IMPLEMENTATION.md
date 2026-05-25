# EXEC-68 Logout Implementation

Date: 2026-05-25

## Implemented Surfaces

- Public desktop navbar: profile/logout when authenticated.
- Public mobile navbar: logout appears as the fourth mobile action when authenticated.
- Public profile/account page: logout action beside profile/security/public-page controls.
- Backoffice desktop sidebar: logout action in system status panel.
- Backoffice header: logout action beside the active admin identity.

## Session Handling

- Public logout calls `/auth/logout` when a token exists.
- Backoffice logout calls `/auth/logout` when a token exists.
- Both surfaces clear access token, refresh token, and pending 2FA challenge state.
- Both surfaces redirect to `/login`.

## Files

- `apps/admin/web/components/Navbar.tsx`
- `apps/admin/web/components/layout/MobileNavigation.tsx`
- `apps/admin/web/app/profile/page.tsx`
- `apps/admin/components/AdminLayoutShell.tsx`
- `apps/admin/web/lib/api.ts`
- `apps/admin/lib/api.ts`

