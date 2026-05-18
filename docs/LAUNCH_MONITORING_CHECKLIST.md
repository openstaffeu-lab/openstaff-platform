# OpenStaff Launch Monitoring Checklist

Last updated: 2026-05-18

## Monitoring Window

Use this checklist for the first `24-48 hours` of controlled public rollout operations.

## Cadence

- every shift start
- midday review
- end-of-day handoff
- immediate review after any production incident or user-reported blocker

## Runtime Health

### API Health

- verify `https://api.openstaff.eu/health`
- confirm `status = ok`
- confirm `environment = production`

### API Status

- verify `https://api.openstaff.eu/status`
- confirm `status = ok`
- confirm `db = healthy`
- confirm `warnings = []`
- confirm `errors = []`
- confirm commercial contract values remain:
  - `commercial.launchMode = manual_only`
  - `publicUpgradeFlow = request_upgrade`
  - `operatorReviewRequired = true`
  - `billingWebhook.mode = configured`
  - `billingPayments.mode = manual_only`
  - `emailDelivery.mode = not_configured`
  - `smsDelivery.mode = not_required`

## Infrastructure Monitoring

### Cloud Run

- review API, web, and admin service logs
- check for rising `5xx`, cold-start failures, permission errors, or revision instability
- confirm active revisions remain:
  - `openstaff-api-00008-nql`
  - `openstaff-web-00010-pgt`
  - `openstaff-admin-00011-dqr`

### Cloud SQL

- review instance health, connections, CPU, memory, and storage trend
- confirm no backup/PITR/deletion-protection regressions
- escalate immediately on connection saturation or failover risk

### Cloud Storage / GCS

- confirm media/document uploads succeed
- confirm approved assets remain publicly retrievable where expected
- investigate any signed URL, permissions, or storage bucket anomalies

## Product Monitoring

### Auth Failures

- review login failures, refresh failures, and permission errors
- watch for repeated `401`, `403`, auth loop, or session issues
- prioritize `SUPERADMIN` and operator auth failures

### Moderation Queue

- check pending public posts
- check pending public media/documents/external links
- confirm queue backlog stays within operator SLA

### Billing Events

- check upgrade request queue
- check invoice/proforma creation queue
- check payment states and failed webhook events
- ensure no user is told payment is automatic when it is still `manual_only`

### Notification Events

- review failed notification deliveries
- confirm in-app notifications remain functional
- accept that `emailDelivery = not_configured`
- accept that `smsDelivery = not_required`

### Security / Audit Events

- review admin security dashboard
- triage critical or repeated permission failures
- review suspicious login patterns
- review open compliance/security items

## First-User Monitoring

For the first live users in each cohort, verify:

- registration succeeds
- login succeeds
- onboarding starts
- profile/company setup persists
- publish flow succeeds
- media/document upload succeeds
- moderation approve/reject behaves correctly
- approved content becomes public
- rejected or pending content stays hidden
- upgrade request reaches operator queue
- billing follow-up is assigned to an owner

## Escalation Triggers

Escalate immediately if:

- `/health` or `/status` fail
- admin route protection breaks
- uploads fail repeatedly
- billing queue becomes unattended
- moderation queue exceeds SLA
- critical security events appear
- Cloud Run or Cloud SQL errors suggest rollback risk

## End-Of-Day Handoff

Record:

- incidents observed
- unresolved risks
- queue backlog counts
- impacted users
- assigned next owner
- rollback recommendation if any
