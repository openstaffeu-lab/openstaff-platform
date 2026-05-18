# EXEC-25 Proof

Verdict: `EXEC-25 PASS`

## Executive Summary

EXEC-25 raised the platform from a stable production baseline to an operational resilience baseline by:

1. documenting the live security posture
2. adding abuse protections to exposed and sensitive routes
3. deploying a new API revision with those protections live
4. creating synthetic monitoring for key user and operator paths
5. separating build/deploy identity from the constrained runtime identity
6. capturing fresh post-change production proof

## Security Posture Proof

Live findings captured during EXEC-25:

1. Cloud Run ingress remains `all` for `openstaff-api`, `openstaff-web`, and `openstaff-admin`
2. public `run.app` URLs remain reachable in addition to the mapped domains
3. production CORS remains explicit:
   - `https://openstaff.eu`
   - `https://backoffice.openstaff.eu`
   - `https://api.openstaff.eu`
4. no wildcard CORS was observed
5. current production secret inventory is:
   - `DATABASE_URL`
   - `FIREBASE_SERVICE_ACCOUNT_KEY`
   - `GEMINI_API_KEY`
   - `JWT_REFRESH_SECRET`
   - `JWT_SECRET`
   - `STRIPE_WEBHOOK_SECRET`
6. anonymous `GET /admin/public-posts` returned `401`
7. temporary `SUPERADMIN` `GET /admin/public-posts` returned `200`
8. Cloud SQL retains a public IP, but `connectorEnforcement = REQUIRED` and `sslMode = ENCRYPTED_ONLY`

Primary write-up:

- [docs/SECURITY_POSTURE_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SECURITY_POSTURE_REVIEW.md:1)

## Rate Limit and Abuse Protection Proof

### Live route protections

Existing and EXEC-25 route protections now include:

1. `POST /auth/register` -> `10` requests / minute
2. `POST /auth/login` -> `10` requests / minute
3. `POST /auth/refresh` -> `20` requests / minute
4. `POST /auth/firebase-exchange` -> `10` requests / minute
5. `POST /subscriptions/upgrade-requests` -> `10` requests / minute
6. `POST /public-posts` -> `10` requests / minute
7. `POST /public-posts/:id/media` -> `15` requests / minute
8. `POST /public-posts/:id/documents` -> `15` requests / minute
9. `POST /public-posts/:id/external-links` -> `20` requests / minute
10. `POST /billing/webhooks/:provider` -> `60` requests / minute
11. `POST /admin/billing/webhooks/:id/process` -> `20` requests / minute
12. `PATCH /admin/public-posts/:id/status` -> `60` requests / minute
13. `PATCH /admin/public-post-media/:id/status` -> `60` requests / minute
14. `PATCH /admin/public-post-documents/:id/status` -> `60` requests / minute

### Live abuse validation

Validation run:

1. `runId = exec25-validate-1779128301118`
2. `firebaseExchangeRateLimitStatus = 429`
3. `loginRateLimitStatus = 429`
4. `webhookRateLimitStatus = 429`

Post-window webhook guard proof:

1. after a `65s` cooldown, a fresh unsigned request returned `400 BAD_REQUEST`
2. response message: `Missing Stripe-Signature header.`

## Synthetic Monitoring Proof

Initial live baseline:

1. `gcloud monitoring uptime list-configs --project=openstaff-platform` returned `0` configs before EXEC-25 creation

Created live uptime checks:

1. `OpenStaff Synthetic - Homepage` -> `openstaff-synthetic-homepage-eOuYxWQl7Kk`
2. `OpenStaff Synthetic - Login` -> `openstaff-synthetic-login-mGFKqMIRLro`
3. `OpenStaff Synthetic - API Health` -> `openstaff-synthetic-api-health-SeRETkws0ic`
4. `OpenStaff Synthetic - API Status` -> `openstaff-synthetic-api-status-JVlha5O88-A`
5. `OpenStaff Synthetic - Public Asset Delivery` -> `openstaff-synthetic-public-asset-delivery-oJoeNiqk6EM`
6. `OpenStaff Synthetic - Billing Webhook Guard` -> `openstaff-synthetic-billing-webhook-guard-8Yxhu2xvZQc`
7. `OpenStaff Synthetic - Admin Readiness` -> `openstaff-synthetic-admin-readiness-eonFq4kRgX8`

