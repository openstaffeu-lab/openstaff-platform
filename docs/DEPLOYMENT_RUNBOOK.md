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
- Do not use `prisma migrate dev` as a production migration strategy.

## Live topology

Current production topology:

- Public web: `https://openstaff.eu` -> Cloud Run `openstaff-web`
- Canonical redirect: `https://www.openstaff.eu` -> `308` -> `https://openstaff.eu/`
- API: `https://api.openstaff.eu` -> Cloud Run `openstaff-api`
- Admin: `https://backoffice.openstaff.eu` -> Cloud Run `openstaff-admin`
- Cloud SQL primary: `openstaff-db`
- Production database: `openstaff_prod`
- Production storage bucket: `gs://openstaff-platform-production`
- Runtime service account: `605639023972-compute@developer.gserviceaccount.com`
- Build/deploy service account: `openstaff-build@openstaff-platform.iam.gserviceaccount.com`

Current healthy production revisions validated during EXEC-25:

- API: `openstaff-api-00009-jmx`
- Public web: `openstaff-web-00009-q46`
- Admin: `openstaff-admin-00010-t76`

## Build and runtime identity split

EXEC-25 established a dedicated build/deploy identity so production deploys no longer depend on broad runtime permissions.

Current identities:

- Runtime SA: `605639023972-compute@developer.gserviceaccount.com`
- Build/deploy SA: `openstaff-build@openstaff-platform.iam.gserviceaccount.com`

Build/deploy rationale:

1. runtime keeps only the narrow permissions needed for app execution
2. build/deploy keeps Artifact Registry push, Cloud Run deploy, logging, source-bucket access, and Secret Manager read rights
3. `roles/iam.serviceAccountUser` is granted to the build identity on the runtime SA instead of being left on the runtime SA as a broad project capability

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
- `STRIPE_WEBHOOK_SECRET`

Optional secrets:

- `GEMINI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KEY`

Secret note:

- `STRIPE_WEBHOOK_SECRET` is the active and only supported webhook secret contract for production billing.

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
5. Keep the active production chain in `prisma/migrations/` and archive superseded legacy folders outside the active chain

Pre-check:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/gcp/prisma-production-migration-check.ps1
```

Apply migrations from a controlled operator workstation or CI job:

```powershell
cd apps/admin/api
npx.cmd prisma migrate deploy
```

EXEC-15 production baseline:

- Active baseline: `prisma/migrations/20260516090000_exec15c_production_baseline`
- Historical archive: `prisma/migrations_legacy_exec01_exec14/`

Do not use:

- `npx prisma db push`
- `npx prisma migrate dev`

against production.

## 5. Deploy API

Cloud Build:

```powershell
gcloud builds submit `
  --project=openstaff-platform `
  --service-account=projects/openstaff-platform/serviceAccounts/openstaff-build@openstaff-platform.iam.gserviceaccount.com `
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
  --service-account=projects/openstaff-platform/serviceAccounts/openstaff-build@openstaff-platform.iam.gserviceaccount.com `
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
  --service-account=projects/openstaff-platform/serviceAccounts/openstaff-build@openstaff-platform.iam.gserviceaccount.com `
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

## 9. Backups and recovery baseline

Minimum production expectations:

- Cloud SQL automated backups enabled
- transaction log retention configured
- Cloud SQL deletion protection enabled before final operational sign-off
- Cloud SQL SSL mode hardened to the approved production setting before final operational sign-off
- GCS uniform bucket-level access enabled
- GCS soft delete or lifecycle retention configured

Current validated baseline during EXEC-25:

- Cloud SQL automated backups: enabled
- Cloud SQL retained backups: `7`
- Cloud SQL transaction log retention: `7` days
- Cloud SQL deletion protection: enabled
- Cloud SQL connector enforcement: `REQUIRED`
- Cloud SQL SSL mode: `ENCRYPTED_ONLY`
- Cloud SQL PITR: enabled
- Cloud SQL transactional log storage state: `CLOUD_STORAGE`
- GCS bucket: `gs://openstaff-platform-production`
- GCS uniform bucket-level access: enabled
- GCS soft delete retention: `7` days
- dedicated build/deploy SA: `openstaff-build@openstaff-platform.iam.gserviceaccount.com`

Operational note:

