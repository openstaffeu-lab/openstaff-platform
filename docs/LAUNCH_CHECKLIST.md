# OpenStaff Controlled Launch Checklist

Last updated: 2026-05-17

## Launch Mode

OpenStaff is currently prepared for a **controlled public rollout** with:

- public product access live
- moderation and admin review live
- billing operations in `manual_only` mode
- Stripe webhook verification/reconciliation available for provider-backed audit events
- email delivery `not_configured`
- SMS delivery `manual_only` or `not_required`

This checklist must be used together with:

- `STATUS.md`
- `docs/DEPLOYMENT_RUNBOOK.md`
- `apps/admin/api/prisma/MIGRATION_RUNBOOK_PUBLIC_INTERACTIONS.md`

## GO / NO-GO

### GO

- `https://openstaff.eu`, `https://www.openstaff.eu`, `https://api.openstaff.eu/health`, `https://backoffice.openstaff.eu` are healthy.
- `/status` reports healthy runtime with no critical readiness errors.
- Cloud SQL backups, PITR, encrypted-only connector policy, and deletion protection are active.
- public auth, publish, moderation, and approved-content delivery remain healthy.
- pricing copy explicitly states `request upgrade`, `contact sales`, or manual approval.
- admin team accepts manual billing operations as the launch commercial mode.

### NO-GO

- public copy implies automatic payment, automatic checkout, or instant activation when billing mode is still `manual_only`
- `/status` contradicts the commercial mode shown in the UI
- manual billing operations are not staffed or documented for launch week
- moderation queue is unattended
- rollback owner is not assigned
- support owner is not assigned

## Manual Billing SOP

1. User submits an upgrade request from `/pricing`.
2. Admin reviews the request in backoffice subscriptions/billing workflows.
3. Billing profile is verified or completed.
4. Admin approves the upgrade request.
5. Invoice or proforma is issued.
6. Payment is reconciled manually or via verified webhook event when applicable.
7. Final invoice state and subscription state are checked in admin billing.
8. Any failed webhook stays visible until retried or explicitly resolved by an operator.

## Moderation SOP

1. Review pending public posts, media, documents, and external links.
2. Approve only assets that meet launch and compliance standards.
3. Confirm approved content becomes publicly visible.
4. Confirm rejected or pending content stays hidden.
5. Record unusual moderation decisions in the audit trail when needed.

## Rollback SOP

1. Identify the last healthy Cloud Run revision for API, web, or admin.
2. Shift traffic back to the last healthy revision using the commands already documented in `docs/DEPLOYMENT_RUNBOOK.md`.
3. Verify:
   - `/health`
   - `/status`
   - login
   - publish/moderation
   - admin shell
4. If the issue is data-related, stop and assess Cloud SQL restore/PITR options before making further runtime changes.

## Support SOP

1. Assign a launch owner for public issues.
2. Assign a moderation owner for content queues.
3. Assign a billing owner for upgrade requests, invoices, payment reconciliation, and webhook failures.
4. Assign a technical owner for Cloud Run, Cloud SQL, Secret Manager, and rollback.
5. Use `/status`, Cloud Run logs, and admin billing/security dashboards as the primary operational console.

## Launch Announcement Gate

Before public announcement, confirm all of the following:

- manual commercial ops are explicitly accepted as the launch mode
- pricing copy and support playbooks match that mode
- `/status` and admin readiness views do not imply unavailable automation
- billing owner, moderation owner, and rollback owner are on duty
- latest proof scripts and smoke checks are green
