# EXEC-25 Build / Runtime Identity Split

- Date: 2026-05-18
- Owner: Technical Ops
- Environment: production
- Category: iam-change
- Related execution / incident: EXEC-25

## Summary

Separated build/deploy identity from runtime identity to restore deploy-path resilience without re-broadening runtime permissions.

## Affected Systems

1. `openstaff-build@openstaff-platform.iam.gserviceaccount.com`
2. `605639023972-compute@developer.gserviceaccount.com`
3. `gs://openstaff-platform_cloudbuild`

## Actions Taken

1. created dedicated build/deploy service account
2. granted Artifact Registry, Cloud Run deploy, logging, and Secret Manager access to the build identity
3. granted service-account impersonation on the runtime SA to the build identity
4. removed temporary source-bucket viewer workaround from the runtime SA

## Validation

1. Cloud Build `b7e78555-6a7d-4cca-8037-7999fdd7fe92` succeeded
2. runtime SA remained constrained to Cloud SQL + Secret Manager project roles

## Follow-Up

1. use the dedicated build/deploy SA in future production deploy commands and automation
