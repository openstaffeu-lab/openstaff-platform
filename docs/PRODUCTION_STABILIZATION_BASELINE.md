# Production Stabilization Baseline

Last updated: `2026-05-18`  
Scope: `EXEC-24`  
Environment: `production`

## Executive Status

OpenStaff production now has a real observability and recovery baseline in live GCP.

Confirmed live on `2026-05-18`:

- Cloud Run production services are healthy on active revisions.
- Cloud SQL remains hardened with backups, PITR, deletion protection, and `ENCRYPTED_ONLY`.
- Cloud Monitoring now has a live email notification channel, active alert policies, and shared dashboards.
- A controlled Cloud SQL restore rehearsal was executed to a separate recovery instance and validated with a SQL command before cleanup.
- The default compute service account no longer carries `roles/editor` or `roles/iam.serviceAccountUser`.
- The legacy `WEBHOOK_SECRET` secret has been removed.

EXEC-24 closes the observability, alerting, restore rehearsal, and least-privilege blockers that kept EXEC-23 open.

## 1. Alerting And Incident Readiness

### Live channel baseline

| Item | Live status | Proof |
|---|---|---|
| primary email notification channel | active | `projects/openstaff-platform/notificationChannels/16914670128256150084` |
| channel enabled | yes | `displayName = OpenStaff Ops Email`, `enabled = true` |
| channel routing | operator email | `email_address = openstaff.eu@gmail.com` |

### Live alert inventory

| Alert policy | Severity | Threshold | Primary owner | Policy id |
|---|---|---|---|---|
| Cloud Run 5xx Spike | `SEV-2` | `> 4` `5xx` responses in `5m` per service | L3 Technical Ops | `11524114636446058063` |
| Cloud Run Latency P95 | `SEV-2` | p95 latency `> 2000 ms` for `10m` | L3 Technical Ops | `7482020349326638750` |
| Auth Login Failure Spike | `SEV-2` | `> 4` failed logins in `5m` | L3 Technical Ops + L4 Security | `15391475502136670794` |
| Cloud SQL CPU High | `SEV-2` | CPU utilization `> 80%` for `10m` | L3 Technical Ops | `4271658493465720175` |
| Cloud SQL Connections High | `SEV-2` | PostgreSQL backends `> 40` for `10m` | L3 Technical Ops | `12480815822325776710` |
| Cloud SQL Storage Utilization High | `SEV-2` | disk utilization `> 80%` for `15m` | L3 Technical Ops | `18326074938026175970` |
| Stripe Webhook Failures | `SEV-2` | any failed webhook request in `5m` | L2 Billing Ops + L3 Technical Ops | `11142017728836420317` |
| Moderation Failures | `SEV-2` | any failed moderation endpoint request in `5m` | L1 Operations + L3 Technical Ops | `9538430695422670622` |
| Storage Delivery Failures | `SEV-2` | any failed asset delivery request in `5m` | L3 Technical Ops | `15815289231249814837` |
| Security Critical Signals | `SEV-1` | any critical security proxy signal in `5m` | L4 Security / Compliance | `7385145099888946834` |

### Supporting log-based metrics

| Metric | Purpose |
|---|---|
| `logging.googleapis.com/user/auth_login_failures_count` | auth/login failure spike alert + dashboard |
| `logging.googleapis.com/user/billing_webhook_failures_count` | Stripe webhook failure alert + dashboard |
| `logging.googleapis.com/user/moderation_failures_count` | moderation failure alert + dashboard |
| `logging.googleapis.com/user/storage_delivery_failures_count` | public asset delivery failure alert + dashboard |
| `logging.googleapis.com/user/security_critical_signals_count` | security proxy alert + dashboard |

### Escalation model

| Domain | Primary owner | Secondary owner | Expected response |
|---|---|---|---|
| Cloud Run availability / latency | L3 Technical Ops | L1 Operations | `15 min` |
| Auth / login failures | L3 Technical Ops | L4 Security / Compliance | `15 min` |
| Cloud SQL saturation | L3 Technical Ops | rollback owner | `15 min` |
| Billing webhook failures | L2 Business Ops | L3 Technical Ops | `15 min` |
| Moderation failures | L1 Operations | L3 Technical Ops | `15 min` |
| Storage delivery failures | L3 Technical Ops | L1 Operations | `15 min` |
| Security critical signals | L4 Security / Compliance | L3 Technical Ops | `10 min` |

## 2. Operational Dashboards

### Live dashboard inventory

| Dashboard | Dashboard id | Coverage |
|---|---|---|
| `OpenStaff Prod - Overview` | `03d08d77-9adb-41e6-bdc0-74c5b96e8307` | Cloud Run request rate, p95 latency, `5xx`, instance count, Cloud SQL CPU, backends, disk utilization |
| `OpenStaff Prod - Operational Signals` | `5520ed58-22df-4769-828e-652ae71f6a40` | auth failures, Stripe webhook failures, moderation failures, storage delivery failures, security proxy signals |

### Area-to-dashboard mapping

