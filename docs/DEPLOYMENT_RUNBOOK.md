# OpenStaff Deployment Runbook

## Scope

This runbook documents the production deployment path for:

- API: `openstaff-api`
- Public web: `openstaff-web`
- Admin/backoffice: `openstaff-admin`

Target defaults:

- GCP project: `openstaff-platform`
- Region: `europe-west1`
- Artifact Registry repo: `openstaff-repo`
- Public domain: `openstaff.eu`
- API domain: `api.openstaff.eu`
- Admin domain: `backoffice.openstaff.eu`

## Production principles

- Never deploy with demo flags enabled.
- Never commit or bake real secrets into images.
- Use Secret Manager references only.
- Use reviewed Prisma migrations in production.
- Do not run `prisma db push` against production Cloud SQL.

## 1. Create Cloud SQL

Example placeholders:

```powershell
gcloud sql instances create OPENSTAFF_SQL_INSTANCE `
  --project=openstaff-platform `
  --database-version=POSTGRES_16 `
  --tier=db-custom-1-3840 `
  --region=europe-west1 `
  --storage-type=SSD `
  --storage-size=20

gcloud sql databases create OPENSTAFF_DB `
  --project=openstaff-platform `
  --instance=OPENSTAFF_SQL_INSTANCE

gcloud sql users create OPENSTAFF_DB_USER `
  --project=openstaff-platform `
  --instance=OPENSTAFF_SQL_INSTANCE `
  --password=CHANGE_ME
```

## 2. Create Secret Manager secrets

Required secrets:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `WEBHOOK_SECRET`

Optional secrets:

- `GEMINI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KEY`

Use the companion script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/gcp/secret-manager-setup.ps1
```

## 3. Production environment contract

### API

Required:

- `NODE_ENV=production`
- `DATABASE_URL` from Secret Manager
- `JWT_SECRET` from Secret Manager
- `JWT_REFRESH_SECRET` from Secret Manager
- `CORS_ORIGIN`
- `PUBLIC_WEB_URL`
- `ADMIN_WEB_URL`
- `ENABLE_DEV_AUTH_BYPASS=false`
- `DEMO_MODE=false`
- `ENABLE_DEMO_PUBLIC_FEED=false`
- `ENABLE_DEMO_MESSAGING=false`
- `ENABLE_BILLING_PLACEHOLDERS=false`
- `ENABLE_WEBHOOK_PLACEHOLDER=false`
- `ENABLE_SMS_PLACEHOLDER=false`
- `SKIP_FIREBASE_AUTH=false`
- `SKIP_JWT_AUTH=false`

Launch-mode decision:

- If Gemini is required for launch: provide `GEMINI_API_KEY` and keep `ENABLE_AI_FALLBACK=false`
- If Gemini is not launch-critical: omit `GEMINI_API_KEY` and keep `ENABLE_AI_FALLBACK=false`

### Public web

- `NEXT_PUBLIC_API_URL=https://api.openstaff.eu`
- `NEXT_PUBLIC_WEB_URL=https://openstaff.eu`
- `NEXT_PUBLIC_DEMO_MODE=false`

### Admin

- `NEXT_PUBLIC_API_URL=https://api.openstaff.eu`
- `NEXT_PUBLIC_ADMIN_URL=https://backoffice.openstaff.eu`
- `NEXT_PUBLIC_DEMO_MODE=false`

## 4. Prisma production migration strategy

Production strategy:

1. Build image with `prisma generate`
2. Validate migration status before deploy
3. Apply reviewed migrations during a controlled release window
4. Deploy the new API revision only after migration success

Pre-check:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/gcp/prisma-production-migration-check.ps1
```

Apply migrations from a controlled operator workstation or CI job:

```powershell
cd apps/admin/api
npx.cmd prisma migrate deploy
```

Do not use:

- `npx prisma db push`
- `npx prisma migrate dev`

against production.

## 5. Deploy API

Cloud Build:

```powershell
gcloud builds submit `
  --project=openstaff-platform `
  --config=apps/admin/api/cloudbuild.api.yaml
```

Validate:

```powershell
curl https://api.openstaff.eu/health
curl https://api.openstaff.eu/status
```

## 6. Deploy public web

```powershell
gcloud builds submit `
  --project=openstaff-platform `
  --config=apps/admin/web/cloudbuild.web.yaml
```

Validate:

```powershell
curl https://openstaff.eu
```

## 7. Deploy admin

```powershell
gcloud builds submit `
  --project=openstaff-platform `
  --config=apps/admin/cloudbuild.admin.yaml
```

Validate:

```powershell
curl https://backoffice.openstaff.eu
```

## 8. Domain readiness checklist

Required mappings:

- `openstaff.eu` -> `openstaff-web`
- `api.openstaff.eu` -> `openstaff-api`
- `backoffice.openstaff.eu` -> `openstaff-admin`

Checklist:

- DNS records created
- Cloud Run domain mapping created
- TLS certificate status is `Active`
- `CORS_ORIGIN` updated to final mapped domains
- `/health` and `/status` validated on mapped API domain

## 9. Rollback notes

Preferred rollback order:

1. Roll back Cloud Run revision
2. Re-point traffic to last known healthy revision
3. Keep DB schema unchanged unless a specific rollback migration exists
4. Re-run `/health` and `/status`

Cloud Run rollback example:

```powershell
gcloud run services update-traffic openstaff-api `
  --project=openstaff-platform `
  --region=europe-west1 `
  --to-revisions=REVISION_NAME=100
```

## 10. Release checklist

- Working tree clean
- Branch correct: `feature/work-in-progress`
- All build validations pass
- Release check script passes
- Required Secret Manager secrets created
- Cloud SQL reachable
- Production migration reviewed and applied
- API `/health` and `/status` return success on live domain
- Demo flags confirmed `false`
