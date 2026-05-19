# OpenStaff Incident Response Runbook

Last updated: `2026-05-18`  
Scope: `EXEC-26`

## Purpose

This runbook defines the production incident response model for OpenStaff. It is intended for controlled real-user operations, not for a fully staffed 24/7 SRE organization. The goal is to make ownership, severity, escalation, rollback authority, and recovery expectations repeatable.

## Severity Model

### `SEV-1`

Use when:

1. public platform is materially unavailable
2. auth is broadly unavailable
3. Cloud SQL is unavailable or corrupted
4. production data integrity is at immediate risk
5. operator safety requires immediate traffic freeze or rollback

Response expectation:

1. acknowledge immediately
2. freeze deploys
3. assign incident commander
4. establish operator comms channel
5. restore core service before secondary work

### `SEV-2`

Use when:

1. a major production capability is degraded
2. billing webhook processing is failing
3. moderation or admin workflows are materially impaired
4. storage delivery is failing for approved public assets
5. DNS/TLS degradation affects part of the user journey

Response expectation:

1. acknowledge within `15` minutes
2. establish owner and backup owner
3. execute mitigation or rollback path

### `SEV-3`

Use when:

1. production is healthy overall but an operator workflow is impaired
2. a single feature or path has degraded behavior
3. synthetic probes or alerts indicate repeated but non-catastrophic regressions

Response expectation:

1. acknowledge within `4` business hours
2. triage and schedule fix or rollback

### `SEV-4`

Use when:

1. issue is low urgency
2. documentation, cleanup, or non-blocking operational polish is needed
3. no current production risk exists

Response expectation:

1. capture in ops log
2. plan in normal execution cadence

## Ownership Model

Primary roles:

1. Incident Commander: owns triage, timeline, severity, next actions, and closeout
2. Technical Ops: owns Cloud Run, Cloud SQL, Monitoring, IAM, and deploy path
3. Security/Compliance: owns auth-risk, secret-risk, and exposure-risk review
4. Operator Moderation/Billing Lead: owns moderation/admin and billing workflow impacts
5. Communications Owner: updates internal stakeholders and controlled-rollout operators

For the current team size, one person may temporarily hold multiple roles, but the runbook still requires the roles to be named explicitly in the incident log.

## Escalation Chain

1. Technical Ops first for runtime, database, deployment, monitoring, DNS, and IAM issues
2. Security/Compliance first for auth abuse, secret exposure, or suspicious access patterns
3. Operator Moderation/Billing lead first for moderation queue or billing webhook failures
4. Incident Commander escalates cross-functionally whenever production health, data integrity, or rollback authority is involved

## Communication Flow

During an active incident:

1. create an ops-log incident entry
2. record severity, commander, owner, affected systems, and first observed time
3. post updates in fixed intervals or after every material state change
4. record mitigation, rollback, validation, and closure time

Minimum communication states:

1. `identified`
2. `mitigating`
3. `recovered`
4. `monitoring`
5. `closed`

## Rollback Authority

Rollback authority belongs to:

1. Incident Commander for `SEV-1` and `SEV-2`
2. Technical Ops for app-only regressions when impact is clear
3. Security/Compliance jointly with Technical Ops for auth, secret, or IAM rollback decisions

Production rollback should not wait for full root-cause analysis when the current path is clearly unsafe.

## Global Incident Workflow

1. confirm the incident signal from alerts, uptime checks, `/health`, `/status`, logs, or operator reports
2. assign severity and incident commander
3. freeze production deploys if user impact is active
4. determine whether the problem is app-only, data-plane, edge/DNS, or configuration-driven
5. mitigate with rollback, redeploy, restore, or config correction
6. run smoke validation before declaring recovery
7. capture a final ops-log entry and follow-up actions

## Scenario Playbooks

### Auth Outage

Triggers:

1. login failures spike
2. `SUPERADMIN` access fails unexpectedly
3. `/status` auth mode or auth readiness degrades

Immediate actions:

