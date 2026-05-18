# EXEC-24 Proof

Last updated: `2026-05-18`  
Scope: `Production Observability, Alerting & Recovery Closure`

## Verdict

`EXEC-24 PASS`

Production observability and recovery maturity gaps from EXEC-23 were closed with live implementation and post-change proof.

## 1. Notification Channel Proof

| Item | Value |
|---|---|
| channel display name | `OpenStaff Ops Email` |
| channel id | `projects/openstaff-platform/notificationChannels/16914670128256150084` |
| type | `email` |
| enabled | `true` |
| route | `openstaff.eu@gmail.com` |

## 2. Alert Inventory Proof

| Alert policy | Policy id | Severity | Threshold | Route |
|---|---|---|---|---|
| Cloud Run 5xx Spike | `11524114636446058063` | `SEV-2` | `> 4` `5xx` in `5m` | email channel |
| Cloud Run Latency P95 | `7482020349326638750` | `SEV-2` | p95 `> 2000 ms` for `10m` | email channel |
| Auth Login Failure Spike | `15391475502136670794` | `SEV-2` | `> 4` failures in `5m` | email channel |
| Cloud SQL CPU High | `4271658493465720175` | `SEV-2` | CPU `> 80%` for `10m` | email channel |
| Cloud SQL Connections High | `12480815822325776710` | `SEV-2` | backends `> 40` for `10m` | email channel |
| Cloud SQL Storage Utilization High | `18326074938026175970` | `SEV-2` | disk utilization `> 80%` for `15m` | email channel |
| Stripe Webhook Failures | `11142017728836420317` | `SEV-2` | any failure in `5m` | email channel |
| Moderation Failures | `9538430695422670622` | `SEV-2` | any failure in `5m` | email channel |
| Storage Delivery Failures | `15815289231249814837` | `SEV-2` | any failure in `5m` | email channel |
| Security Critical Signals | `7385145099888946834` | `SEV-1` | any signal in `5m` | email channel |

All policies were created live in Cloud Monitoring, are enabled, and are attached to the email channel above.

## 3. Dashboard Inventory Proof

| Dashboard | Dashboard id | Coverage |
|---|---|---|
| `OpenStaff Prod - Overview` | `03d08d77-9adb-41e6-bdc0-74c5b96e8307` | request rate, latency, `5xx`, instance count, Cloud SQL CPU, connections, storage |
| `OpenStaff Prod - Operational Signals` | `5520ed58-22df-4769-828e-652ae71f6a40` | auth failures, billing webhook failures, moderation failures, storage delivery failures, security signals |

## 4. Logs-Based Metrics Proof

| Metric | Purpose |
|---|---|
| `logging.googleapis.com/user/auth_login_failures_count` | auth failure alerting + dashboarding |
| `logging.googleapis.com/user/billing_webhook_failures_count` | billing webhook alerting + dashboarding |
| `logging.googleapis.com/user/moderation_failures_count` | moderation alerting + dashboarding |
| `logging.googleapis.com/user/storage_delivery_failures_count` | public asset delivery alerting + dashboarding |
| `logging.googleapis.com/user/security_critical_signals_count` | security proxy alerting + dashboarding |

## 5. Restore Rehearsal Proof

### Source production baseline

| Item | Value |
|---|---|
| source instance | `openstaff-db` |
| backup id | `1779073200000` |
| source posture | backups enabled, PITR enabled, `ENCRYPTED_ONLY`, deletion protection enabled |

### Rehearsal execution

| Item | Value |
|---|---|
| recovery instance | `openstaff-db-recovery-exec24` |
| restore operation | `64b2eda1-378d-4137-81ed-bef200000024` |
| start | `2026-05-18T16:03:39.170Z` |
| end | `2026-05-18T16:08:38.856Z` |
| measured restore duration | `4m 59.686s` |

### Validation performed

- recovery instance reached `RUNNABLE`
- restored databases included `openstaff_prod`
- SQL connectivity proof succeeded with `SELECT 1;` through `npx prisma db execute`
- production traffic was not touched during the drill

### Cleanup proof

| Item | Value |
|---|---|
| delete operation | `48db977d-22ea-4078-9de0-acd600000024` |
| cleanup result | recovery instance deleted after validation |

### Recovery expectations recorded

- measured rehearsal duration supports an initial operator RTO estimate of roughly `5-10 minutes` for instance recovery plus validation
- RPO remains bounded by backup/PITR position; point-in-time recovery stayed enabled on production
- storage recovery expectation remains unchanged: GCS assets stay independent of the DB restore and must only be checked for object reachability

## 6. IAM Hardening Proof

### Runtime compute service account

`605639023972-compute@developer.gserviceaccount.com`

### Before EXEC-24

- `roles/cloudsql.client`
- `roles/editor`
- `roles/iam.serviceAccountUser`
- `roles/secretmanager.secretAccessor`

### After EXEC-24

- project-level: `roles/cloudsql.client`
- project-level: `roles/secretmanager.secretAccessor`
- bucket-level on `gs://openstaff-platform-production`: `roles/storage.objectAdmin`

### IAM hardening result

- `roles/editor` removed safely
- `roles/iam.serviceAccountUser` removed safely
- runtime upload and public asset delivery remained healthy after the change
- Cloud Build permissions were left intact to avoid deployment regressions

## 7. Cleanup Proof

| Asset | Action | Result |
|---|---|---|
| `WEBHOOK_SECRET` | deleted | legacy secret removed |
| `openstaff-api-exec24-promote-superadmin` | deleted | one-off bootstrap job removed after proof |
| `openstaff-db-recovery-exec24` | deleted | recovery instance removed after rehearsal |
| stale revisions | retained intentionally | rollback history preserved |
| `openstaff-api-migrate` | retained intentionally | still valid for migration workflow |

## 8. Post-Change Validation Proof

### Validation run

| Item | Value |
|---|---|
| temp `SUPERADMIN` | `exec24-1779122357573-superadmin@openstaff.eu` |
| temp company | `exec24-company-1779123374213@openstaff.eu` |
| public post id | `1222a73a-5d7f-480f-87a7-27fb6b9b09c7` |
| media id | `49a6e7f0-b9ad-4bf5-862a-d3cf77f0f97c` |
| document id | `bc77d8f2-f86c-4d39-b2a5-64a3411788cc` |

### Results

| Check | Result |
|---|---|
| `GET /health` | `200` |
| `GET /status` | `200` |
| temp `SUPERADMIN` login | `200` |
| `GET /admin/public-posts` | `200` |
| company login | `200` |
| `POST /public-posts` | `201` |
| `POST /public-posts/:id/media` | `201` |
| `POST /public-posts/:id/documents` | `201` |
| approve media | `200` |
| approve document | `200` |
| approve post | `200` |
| public media delivery | `200` |
| public document delivery | `200` |
| billing webhook path | controlled app response `400 BAD_REQUEST` |

### Billing webhook note

The negative webhook check intentionally used an invalid signature and returned:

`Stripe webhook signature verification failed.`

This is accepted proof that the route remained reachable and enforced signature verification after the IAM and observability changes.

## 9. Accepted Remaining Limitations

1. `billingPayments = manual_only`
2. `publicUpgradeFlow = request_upgrade`
3. `operatorReviewRequired = true`
4. `emailDelivery = not_configured`
5. `smsDelivery = not_required`
6. critical security alerting currently depends on Cloud Logging-visible proxy signals until database-native security events are exported as Monitoring metrics