Shared configuration:

1. HTTPS probes
2. `5m` cadence
3. `10s` timeout
4. regions: `europe`, `usa-iowa`, `usa-oregon`

## Deploy-Path Resilience Proof

### Problem closed in EXEC-25

The deploy path had implicitly depended on the runtime compute service account after EXEC-24 least-privilege hardening. EXEC-25 corrected this by creating a dedicated build/deploy identity.

### Dedicated build identity

Service account:

1. `openstaff-build@openstaff-platform.iam.gserviceaccount.com`

Project roles:

1. `roles/artifactregistry.writer`
2. `roles/logging.logWriter`
3. `roles/run.admin`
4. `roles/secretmanager.secretAccessor`

Scoped grants:

1. bucket `gs://openstaff-platform_cloudbuild` -> `roles/storage.objectViewer`
2. runtime SA impersonation on `605639023972-compute@developer.gserviceaccount.com` -> `roles/iam.serviceAccountUser`

### Runtime identity remained constrained

Runtime compute SA project roles after EXEC-25:

1. `roles/cloudsql.client`
2. `roles/secretmanager.secretAccessor`

Temporary recovery action closed:

1. temporary runtime source-bucket viewer access was removed after dedicated build identity success

### Successful deployment proof

1. successful build id: `b7e78555-6a7d-4cca-8037-7999fdd7fe92`
2. new API revision: `openstaff-api-00009-jmx`

## Post-Deploy Runtime Validation Proof

Temporary proof identities:

1. `SUPERADMIN = exec25-1779127004458-superadmin@openstaff.eu`
2. `COMPANY = exec25-1779127444555-company@openstaff.eu`

One-off promotion artifact:

- [docs/proof/exec25/runtime/openstaff-api-exec25-promote-superadmin.yaml](/C:/Users/admin/Desktop/openstaff-platform/docs/proof/exec25/runtime/openstaff-api-exec25-promote-superadmin.yaml:1)

Cleanup proof:

1. job `openstaff-api-exec25-promote-superadmin` was deleted after use

Validation result:

```json
{
  "runId": "exec25-validate-1779128301118",
  "superEmail": "exec25-1779127004458-superadmin@openstaff.eu",
  "companyEmail": "exec25-1779127444555-company@openstaff.eu",
  "healthStatus": 200,
  "statusStatus": 200,
  "adminNoTokenStatus": 401,
  "superadminLoginStatus": 200,
  "adminPostsStatus": 200,
  "companyLoginStatus": 200,
  "authMeStatus": 200,
  "postCreateStatus": 201,
  "postId": "54a20e00-cbe4-4cb6-8b97-50e8178227f1",
  "mediaUploadStatus": 201,
  "mediaId": "f7f2f7f6-2b3e-4450-8a5c-91cba7a67016",
  "documentUploadStatus": 201,
  "documentId": "cd205b0f-caf3-40ef-b170-a0793b8608df",
  "approveMediaStatus": 200,
  "approveDocumentStatus": 200,
  "approvePostStatus": 200,
  "publicMediaStatus": 200,
  "publicDocumentStatus": 200,
  "firebaseExchangeRateLimitStatus": 429,
  "loginRateLimitStatus": 429,
  "webhookRateLimitStatus": 429
}
```

Interpretation:

1. `/health` and `/status` stayed healthy on the new API revision
2. anonymous admin access stayed blocked
3. `SUPERADMIN` flows still worked
4. uploads, moderation, and public delivery stayed healthy
5. new abuse protections are live and enforceable

## Monitoring Continuity Proof

EXEC-24 observability remained intact after EXEC-25:

1. `10` alert policies remained enabled
2. dashboards `OpenStaff Prod - Overview` and `OpenStaff Prod - Operational Signals` remained present

## Accepted Limitations

1. `billingPayments = manual_only`
2. `publicUpgradeFlow = request_upgrade`
3. `operatorReviewRequired = true`
4. `emailDelivery = not_configured`
5. `smsDelivery = not_required`
6. critical security alerting still depends on proxy-signal metrics rather than native DB event export
7. Cloud Run ingress remains `all` and public `run.app` URLs remain reachable
