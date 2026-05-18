# Production Stabilization Baseline

Last updated: `2026-05-18`
Scope: `EXEC-23`
Environment: `production`

## Executive Status

OpenStaff production is operational and has passed controlled rollout validation through EXEC-22, but it is not yet at a fully stabilized operational baseline.

Confirmed live on `2026-05-18`:

- Cloud Run services are healthy on active revisions.
- Cloud SQL is hardened with backups, PITR, deletion protection, connector enforcement, and `ENCRYPTED_ONLY`.
- Public/auth/moderation/commercial first-cohort flows were executed successfully.
- Audit and security surfaces are reachable in admin and `/status`.

Confirmed missing on `2026-05-18`:

- `0` Cloud Monitoring alert policies
- `0` Monitoring notification channels
- `0` Monitoring dashboards

These three gaps are the primary reason EXEC-23 cannot be marked `PASS` yet.

## 1. Alerting And Incident Readiness

### Live validation snapshot

| Signal family | Expected stabilized state | Live status on 2026-05-18 |
|---|---|---|
| Cloud Run error spike alerts | active alert policy | missing |
| elevated `5xx` rate alerts | active alert policy | missing |
| auth/login failure alerts | active alert policy or log-based metric alert | missing |
| Cloud SQL CPU/storage/connections alerts | active alert policy | missing |
| failed billing webhook alerts | active alert policy or log-based metric alert | missing |
| failed moderation job alerts | active alert policy or queue-depth alert | missing |
| storage delivery failure alerts | active alert policy or log-based metric alert | missing |
| security critical event alerts | active alert policy | missing |
| notification channels | at least one email/pager/chat channel | missing |

Evidence:

- `gcloud monitoring policies list --project=openstaff-platform` -> `Listed 0 items.`
- `gcloud beta monitoring channels list --project=openstaff-platform` -> `Listed 0 items.`

### Required alert ownership model

| Alert domain | Primary owner | Secondary owner | Severity default | Expected response |
|---|---|---|---|---|
| API availability / `5xx` | L3 Technical Ops | L1 Operations | `SEV-1` if public outage, else `SEV-2` | `15 min` for `SEV-1`, `30 min` for `SEV-2` |
| Auth/login failures | L3 Technical Ops | L4 Security / Compliance | `SEV-2` | `30 min` |
| Cloud SQL saturation / storage / connections | L3 Technical Ops | rollback owner | `SEV-1` if customer-facing impact, else `SEV-2` | `15-30 min` |
| Failed billing webhooks | L2 Business Ops | L3 Technical Ops | `SEV-2` | `30 min` |
| Failed moderation jobs / queue stalls | L1 Operations | L3 Technical Ops | `SEV-2` | `30 min` |
| Storage delivery failures | L3 Technical Ops | L1 Operations | `SEV-2` | `30 min` |
| Critical security events | L4 Security / Compliance | L3 Technical Ops | `SEV-1` | `15 min` |

### Severity classification

| Severity | Definition | Examples |
|---|---|---|
| `SEV-1` | public production outage, data integrity risk, or active security incident | `/health` failing, sustained `5xx`, broken auth for all users, DB exhaustion, critical security event |
| `SEV-2` | degraded production behavior with workaround or bounded blast radius | rising auth failures, webhook failures, moderation queue stall, asset delivery failures |
| `SEV-3` | non-blocking issue or hygiene gap | stale artifacts, dashboard drift, noise cleanup, non-urgent capacity tuning |

### Escalation path

1. L1 Operations acknowledges the alert and confirms user-visible impact.
2. L3 Technical Ops investigates runtime, Cloud Run, Cloud SQL, storage, and rollback options.
3. L2 Business Ops joins when billing, moderation, or operator workflows are affected.
4. L4 Security / Compliance joins immediately for critical security events or suspicious auth patterns.
5. Rollback owner decides whether to shift traffic, pause rollout, or invoke DB recovery procedure.

### Minimum implementation required to close EXEC-23

