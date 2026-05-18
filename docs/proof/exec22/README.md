# EXEC-22 First Production Cohort Evidence

Date: `2026-05-18`
Run ID: `exec22-1779102803899`
Window: `2026-05-18T11:13:23.899Z` -> `2026-05-18T11:13:30.855Z`
Launch mode: `controlled rollout`

## Purpose

EXEC-22 captures the first controlled production cohort execution after EXEC-21 documentation closure. The goal of this run was to prove that the live production stack can support the first bounded cohort across public onboarding, moderated publishing, manual commercial flow, and operator-side monitoring without contradicting the accepted launch contract.

## Accounts And Roles Used

Passwords are intentionally omitted from this proof trail.

| Cohort actor | Role | Identifier |
|---|---|---|
| internal operator | `SUPERADMIN` | `openstaff.eu@gmail.com` |
| client / company account | `COMPANY` | `exec22-1779102803899-company@openstaff.eu` |
| professional / worker account | `PROFESSIONAL` | `exec22-1779102803899-worker@openstaff.eu` |

## Production Safety Notes

- This run used a tightly bounded test cohort in live production.
- No passwords, bearer tokens, or secret values are stored in this document.
- Billing remained in `manual_only` mode throughout the run.
- Public upgrade flow remained `request_upgrade` with `operatorReviewRequired = true`.
- `emailDelivery = not_configured` and `smsDelivery = not_required` remained explicit during validation.
- No evidence in this run suggested an accidental automatic checkout or instant plan activation promise.

## Pre-Flight Summary

| Check | Expected | Actual |
|---|---|---|
| `https://openstaff.eu` | public site reachable | reachable, `HTTP 200` |
| `https://backoffice.openstaff.eu` | admin shell reachable | reachable, `HTTP 200` |
| `GET https://api.openstaff.eu/health` | `status = ok` | `200`, `status = ok`, `environment = production` |
| `GET https://api.openstaff.eu/status` | readiness healthy | `200`, `status = ok`, `db = healthy`, `warnings = []`, `errors = []` |
| live auth mode | `firebase-admin` | `/status.runtime.authMode = firebase-admin` |
| commercial contract | controlled rollout values visible | `manual_only`, `request_upgrade`, `operatorReviewRequired = true` |
| `SUPERADMIN` login | working | `POST /auth/login = 200`, role `SUPERADMIN` |
| admin moderation pages | reachable | posts `200`, media `200`, documents `200` |
| admin billing page/API | reachable | billing invoices `200` |

Additional infrastructure checks captured during the same EXEC-22 window:

- Cloud Run active revisions stayed aligned on `2026-05-18`:
  - `openstaff-api-00008-nql`
  - `openstaff-web-00010-pgt`
  - `openstaff-admin-00011-dqr`
- Cloud SQL `openstaff-db` remained `RUNNABLE` with:
  - `deletionProtectionEnabled = true`
  - `backupConfiguration.enabled = true`
  - `pointInTimeRecoveryEnabled = true`
  - `sslMode = ENCRYPTED_ONLY`
- Cloud Run error scan during EXEC-22 found:
  - no fresh API errors in the reviewed window
  - only historical pre-fix web/admin startup errors from earlier revisions, not from the active rollout pass

## Cohort Setup

| Item | Result |
|---|---|
| internal operator | existing `SUPERADMIN` reused successfully |
| client / company account | created live |
| professional / worker account | created live |
| test public post | created live: `a3f29f0e-49e4-4a0e-a955-5d84ce24606a` |
| media upload | created live: `fe41754e-3947-4470-bd7c-8e7ac8a2c3ed` |
| document upload | created live: `4c58ab28-e6e9-4661-80ae-200bab10a841` |
| upgrade request | created live: `a4c8a109-8544-4f1a-82d8-b50df614c1b4` |

## Public User Flow

| Route / flow | Expected | Actual |
|---|---|---|
| `POST /auth/register` company | live registration works | `201` |
| `POST /auth/register` worker | live registration works | `201` |
| `POST /auth/login` company | login works | `200` |
| `POST /auth/login` worker | login works | `200` |
| `GET /onboarding/me` company | onboarding starts | `200` |
| `GET /onboarding/me` worker | onboarding starts | `200` |
| `PUT /onboarding/identity-profile` company | identity data saved | `200` |
| `PUT /onboarding/company-profile` company | company data saved | `200` |
| `PUT /onboarding/identity-profile` worker | worker profile data saved | `200` |
| `POST /public-posts` | publish request created in pending moderation | `201`, post `PENDING_MODERATION` |
| `POST /public-posts/:id/media` | media upload accepted | `201` |
| `POST /public-posts/:id/documents` | document upload accepted | `201` |
| `GET /public-posts` before approval | pending post hidden publicly | `200`, pending post absent |
| `GET /public-posts/:id` before approval | pending detail blocked publicly | `403` |
| `GET /public-posts/me` | owner sees own pending post | `200`, pending visible to owner |

## Admin Operator Flow

