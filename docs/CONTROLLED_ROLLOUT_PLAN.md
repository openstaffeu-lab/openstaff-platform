# OpenStaff Controlled Rollout Plan

Last updated: 2026-05-18

## Rollout Mode

OpenStaff is now operating in `production` with a `controlled rollout` model.

Accepted launch constraints:

- billing payments remain `manual_only`
- public upgrades follow `request_upgrade`
- operator review remains required before plan activation
- billing webhook mode is `configured`
- email delivery remains `not_configured`
- SMS delivery remains `not_required`

This plan must be used together with:

- `STATUS.md`
- `docs/LAUNCH_CHECKLIST.md`
- `docs/LAUNCH_MONITORING_CHECKLIST.md`
- `docs/OPERATOR_SOP.md`
- `docs/DEPLOYMENT_RUNBOOK.md`

## Rollout Cohorts

### Cohort 1: Internal Operators

Purpose:
- validate day-1 operator routines in live production
- confirm admin readiness, moderation, billing, security, and support coverage

Entry criteria:
- `SUPERADMIN` login confirmed live
- `/admin/production-readiness` shows `Ready for controlled rollout`
- support owner, moderation owner, billing owner, and technical owner assigned

Scope:
- admin moderation actions
- upgrade request review
- invoice creation and manual payment reconciliation
- security/compliance triage

Operator responsibilities:
- monitor dashboards at the beginning and end of each shift
- clear moderation and upgrade queues within the agreed SLA
- escalate runtime, billing, or security anomalies immediately

### Cohort 2: First Test Companies / Clients

Purpose:
- validate the employer-side public and admin journey with real production data

Entry criteria:
- company understands launch mode is controlled, not self-serve checkout
- company accepts operator review for upgrades and billing follow-up
- billing contact and support contact are known

Scope:
- public registration and login
- onboarding start
- profile/company setup
- publish first post/project
- upload supporting media/documents
- submit first upgrade request if applicable

Operator responsibilities:
- review posts and assets promptly
- confirm public visibility after approval
- follow up manually for billing profile and invoice handling

### Cohort 3: First Professionals / Workers

Purpose:
- validate worker-side registration, onboarding, profile presence, and moderated visibility

Entry criteria:
- professional understands launch mode and support contact
- operator can monitor auth, moderation, and support issues during the window

Scope:
- registration and login
- onboarding and profile creation
- messaging/contact if exposed by the tested flow
- visibility in approved public surfaces where applicable

Operator responsibilities:
- triage auth failures quickly
- confirm profile-facing flows do not regress after first live use

### Cohort 4: First Public Posts / Projects

Purpose:
- validate real content moderation and approved delivery on live domains

Entry criteria:
- moderation owner on duty
- public/legal/compliance copy still aligned with live launch mode

Scope:
- create post
- upload media/document
- approve or reject in admin
- confirm approved content becomes public and rejected content stays hidden

Operator responsibilities:
- review queue at least twice per day during the first 48 hours
- record unusual moderation decisions and user-facing issues

### Cohort 5: First Upgrade Requests

Purpose:
- validate the manual commercial path from pricing CTA to operator action

Entry criteria:
- pricing browser proof remains valid
- subscriptions/billing admin views are reachable
- billing owner is on duty

Scope:
- request submission
- operator review
- billing profile completion
- manual invoice or proforma issuance

Operator responsibilities:
- acknowledge request within the support SLA
- keep status clear in admin and billing records

### Cohort 6: First Billing / Invoice Actions

Purpose:
- validate invoice creation, payment state handling, webhook visibility, and auditability

Entry criteria:
- billing owner assigned
- admin billing cockpit healthy
- `/status.integrations.billingWebhook.mode = configured`

Scope:
- invoice/proforma generation
- manual payment follow-up
- mark-paid flow when applicable
- webhook failure/retry visibility when applicable

Operator responsibilities:
- confirm invoice state, payment state, and subscription state are coherent
- leave no failed billing events unresolved without owner assignment

## Support Escalation Model

### L1 Support / Operations

Owns:
- registration/login questions
- onboarding confusion
- pricing / upgrade-request clarification
- basic content moderation responses

Escalate when:
- issue blocks conversion, publish flow, or admin access
- issue affects more than one user
- issue suggests data inconsistency

### L2 Business Operations

Owns:
- upgrade request review
- billing profile checks
- invoice/proforma creation
- payment reconciliation follow-up

Escalate when:
- invoice state, payment state, and subscription state diverge
- billing webhook failures repeat
- manual workload exceeds assigned operator capacity

### L3 Technical Operations

Owns:
- Cloud Run, Cloud SQL, Secret Manager, storage, runtime regressions, and rollback

Escalate when:
- `/health` or `/status` degrade
- auth failures spike
- uploads fail
- Cloud Run or Cloud SQL errors increase materially

### L4 Security / Compliance

Owns:
- suspicious login activity
- permission failures suggesting abuse
- compliance request backlog
- security event review and disposition

## Rollback Criteria

Rollback or launch pause must be considered if any of the following occurs:

- `/health` fails or `/status.readiness.errors` becomes non-empty
- admin login or `SUPERADMIN` access fails for live operators
- moderation approval no longer results in correct public visibility
- upload/storage regressions prevent media or document flow
- billing states become non-auditable or materially inconsistent
- Cloud Run error volume or Cloud SQL incident risk exceeds operator ability to contain

## Daily Monitoring Cadence

### Start of Day

- check `/health`
- check `/status`
- check Cloud Run error logs
- check Cloud SQL health/backup posture
- check moderation queue
- check upgrade requests and billing queue
- check security/compliance alerts

### Midday

- re-check errors, queue backlog, and first-user issues
- confirm operator SLAs are being met
- confirm no blocked billing or moderation actions are waiting on ownership

### End of Day

- summarize incidents, pending queues, and next-owner handoff
- confirm no open blockers for the next monitoring window

## Success Criteria For EXEC-21

EXEC-21 can remain `PASS` when:

- rollout ownership is assigned
- first-user and first-operator paths are documented end-to-end
- monitoring cadence is active for the first 24-48 hours
- rollback criteria are explicit
- accepted commercial limitations remain visible and understood by operators