1. Create at least one notification channel.
2. Create alert policies for:
   - Cloud Run error count / error ratio
   - request latency / `5xx`
   - auth/login failure spikes
   - Cloud SQL CPU / connections / storage
   - billing webhook failures
   - moderation queue or Relu failed-job spikes
   - storage delivery failures
   - critical security event count
3. Test delivery of at least one non-destructive alert.

## 2. Operational Dashboards

### Live validation snapshot

| View | Expected stabilized state | Live status on 2026-05-18 |
|---|---|---|
| API health dashboard | active Monitoring dashboard | missing |
| request latency dashboard | active Monitoring dashboard | missing |
| auth activity dashboard | active Monitoring dashboard | missing |
| moderation queue dashboard | active Monitoring dashboard or admin dashboard reference | missing in GCP, partial in app |
| billing events dashboard | active Monitoring dashboard or admin dashboard reference | missing in GCP, partial in app |
| upload/storage activity dashboard | active Monitoring dashboard | missing |
| audit/security dashboard | active Monitoring dashboard or admin dashboard reference | missing in GCP, partial in app |
| Cloud SQL health dashboard | active Monitoring dashboard | missing |

Evidence:

- `gcloud monitoring dashboards list --project=openstaff-platform` -> `Listed 0 items.`

### Required dashboard set

| Dashboard | Scope | Owner | Current source of truth |
|---|---|---|---|
| API Health | request count, `5xx`, latency, active revision | L3 Technical Ops | GCP Monitoring dashboard required |
| Auth Activity | login success/failure trend, auth errors, security spikes | L4 Security / Compliance | admin security views + GCP dashboard required |
| Moderation Ops | pending posts/media/documents, failed Relu/moderation jobs | L1 Operations | admin queues exist; consolidated dashboard missing |
| Billing Ops | upgrade requests, invoices, webhook failures, payments | L2 Business Ops | admin billing pages exist; consolidated dashboard missing |
| Storage Activity | upload success/failure, delivery failures, bucket growth | L3 Technical Ops | GCP dashboard required |
| Cloud SQL Health | CPU, storage, memory proxy metrics, connections | L3 Technical Ops | GCP dashboard required |

### Minimum implementation required to close EXEC-23

1. Create shared dashboards in Cloud Monitoring for API, Cloud SQL, and error/latency.
2. Document the admin URLs that remain the operational console for:
   - moderation
   - billing
   - security/audit
3. Add dashboard links to operator docs after they exist.

## 3. Runtime Cleanup And Hardening Review

### Live review findings

| Area | Observation on 2026-05-18 | Status | Action |
|---|---|---|---|
| active Cloud Run revisions | API `00008`, web `00010`, admin `00011` are live and healthy | healthy | keep |
| stale Cloud Run revisions | multiple older revisions still retained | expected but stale | document retention policy; optional cleanup later |
| Cloud Run jobs | only `openstaff-api-migrate` remains; bootstrap jobs are already deleted | healthy | keep migrate job |
| Secret Manager | active services use `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_WEBHOOK_SECRET`, `FIREBASE_SERVICE_ACCOUNT_KEY`, `GEMINI_API_KEY` | healthy | keep |
| legacy secret | `WEBHOOK_SECRET` still exists but active runtime uses `STRIPE_WEBHOOK_SECRET` | cleanup candidate | remove only after coordinated doc/script cleanup |
| storage buckets | `openstaff-platform-production` is active; `openstaff-platform_cloudbuild` is default Cloud Build bucket | healthy | keep |
| IAM bindings | compute service account still has `roles/editor` | hardening gap | reduce privileges after explicit role audit |
| service accounts | compute SA and Firebase admin SA are active; no inactive SA confirmed | healthy with review gap | do not remove yet |

### Safe removals completed in prior executions

- temporary bootstrap job for `SUPERADMIN` repair was already deleted before EXEC-22
- no temporary cohort artifacts remain tracked in repo after EXEC-22 proof capture

### Cleanup actions explicitly not taken during EXEC-23

