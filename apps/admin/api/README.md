# OpenStaff API

This folder contains the active OpenStaff backend service.

## Real backend path

- Deployable backend: `apps/admin/api`
- Active backoffice frontend client: `apps/admin`
- Public OpenStaff frontend candidate: `apps/admin/web`
- Cloud Run service name: `openstaff-api`
- GCP project: `openstaff-platform`
- Region: `europe-west1`

The previous Cloud Run failure happened because `apps/openstaff/api` does not exist in the current repository.

## Runtime and build

```bash
npm.cmd run build
npm.cmd run start:prod
```

Cloud Run build hook:

```bash
npm.cmd run gcp-build
```

Current production-oriented scripts:

- `gcp-build`: runs `prisma generate` and `npm run build`
- `start`: runs `node dist/src/main.js`
- `start:prod`: runs `node dist/src/main.js`

## Environment

Use environment variables and placeholders only:

```bash
DATABASE_URL=postgresql://OPENSTAFF_DB_USER:OPENSTAFF_DB_PASSWORD@OPENSTAFF_DB_HOST:5432/OPENSTAFF_DB_NAME?schema=public
PORT=8080
```

Prisma is configured for PostgreSQL and reads `DATABASE_URL` from the environment.
The current local `.env` file is development-only and should not be reused for production runtime configuration.

Runtime expectations already aligned in code:

- `gcp-build`: `prisma generate && npm run build`
- `start`: `node dist/src/main.js`
- `start:prod`: `node dist/src/main.js`
- `main.ts` listens on `process.env.PORT` and binds to `0.0.0.0`
- `GET /health` exposes runtime health metadata
- `GET /status` exposes API module and runtime status metadata

## Deployment guidance

- Use Cloud Build config: `apps/admin/api/cloudbuild.api.yaml`
- Use Secret Manager references for runtime secrets
- Use `docs/DEPLOYMENT_RUNBOOK.md` for Cloud SQL, migrations, Cloud Run deploy, validation, and rollback
