# OpenStaff Data Lifecycle Policy

Last updated: `2026-05-19`  
Scope: `EXEC-27`

## Purpose

This policy defines the operational lifecycle expectations for production data so cleanup, rollback, moderation, and audit decisions follow one baseline.

## Source-of-Truth Principles

1. Cloud SQL is the source of truth for relational state
2. GCS is the source of truth for uploaded binary objects
3. Cloud SQL backups and PITR are recovery controls, not a working archive for normal retrieval
4. repo proof files are evidence artifacts, not production system state

## Retention Expectations

### Moderation data

1. moderation decisions and status history should be retained in Cloud SQL for operational traceability
2. rejected assets must not be deleted immediately if their metadata is still needed for operator review or incident analysis
3. rejected binary objects become cleanup candidates only after the review window is intentionally approved

### Billing data

1. invoices, payment records, billing events, and webhook events are finance-sensitive records
2. do not apply routine destructive cleanup to billing records until a finance/legal retention policy is explicitly approved

### Audit and security data

1. audit logs, security events, session records, and ops-log entries should be retained long enough to support incident review and governance proof
2. no cleanup should remove auditability for a still-relevant production decision

### Storage cleanup expectations

1. orphaned or rejected objects may be cleaned only when their related moderation, billing, or audit needs are resolved
2. approved public assets must not be deleted while the parent approved content is still expected to remain live

### Backup retention assumptions

Current baseline assumption:

1. Cloud SQL automated backups retained: `7`
2. PITR log retention: `7` days

If retention policy changes:

1. update this document
2. update recovery runbooks
3. capture proof in the relevant execution

## Deletion Expectations

1. destructive cleanup requires explicit operator intent
2. production deletions should prefer reversible or well-documented paths
3. cleanup must preserve incident, billing, and rollback evidence where relevant

## Rejected Asset Lifecycle

1. rejected assets remain non-public
2. metadata should remain available for moderation review
3. binary cleanup should happen only after the retention decision is explicitly approved

## Accepted Limitations

1. OpenStaff does not yet have a fully automated production data-retention engine
2. some lifecycle handling remains operator-reviewed
3. billing and audit retention are intentionally conservative until a stricter compliance policy is approved