| Operational view | Source of truth |
|---|---|
| API health | `OpenStaff Prod - Overview` |
| request latency | `OpenStaff Prod - Overview` |
| Cloud Run revision/runtime health | `OpenStaff Prod - Overview` |
| Cloud SQL health | `OpenStaff Prod - Overview` |
| auth activity | `OpenStaff Prod - Operational Signals` |
| billing/webhooks | `OpenStaff Prod - Operational Signals` plus admin billing routes |
| upload/storage traffic | `OpenStaff Prod - Operational Signals` plus GCS bucket metrics |
| moderation queue/failures | `OpenStaff Prod - Operational Signals` plus admin moderation queues |
| audit/security events | `OpenStaff Prod - Operational Signals` plus `/admin/security/events` |

## 3. Runtime Cleanup And Hardening Review

### Completed in EXEC-24

| Area | Action | Result |
|---|---|---|
| notification channel | created | live email channel enabled |
| alert policies | created | `10` live policies |
| dashboards | created | `2` shared dashboards |
| compute service account | removed `roles/editor` | closed |
| compute service account | removed `roles/iam.serviceAccountUser` | closed |
| storage access | granted bucket-level `roles/storage.objectAdmin` on `gs://openstaff-platform-production` | runtime-safe least privilege baseline |
| legacy secret | deleted `WEBHOOK_SECRET` | closed |
| restore rehearsal artifacts | deleted one-off job and deleted recovery instance after validation | closed |

### Retained intentionally

| Area | Status | Reason |
|---|---|---|
| Cloud Run stale revisions | retained | safe rollback history kept |
| Artifact Registry historical images | retained | no retention policy was approved in EXEC-24 |
| `openstaff-api-migrate` job | retained | still valid for controlled migration workflow |
| default Cloud Build bucket | retained | platform-managed build dependency |

### Final runtime role baseline for compute service account

`605639023972-compute@developer.gserviceaccount.com`

- `roles/cloudsql.client`
- `roles/secretmanager.secretAccessor`
- bucket-level `roles/storage.objectAdmin` on `gs://openstaff-platform-production`

## 4. Backup And Restore Drill

### Source posture confirmed before rehearsal

- source instance: `openstaff-db`
- state: `RUNNABLE`
- backups: enabled
- PITR: enabled
- deletion protection: enabled
- connector enforcement: `REQUIRED`
- SSL mode: `ENCRYPTED_ONLY`
- latest automated backup id used for rehearsal: `1779073200000`

### Rehearsal execution

| Step | Result |
|---|---|
| create isolated recovery instance | `openstaff-db-recovery-exec24` created successfully |
| restore backup to recovery instance | operation `64b2eda1-378d-4137-81ed-bef200000024` completed `DONE` |
| restored instance state | `RUNNABLE` |
| restored databases visible | `postgres`, `openstaff`, `openstaff_prod` |
| SQL validation | `SELECT 1;` via Prisma `db execute` succeeded against recovery instance |
| cleanup | recovery instance deleted successfully via operation `48db977d-22ea-4078-9de0-acd600000024` |

### Timing

| Metric | Value |
|---|---|
| restore start | `2026-05-18T16:03:39.170Z` |
| restore end | `2026-05-18T16:08:38.856Z` |
| observed restore duration | `4m 59.686s` |
| recovery delete duration | `1m 47.314s` |

### RTO / RPO interpretation

| Metric | Current estimate |
|---|---|
| rehearsal RTO to recovery instance | about `5 minutes` for restore, plus operator validation time |
| practiced-path RPO | aligned to selected backup point `2026-05-18T04:35:24.939Z` |
| PITR capability window | `earliestRecoveryTime = 2026-05-17T09:19:01.206Z`, `latestRecoveryTime = 2026-05-18T16:10:30.254751417Z` |
| production cutover RTO | still operator-managed; not exercised as a traffic cutover in EXEC-24 |

### Recovery conclusions

- backup restore rehearsal is now proven on a separate instance
- database accessibility was validated with a real SQL command
- production traffic was not impacted
- PITR remains available for finer-grained recovery, but EXEC-24 exercised backup restore rather than a PITR cutover

## 5. Production Capacity Review

### Current live runtime

| Service | Max instances | Min instances | CPU | Memory | Concurrency |
|---|---:|---:|---:|---:|---:|
| `openstaff-api` | `10` | `0` implicit | `1` | `1Gi` | `80` |
| `openstaff-web` | `10` | `0` implicit | `1` | `512Mi` | `80` |
| `openstaff-admin` | `5` | `0` implicit | `1` | `512Mi` | `80` |

Cloud SQL baseline:

- tier: `db-custom-1-3840`
- disk: `20 GB`
- storage auto-resize: enabled
- availability: `ZONAL`

### Operational bottlenecks that still remain accepted

1. billing remains `manual_only`
2. moderation remains human-gated
3. `emailDelivery = not_configured`
4. `smsDelivery = not_required`
5. dashboards and alerts are live, but security-event alerting still uses a Cloud Logging-visible proxy until DB-native security events are exported as metrics

## Final Verdict

`EXEC-24 PASS`

Production now has:

1. live Monitoring notification routing
2. live Monitoring alert policies
3. live Monitoring dashboards
4. a proven restore rehearsal with timing evidence
5. least-privilege closure for the default runtime service account
6. cleanup of the legacy webhook secret and temporary recovery artifacts