| Route / flow | Expected | Actual |
|---|---|---|
| `POST /auth/login` as `SUPERADMIN` | operator login works | `200` |
| `GET /admin/public-posts` | moderation queue reachable | `200` |
| `GET /admin/public-post-media` | media queue reachable | `200` |
| `GET /admin/public-post-documents` | documents queue reachable | `200` |
| `PATCH /admin/public-post-media/:id/status` | media approve works | `200` |
| `PATCH /admin/public-post-documents/:id/status` | document reject works | `200` |
| `PATCH /admin/public-posts/:id/status` | post approve works | `200` |
| `GET /public-posts/:id` after approval | post becomes public | `200` |
| public approved media | approved asset visible | `GET /public-posts/media/:id = 200` |
| public rejected document | rejected asset stays hidden | `GET /public-posts/documents/:id = 403` |
| public detail asset counts | only approved assets exposed | `media = 1`, `documents = 0` |
| `GET /admin/security/events` | security queue reachable | `200` |
| `GET /admin/security/audit-logs` | audit trail reachable | `200`, list count observed `45` |

## Commercial Flow

| Route / flow | Expected | Actual |
|---|---|---|
| pricing contract from live `/status` | no auto-checkout promise | `launchMode = manual_only`, `publicUpgradeFlow = request_upgrade` |
| `GET /billing/profile/me` | billing profile route reachable | `200` |
| `POST /subscriptions/upgrade-requests` | upgrade request created | `201` |
| `GET /admin/subscription-upgrade-requests` | admin sees queue | `200`, request visible |
| `POST /admin/subscription-upgrade-requests/:id/approve` | operator approval works | `201`, plan `BRONZE` |
| billing invoice visibility | invoice state explicit | invoice `846f3b75-a1b7-4bbd-99d8-b69ba4199817`, `ISSUED`, `PROFORMA` |
| `GET /admin/billing/invoices` | billing admin list reachable | `200` |
| `GET /admin/billing/events` | billing events visible | `200` |
| `GET /admin/billing/payments` | payment state visible | `200` |
| payment automation promise | must stay manual | no accidental automatic checkout observed |

## Monitoring Pass

One live monitoring pass was captured during EXEC-22.

| Signal | Expected | Actual |
|---|---|---|
| `/health` | healthy | `200`, payload `status = ok` |
| `/status` | healthy | `200`, `db = healthy`, `warnings = []`, `errors = []` |
| Cloud Run errors | no fresh blocker on active revisions | no fresh API error observed; only historical older web/admin startup errors outside active proof flow |
| Cloud SQL health | healthy and protected | `RUNNABLE`, backups/PITR on, `ENCRYPTED_ONLY` |
| GCS asset delivery | approved asset served | approved media asset `200` |
| rejected asset protection | rejected asset hidden | rejected document `403` |
| security events | admin visibility intact | `GET /admin/security/events = 200` |
| audit logs | admin visibility intact | `GET /admin/security/audit-logs = 200` |
| billing events | visible | `GET /admin/billing/events = 200` |
| notification events | visible | `GET /admin/notifications/events = 200` |

Live `/status` values observed in the same monitoring window:

- `queues.notifications.pending = 0`
- `queues.notifications.failed = 0`
- `queues.relu.pending = 32`
- `queues.relu.failed = 0`
- `security.openEvents = 435`
- `security.criticalEvents = 0`
- `security.activeSessions = 16`

## Tested Routes

- `GET /health`
- `GET /status`
- `POST /auth/register`
- `POST /auth/login`
- `GET /onboarding/me`
- `PUT /onboarding/identity-profile`
- `PUT /onboarding/company-profile`
- `POST /public-posts`
- `GET /public-posts`
- `GET /public-posts/me`
- `GET /public-posts/:id`
- `POST /public-posts/:id/media`
- `POST /public-posts/:id/documents`
- `GET /admin/public-posts`
- `GET /admin/public-post-media`
- `GET /admin/public-post-documents`
- `PATCH /admin/public-post-media/:id/status`
- `PATCH /admin/public-post-documents/:id/status`
- `PATCH /admin/public-posts/:id/status`
- `GET /admin/security/events`
- `GET /admin/security/audit-logs`
- `GET /billing/profile/me`
- `POST /subscriptions/upgrade-requests`
- `GET /admin/subscription-upgrade-requests`
- `POST /admin/subscription-upgrade-requests/:id/approve`
- `GET /admin/billing/invoices`
- `GET /admin/billing/events`
- `GET /admin/billing/payments`
- `GET /admin/notifications/events`
- `GET /admin/notifications/deliveries`

## Screenshots / Video References

- No screenshots were captured in this execution.
- No browser video recording was captured in this execution.
- This proof is API- and operator-evidence based, with live production timestamps and object IDs preserved above.

## Issues Found

- No blocker was found for the first controlled production cohort.
- The run confirmed the already accepted launch limitations remain in force:
  - `billingPayments = manual_only`
  - `publicUpgradeFlow = request_upgrade`
  - `operatorReviewRequired = true`
  - `emailDelivery = not_configured`
  - `smsDelivery = not_required`

## Outcome

EXEC-22 result: `PASS`

The first controlled production cohort executed successfully end-to-end across:

1. public account creation and onboarding start
2. moderated public posting with live media/document handling
3. operator moderation and public visibility controls
4. manual commercial upgrade approval and invoice visibility
5. production monitoring and audit/security visibility
