# OpenStaff Backoffice

This folder contains the active OpenStaff backoffice / Super Admin Panel.

## Structure

- Active backoffice frontend: `apps/admin`
- Active backend API consumed by the backoffice: `apps/admin/api`
- Public OpenStaff frontend candidate: `apps/admin/web`
- Empty rename artifact: `apps/admin/openstaff`
- Temporary legacy archive preserved for review: `apps/admin/legacy/backend-like`

The current Next.js package and build entrypoint are rooted in `apps/admin`.

## Environment

Create a local env file from `.env.example` and point it to the backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

The code falls back to `http://localhost:8080` in local development and
`https://api.openstaff.eu` in production if the env var is missing.

## Scripts

```bash
npm.cmd run dev
npm.cmd run build
npm.cmd run start
```

From the repository root you can also start the public app, admin app and API
with a single command:

```bash
npm.cmd run dev:all
```

## Deployment guidance

- `apps/admin` is the current validated local frontend target.
- `apps/admin/web` remains prototype-only for now and is not the current production deploy target.
- Any production deployment changes must be made through the Codex-managed workflow only.