- For the live PostgreSQL setup, `ipConfiguration.requireSsl` may still appear `false`, but the enforced production transport policy is `sslMode = ENCRYPTED_ONLY` together with `connectorEnforcement = REQUIRED`, which is compatible with Cloud Run through the Cloud SQL connector and `/cloudsql/...` socket path.

Restore order:

1. Confirm current Cloud Run revisions and freeze deploy activity.
2. Restore Cloud SQL from the latest backup or PITR target.
3. Re-apply reviewed forward migrations only if the restore point predates the active baseline.
4. Re-deploy API, then public web, then admin.
5. Re-run `/health`, `/status`, auth smoke, and a moderation smoke flow.

## 10. Rollback notes

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

Apply the same pattern for:

- `openstaff-web`
- `openstaff-admin`

## 11. Known operational notes

As of the final EXEC-29 audit:

- the Cloud SQL hardening baseline is now explicitly confirmed operator-side
- keep only the active production secret contract in docs and scripts
- performance proof is archived in `docs/proof/exec17/`
- resilience and security runbooks are now part of the baseline:
  - `docs/INCIDENT_RESPONSE_RUNBOOK.md`
  - `docs/RELEASE_GOVERNANCE.md`
  - `docs/RELEASE_LIFECYCLE_POLICY.md`
  - `docs/SECURITY_POSTURE_REVIEW.md`
  - `docs/SECRET_ROTATION_RUNBOOK.md`
  - `docs/DISASTER_RECOVERY_PLAN.md`
  - `docs/COST_BASELINE.md`
  - `docs/RUNTIME_CONFIGURATION_GOVERNANCE.md`
  - `docs/SLO_BASELINE.md`
  - `docs/ARCHITECTURE_BASELINE.md`
  - `docs/DEPENDENCY_GOVERNANCE.md`
  - `docs/DATA_LIFECYCLE_POLICY.md`
  - `docs/OWNERSHIP_MATRIX.md`
  - `docs/TECHNICAL_DEBT_REGISTER.md`
- production operator automation now includes:
  - `scripts/release/exec-26-production-ops-check.ps1`
  - `scripts/release/exec-26-failure-simulations.ps1`
- lifecycle governance now expects:
  - release-quality proof beyond clean builds
  - explicit ownership for migrations, rollback, moderation, billing, and security
  - architecture and dependency review when major runtime boundaries change
- adoption readiness governance now expects:
  - first-user wording to stay aligned with the real operational contract
  - no public fallback content to be presented as trustworthy live marketplace truth
  - support playbook coverage for onboarding, moderation, billing clarification, and rejection explanation
  - explicit scale, analytics, and operational metrics review as cohorts grow
- rollout intelligence governance now expects:
  - funnel visibility to remain privacy-respectful and operationally truthful
  - no third-party ad trackers to be introduced as a shortcut for rollout measurement
  - `/status` to keep exposing summary-level onboarding, moderation, upgrade, auth-failure, upload-failure, webhook-failure, and recent operator action visibility
  - operational feedback and escalation signals to remain loggable without sensitive leakage
- the next non-blocking frontend follow-ups are:
  - reduce `CLS` on `https://openstaff.eu/jobs`
  - improve homepage accessibility from the current Lighthouse baseline
  - revisit `/publish` scripting cost if interaction latency becomes a product concern

## 12. Release checklist

- Working tree clean
- Branch correct: `feature/work-in-progress`
- All build validations pass
- Release check script passes
- Required Secret Manager secrets created
- Cloud SQL reachable
- Cloud SQL deletion protection enabled
- Cloud SQL SSL mode verified against the approved production policy
- Cloud SQL PITR state explicitly confirmed in operator evidence
- technical debt review updated when schema, auth, or runtime boundaries changed
- dependency and lifecycle governance docs reviewed when framework or deploy tooling changed
- first-user experience and UX trust docs reviewed when public onboarding, publish, moderation, pricing, or public-detail flows changed
- support, scale, analytics, and operational metrics baselines reviewed when onboarding cohorts materially expanded
- funnel visibility, operational feedback, supportability, error intelligence, and rollout reporting docs reviewed when rollout measurement or operator reporting changes materially
- ownership for deploy, migration, and rollback explicitly named
- Production migration reviewed and applied
- API `/health` and `/status` return success on live domain
- Demo flags confirmed `false`
