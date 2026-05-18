# OpenStaff Disaster Recovery Plan

Last updated: `2026-05-18`  
Scope: `EXEC-25`

## Objective

This plan documents the production recovery baseline for OpenStaff after EXEC-24 and EXEC-25. It is not an active-active multi-region design. It is a controlled single-region production baseline with validated backup, PITR, rebuild, and rollback expectations.

## Current Assumptions

1. primary runtime region is `europe-west1`
2. production application runtime depends on Cloud Run, Cloud SQL, Secret Manager, Cloud Storage, Cloud Monitoring, and DNS/custom domain mappings
3. Cloud SQL is the primary stateful dependency
4. Cloud Storage holds user assets separately from relational data
5. Cloud Run services are rebuildable from repository + Artifact Registry images + Cloud Build
6. DNS and custom domain readiness are required for full public recovery

## Validated Recovery Baseline

Already proven:

1. Cloud SQL backups enabled
2. PITR enabled
3. isolated restore rehearsal completed in EXEC-24
4. restore validation succeeded with SQL connectivity proof
5. production application smoke remained healthy after observability and IAM hardening

Measured restore proof from EXEC-24:

1. backup restored to isolated instance `openstaff-db-recovery-exec24`
2. restore operation duration: `4m 59.686s`
3. SQL validation: `SELECT 1;` succeeded

## Failure Domains

### Application-only failure

Examples:

1. bad API revision
2. Cloud Run deploy regression
3. front-end rendering regression

Preferred response:

1. roll traffic back to last known healthy revision
2. keep data plane unchanged unless evidence points to DB or storage corruption

### Data-plane failure

Examples:

1. Cloud SQL corruption or credential failure
2. destructive data change
3. migration failure

Preferred response:

1. stop deploy activity
2. assess restore point or PITR target
3. restore to isolated instance first when time allows
4. promote or cut over only after validation

### Regional degradation

Examples:

1. `europe-west1` Cloud Run instability
2. regional database outage
3. regional networking impact

Preferred response:

1. confirm whether outage is app-only or regional
2. use static public comms and operator freeze if needed
3. decide whether to wait for regional recovery or perform controlled rebuild into alternate target infrastructure

## Recovery Ordering

Preferred recovery order:

1. confirm incident scope from Monitoring alerts, uptime checks, logs, `/health`, and `/status`
2. freeze deploy activity and operator-side writes if needed
3. stabilize or restore the API runtime path
4. restore database access and integrity
5. validate admin auth and moderation access
6. validate upload/storage behavior
7. validate billing webhook entry and guarded error behavior
8. validate public approved asset delivery
9. validate public site and admin readiness page

## Cloud Run Rebuild Expectations

Cloud Run can be rebuilt from:

1. repository source
2. Cloud Build config
3. Artifact Registry images
4. Secret Manager runtime contract

EXEC-25 added a more resilient deployment model by separating build/deploy identity from the constrained runtime identity.

Operational expectation:

1. app-only recovery should usually be minutes, not hours, if the data plane is healthy

## Cloud SQL Restore Expectations

Current baseline:

1. backups enabled
2. PITR enabled
3. deletion protection enabled
4. connector enforcement required
5. encrypted-only transport enforced

Recovery expectation:

1. isolated restore plus validation can complete on the order of minutes for the current dataset size
2. final recovery time grows if application validation, cutover coordination, or migration reconciliation is needed

## GCS and Asset Recovery Expectations

Production assets are stored in `gs://openstaff-platform-production`.

Recovery notes:

1. database restore does not automatically imply asset restore
2. application recovery validation must include approved public asset delivery
3. if DB is restored to an older point, asset/database consistency must be checked for recently created or moderated objects

## DNS and Domain Dependencies

Public recovery depends on:

1. `openstaff.eu`
2. `api.openstaff.eu`
3. `backoffice.openstaff.eu`
4. TLS certificate health
5. Cloud Run domain mappings

If custom domains fail but Cloud Run is healthy:

1. operators can still use direct service URLs for diagnosis
2. user-facing recovery is incomplete until domain routing is restored

## Rollback Criteria

Pause or rollback if:

1. `/health` stops returning `200`
2. `/status` shows non-healthy database state after cutover
3. valid admin login fails unexpectedly
4. moderation routes fail
5. uploads or public asset delivery regress
6. billing webhook behavior deviates from guarded app-level expectations

## RTO and RPO Guidance

Current practical baseline:

1. RTO for isolated restore validation has proof in the ~5 minute range before application cutover work
2. RPO depends on available PITR target and backup timing
3. final business-facing RTO is longer than raw database restore time because auth, moderation, billing ingress, and public asset delivery must also be validated

## Current Limitations

1. no active-active multi-region design
2. no database replica failover model documented as live
3. Cloud Run ingress still depends on public service exposure and DNS/custom domain health
4. application recovery still assumes operator-driven validation after restore
