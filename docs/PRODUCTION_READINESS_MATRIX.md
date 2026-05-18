# Production Readiness Matrix

Last updated: `2026-05-18`  
Scope: `EXEC-25`

## Matrix

| Area | Status | Current baseline | Evidence / Notes |
|---|---|---|---|
| infrastructure | stable | Cloud Run healthy, Cloud SQL hardened, storage configured | active production runtime healthy; Cloud SQL `RUNNABLE`, backups/PITR on, `ENCRYPTED_ONLY` |
| auth / security | stable | `firebase-admin`, audit/security flows operational, security posture documented | temp `SUPERADMIN` login `200`; [SECURITY_POSTURE_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SECURITY_POSTURE_REVIEW.md:1) added |
| security posture | stable with accepted residual risks | attack surface, ingress, CORS, admin exposure, secret access, and DB exposure are now documented | no wildcard CORS; anonymous admin API access still blocked; public `run.app` exposure explicitly accepted |
| moderation | stable | live admin moderation still works after EXEC-25 deploy | EXEC-25 smoke: post create `201`, approve media/document/post `200` |
| billing | stable for controlled rollout | manual commercial flow remains explicit; webhook path is reachable, guarded, and throttled | webhook burst `429`; post-window unsigned webhook `400 BAD_REQUEST` |
| storage | stable | GCS upload and approved public delivery remain healthy | EXEC-25 smoke: media/document upload `201`, public delivery `200` |
| monitoring | stable | shared Monitoring dashboards remain live | `OpenStaff Prod - Overview`, `OpenStaff Prod - Operational Signals` |
| alerting | stable | notification channel + live alert policies remain enabled | EXEC-24 `10` policies still enabled after EXEC-25 |
| synthetic monitoring | stable | key user and operator journeys now have uptime probes | `7` live probes for homepage, login, API health/status, asset delivery, webhook guard, admin readiness |
| backups | stable | backups + PITR enabled and retained | Cloud SQL posture unchanged and healthy |
| restore drill | stable | rehearsal executed on isolated recovery instance | restore duration `4m 59.686s`, SQL validation passed, cleanup completed |
| secret rotation | documented and usable | rotation flow, rollback, and downtime expectations are now explicit | [SECRET_ROTATION_RUNBOOK.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SECRET_ROTATION_RUNBOOK.md:1) added |
| disaster readiness | documented and usable | recovery ordering, regional assumptions, and rollback criteria are explicit | [DISASTER_RECOVERY_PLAN.md](/C:/Users/admin/Desktop/openstaff-platform/docs/DISASTER_RECOVERY_PLAN.md:1) added |
| cost visibility | documented and usable | cost drivers, growth expectations, and anomaly triggers are explicit | [COST_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/COST_BASELINE.md:1) added |
| operator tooling | stable | admin moderation, billing, security, readiness pages usable | EXEC-25 smoke: `/admin/public-posts = 200` with temp `SUPERADMIN` |
| support readiness | documented and usable | SOPs and rollout ownership remain active | EXEC-21 docs remain active |
| rollout limitations | explicit | manual billing, no automated email, no SMS requirement remain unchanged | `/status.integrations` remains aligned |
| future automation gaps | partial | core resilience is improved, but business automation remains intentionally manual | `billingPayments = manual_only`, `emailDelivery = not_configured` |
| capacity baseline | stable for current rollout | Cloud Run limits, DB growth expectations, and synthetic checks now exist together | no load/stress test performed in EXEC-25 |
| IAM least privilege | stable and more durable | runtime SA stayed constrained; build/deploy identity is now separate | dedicated build SA added; runtime SA kept narrow |
| deploy pipeline resilience | stable | deploy path no longer depends on broad runtime IAM | successful build `b7e78555-6a7d-4cca-8037-7999fdd7fe92` on dedicated build SA |
| cleanup posture | improved | temporary bootstrap artifacts removed; stale rollback assets retained intentionally | temp promotion job deleted; rollback-safe revisions retained |

## Resilience Verdict

`EXEC-25 PASS`

The production baseline is now suitable for controlled real-user growth because:

1. security posture has been documented against the live production shape
2. exposed abuse paths now have stronger app-layer throttling
3. synthetic monitoring exists for critical user and operator paths
4. deploy-path resilience no longer depends on broad runtime IAM
5. secret rotation, disaster recovery, and cost visibility runbooks now exist alongside the stabilized EXEC-24 baseline

## Accepted Remaining Limitations

1. `billingPayments = manual_only`
2. `publicUpgradeFlow = request_upgrade`
3. `operatorReviewRequired = true`
4. `emailDelivery = not_configured`
5. `smsDelivery = not_required`
6. critical security alerting currently uses Cloud Logging-visible proxy signals until richer native metrics are exported
7. Cloud Run ingress remains `all`, and public `run.app` URLs remain directly reachable