- no secrets were deleted
- no revisions were deleted
- no IAM bindings were removed
- no buckets or Artifact Registry images were deleted

Reason:

- these actions require an explicit least-privilege and retention review to avoid accidental rollback loss or deploy breakage

## 4. Backup And Restore Drill

### Live restore-readiness baseline

Confirmed from Cloud SQL on `2026-05-18`:

- backups enabled
- retained backups: `7`
- PITR enabled
- transaction log retention: `7 days`
- `transactionalLogStorageState = CLOUD_STORAGE`
- deletion protection enabled
- `sslMode = ENCRYPTED_ONLY`

### Drill status

| Item | Status |
|---|---|
| PITR capability documented | yes |
| rollback sequence documented | yes |
| operator recovery checklist documented | yes |
| actual restore executed against a restored instance during EXEC-23 | no, not executed |

### Controlled restore flow

1. Freeze deploys and incident-change activity.
2. Record current healthy Cloud Run revisions.
3. Select restore target timestamp or latest backup.
4. Restore Cloud SQL into a separate recovery instance first.
5. Validate schema level and critical tables on the recovery instance.
6. Decide whether to cut over or continue recovery rehearsal only.
7. Re-run:
   - `/health`
   - `/status`
   - auth smoke
   - moderation smoke
   - billing smoke
8. Only then consider traffic rollback or data cutover.

### Storage recovery expectations

- GCS bucket `openstaff-platform-production` has soft-delete retention of `7 days`.
- Application metadata recovery depends on Cloud SQL restore point.
- Asset object recovery and metadata recovery must be treated as a pair; recovering one without the other is not considered complete service restoration.

### Operator recovery checklist

1. confirm incident scope
2. freeze deploys
3. capture current revision names
4. confirm restore target time
5. restore into separate instance
6. validate auth, moderation, billing, storage references
7. decide cutover vs rehearsal closure
8. update incident log and STATUS evidence

### RTO / RPO expectations

| Metric | Current baseline |
|---|---|
| target `RPO` | up to `7 days` worst-case by backup retention, materially lower when PITR target is usable |
| target `RTO` | operator-managed; not yet proven by timed restore drill |

EXEC-23 conclusion:

- restore readiness is documented and technically enabled
- timed restoration remains unproven until a rehearsal is executed

## 5. Production Capacity Review

### Current live configuration

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

### Traffic and growth assumptions

| Domain | Current assumption |
|---|---|
| rollout traffic | still controlled and bounded, not general-public at scale |
| billing workload | operator-mediated and low throughput |
| moderation workload | human-reviewed and bounded by cohort size |
| storage growth | early-stage, mostly media/document uploads from controlled cohorts |
| auth load | expected bursty around onboarding and operator sessions |

### Operational bottlenecks

1. manual billing does not scale linearly without more operators
2. moderation remains human-gated
3. no min instances means cold-start risk remains part of production behavior
4. no alerting/dashboards means human monitoring remains reactive
5. `roles/editor` on the compute service account is broader than ideal

### Manual operations limits

| Function | Practical current limit |
|---|---|
| billing approvals | low-volume only |
| invoice follow-up | low-volume only |
| moderation turnaround | bounded by staffed shifts |
| support triage | bounded by owner coverage in rollout docs |

## 6. Known Limitations After EXEC-23

1. no live Monitoring alert policies
2. no live Monitoring notification channels
3. no live Monitoring dashboards
4. no timed Cloud SQL restore rehearsal completed
5. compute service account still carries `roles/editor`
6. legacy `WEBHOOK_SECRET` still exists in Secret Manager as historical baggage

## 7. Recommended Immediate Follow-Up

1. create notification channels and alert policies
2. create Monitoring dashboards and link them from operator docs
3. execute a timed non-destructive Cloud SQL restore rehearsal
4. reduce compute service account permissions from `roles/editor` to least privilege
5. remove legacy `WEBHOOK_SECRET` only after docs/scripts and consumer audit are closed
