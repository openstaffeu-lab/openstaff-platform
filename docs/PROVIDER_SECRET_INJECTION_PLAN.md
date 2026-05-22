# Provider Secret Injection Plan

Last updated: 2026-05-22

## Purpose

This document provides the exact operator-side plan for creating provider secrets in GCP Secret Manager and mounting them into `openstaff-api` without exposing secret values in logs or in the repository.

## Required Secrets

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- one of:
  - `EMAIL_API_KEY`
  - `SMTP_URL`
- if `Mailgun` is selected:
  - `MAILGUN_DOMAIN`
- `ROMANIAN_COMPANY_LOOKUP_URL`
- `ROMANIAN_COMPANY_LOOKUP_API_KEY`

## Secret Creation Templates

Do not paste real values into the repository. Use stdin-based creation or update.

### Create a new secret

```powershell
@'
<REPLACE_WITH_SECRET_VALUE>
'@ | gcloud secrets create SECRET_NAME `
  --project=openstaff-platform `
  --data-file=-
```

### Add a new secret version to an existing secret

```powershell
@'
<REPLACE_WITH_SECRET_VALUE>
'@ | gcloud secrets versions add SECRET_NAME `
  --project=openstaff-platform `
  --data-file=-
```

## Cloud Run Mount Plan

Target service:

- `openstaff-api`

Recommended update pattern:

```powershell
gcloud run services update openstaff-api `
  --project=openstaff-platform `
  --region=europe-west1 `
  --update-secrets=EMAIL_PROVIDER=EMAIL_PROVIDER:latest,EMAIL_FROM=EMAIL_FROM:latest,EMAIL_API_KEY=EMAIL_API_KEY:latest,SMTP_URL=SMTP_URL:latest,MAILGUN_DOMAIN=MAILGUN_DOMAIN:latest,ROMANIAN_COMPANY_LOOKUP_URL=ROMANIAN_COMPANY_LOOKUP_URL:latest,ROMANIAN_COMPANY_LOOKUP_API_KEY=ROMANIAN_COMPANY_LOOKUP_API_KEY:latest
```

Only include the secrets that actually exist for the chosen provider combination.

## Validation After Injection

The operator must verify:

1. each required secret exists
2. latest secret version is enabled
3. `openstaff-api` now shows secret references in the service definition
4. `/status.integrations.emailDelivery.mode = configured`
5. no secret values appear in deploy logs or runtime logs

## Rollback Plan

If the provider injection causes unexpected regressions:

1. redeploy the previous API revision or update the service to remove the new secret mounts
2. confirm `/health` and `/status` return healthy values again
3. leave the secrets in Secret Manager but stop mounting them until the root cause is understood

## Execution Rule

EXEC-50 should perform the actual injection only after the operator supplies real approved values.
