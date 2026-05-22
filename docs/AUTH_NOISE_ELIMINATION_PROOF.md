# Auth Noise Elimination Proof

Last updated: 2026-05-22

## What Changed

`apps/admin/web/lib/api.ts` now:

- refuses to call `/auth/refresh` when no real refresh token exists
- avoids retrying protected auth recovery when only a stale access token exists
- clears local auth state instead of cascading refresh attempts when no recovery path is available
- no-ops logout when no token exists

## Targeted Browser Proof

Two targeted browser scenarios were executed against the public surface:

### Clean anonymous session

- routes checked: `/`, `/register`, `/login`, `/onboarding/welcome`
- promoted revision checked: `openstaff-web-00020-wtl`
- `requests401 = []`
- `badResponses = []`
- `consoleErrors = []`
- `pageErrors = []`
- no failed critical requests

### Stale access token with no refresh token

- routes checked: `/`, `/register`, `/login`, `/onboarding/welcome`
- `requests401 = []`
- `badResponses = []`
- `consoleErrors = []`
- `pageErrors = []`
- only navigation-aborted requests were observed during route changes

## Live Browser Matrix Snapshot

- Chrome desktop: clean anonymous browsing, no `401`, no `4xx/5xx`, no console errors
- Edge desktop: clean anonymous browsing, no `401`, no `4xx/5xx`, no console errors
- Mobile Chrome: clean anonymous browsing, no `401`, no `4xx/5xx`, no console errors, `scrollWidth = viewportWidth = bodyScrollWidth = 412`