1. verify `/health` and `/status`
2. test a controlled login path
3. inspect recent auth/security events and rate-limit behavior
4. check `FIREBASE_SERVICE_ACCOUNT_KEY`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` change history
5. decide whether rollback is faster than hotfix

Recovery expectation:

1. restore basic login and protected route access first
2. then validate refresh/logout and admin routes

### Cloud SQL Outage

Triggers:

1. `/status` reports `db = error`
2. Cloud SQL alerts fire
3. API becomes unhealthy due to data-plane loss

Immediate actions:

1. freeze deploys and migrations
2. inspect Cloud SQL instance health, operations, and connectivity
3. determine whether issue is credentials, connectivity, or instance availability
4. if restore is needed, follow [docs/DISASTER_RECOVERY_PLAN.md](/C:/Users/admin/Desktop/openstaff-platform/docs/DISASTER_RECOVERY_PLAN.md:1)

Recovery expectation:

1. restore DB access first
2. validate `/status`
3. then validate auth, moderation, uploads, and billing ingress

### Cloud Run Outage

Triggers:

1. service URL fails
2. 5xx alert fires
3. latest revision is unhealthy or serving bad responses

Immediate actions:

1. identify affected service: API, web, or admin
2. compare current revision to last known healthy revision
3. shift traffic back when rollback is lower risk than debugging live

Recovery expectation:

1. restore user-facing health quickly through traffic rollback
2. investigate root cause after service recovery

### Storage Outage

Triggers:

1. approved public asset delivery fails
2. upload paths fail unexpectedly
3. storage delivery alert fires

Immediate actions:

1. test upload and approved asset retrieval
2. inspect GCS bucket health, IAM, and application logs
3. determine whether issue is upload-side, moderation visibility, or delivery-side

Recovery expectation:

1. restore approved asset delivery first
2. restore fresh uploads second

### Stripe Webhook Outage

Triggers:

1. webhook failure alert fires
2. billing webhooks queue shows failures
3. signature verification suddenly fails for valid provider traffic

Immediate actions:

1. confirm route reachability
2. inspect signature verification path and `STRIPE_WEBHOOK_SECRET`
3. inspect billing webhook queue and recent payload failures
4. decide whether secret rollback or app rollback is faster

Recovery expectation:

1. restore verified ingestion and queue visibility
2. reconcile failed events after service recovery

### Moderation/Admin Outage

Triggers:

1. admin moderation routes fail
2. admin shell is reachable but operational pages break
3. `SUPERADMIN` flows regress

Immediate actions:

1. test anonymous admin API protection still returns `401`
2. test authenticated `SUPERADMIN` access
3. inspect latest deploy, runtime config, and auth readiness

Recovery expectation:

1. restore moderation queue access quickly
2. then validate post/media/document approve paths

### DNS/TLS Incident

Triggers:

1. custom domains fail
2. TLS cert is invalid or expired
3. direct `run.app` URLs work while mapped domains fail

Immediate actions:

1. confirm whether Cloud Run services themselves are healthy
2. inspect domain mappings, DNS records, and cert status
3. use direct service URLs for diagnosis if needed

Recovery expectation:

1. mapped-domain restoration is required for user-facing recovery
2. direct service health alone is not enough

### Accidental Deploy Regression

Triggers:

1. new revision introduces 5xx, auth regression, or operator workflow breakage
2. synthetic checks or smoke checks fail immediately after deploy

Immediate actions:

1. stop further deploys
2. revert traffic to the previous healthy revision
3. rerun smoke checks

Recovery expectation:

1. recovery is complete only after `/health`, `/status`, auth, moderation, uploads, billing webhook guard, and asset delivery are revalidated

## Recovery Validation Checklist

Minimum recovery validation:

1. `/health = 200`
2. `/status = 200`
3. auth path healthy
4. `SUPERADMIN` path healthy when relevant
5. upload path healthy when relevant
6. moderation path healthy when relevant
7. billing webhook guard behavior healthy when relevant
8. synthetic monitoring still present

## Post-Incident Requirements

1. create or update the incident entry in `docs/ops-log/incidents/`
2. record timeline, root cause, mitigation, rollback, and validation
3. record follow-up work if prevention gaps remain
