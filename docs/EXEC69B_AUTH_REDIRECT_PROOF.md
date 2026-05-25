# EXEC-69B Auth Redirect Proof

Date: 2026-05-25

## Public Redirect Rules

`resolveAuthenticatedRoute(user, fallback)` resolves in this order:

1. safe stored intended route from sessionStorage
2. safe `?next=` fallback
3. `/onboarding/welcome` when onboarding is incomplete
4. `/dashboard` for company users
5. `/profile` for professional/individual users

Unsafe redirects are rejected when they:

- do not start with `/`
- start with `//`
- point back to `/login`
- point back to `/two-factor`

## Backoffice Redirect Rules

`resolveAdminAuthenticatedRoute(user, fallback)` resolves in this order:

1. safe stored intended route from sessionStorage
2. safe fallback such as `/dashboard`
3. `/dashboard`

`/two-factor` is included in the admin public path list so the backoffice guard does not redirect an active challenge back to `/login`.

## Browser Proof

Local proof result:

- public post-OTP URL: `http://127.0.0.1:3100/profile`
- public reload URL: `http://127.0.0.1:3100/profile`
- admin post-OTP URL: `http://127.0.0.1:3101/dashboard`
- console errors: `[]`
- page errors: `[]`

This validates the client session race fix. Live proof still depends on a real 2FA-enabled test account and mailbox.

