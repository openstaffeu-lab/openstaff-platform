# OpenStaff Production Deployment Validation

Date: 2026-05-24  
Execution: `EXEC-63`

## Scope

This review validates deployment reliability and current production posture. It does not claim that the exact EXEC-63 hardening commit was deployed during this turn.

## Cloud Build validation

### Confirmed project posture

- active gcloud account: `openstaff.eu@gmail.com`
- active project: `openstaff-platform`
- Cloud Build service account reviewed: `openstaff-build@openstaff-platform.iam.gserviceaccount.com`

### Confirmed relevant permissions

- `roles/artifactregistry.writer`
- `roles/logging.logWriter`
- `roles/run.admin`
- `roles/secretmanager.secretAccessor`

### Cloud Build staging bucket

- bucket: `gs://openstaff-platform_cloudbuild`
- confirmed bucket IAM includes:
  - `roles/storage.objectViewer` for `serviceAccount:openstaff-build@openstaff-platform.iam.gserviceaccount.com`

This closes the previously observed `storage.objects.get 403` staging concern as an active blocker.

## Recent successful deploy proof

Recent successful deploy pipelines observed on `2026-05-23`:

- API build: `ef3bee3b-fe55-42be-b955-aa82d259d5d1`
- Web build: `a2dde3f2-05a4-4d70-8709-0755ccd41973`

Observed outcome:

- build steps: `SUCCESS`
- push steps: `SUCCESS`
- deploy steps: `SUCCESS`

## Live runtime validation

### Public endpoints

- `https://openstaff.eu` -> `200 OK`
- `https://backoffice.openstaff.eu` -> `200 OK`
- `https://api.openstaff.eu/health` -> healthy JSON
- `https://api.openstaff.eu/status` -> healthy JSON

### Production status highlights

- `db = healthy`
- `databaseConfigured = true`
- `jwtSecretConfigured = true`
- `storageBucketConfigured = true`
- `firebaseAuth = configured`
- `secretManager = ready`

## Final deployment conclusion

Deployment reliability is acceptable for `BETA_READY`. The platform currently has:

- recent successful deploy pipeline proof
- healthy live public, backoffice, and API endpoints
- Cloud Build staging-bucket access consistent with successful source upload and deployment

What is still not claimed here:

- same-turn deployment of the exact EXEC-63 hardening commit
- final `PRODUCTION_READY` sign-off
