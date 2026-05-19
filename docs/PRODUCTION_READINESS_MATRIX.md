# Production Readiness Matrix

Last updated: `2026-05-19`  
Scope: `EXEC-26`

## Matrix

| Area | Status | Current baseline | Evidence / Notes |
|---|---|---|---|
| infrastructure | stable | Cloud Run healthy, Cloud SQL hardened, storage configured | production runtime healthy; Cloud SQL `RUNNABLE`, backups/PITR on, `ENCRYPTED_ONLY` |
| auth / security | stable | `firebase-admin`, audit/security flows operational, security posture documented | [SECURITY_POSTURE_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SECURITY_POSTURE_REVIEW.md:1) and EXEC-25 live proof |
| security posture | stable with accepted residual risks | attack surface, ingress, CORS, secret access, admin exposure, and DB exposure documented | no wildcard CORS; anonymous admin API still blocked; public `run.app` exposure accepted |
| incident response | documented and usable | severity model, ownership, escalation, rollback authority, and recovery expectations are explicit | [INCIDENT_RESPONSE_RUNBOOK.md](/C:/Users/admin/Desktop/openstaff-platform/docs/INCIDENT_RESPONSE_RUNBOOK.md:1) |
| release governance | documented and usable | deploy approvals, rollback rules, freeze rules, hotfix path, and PASS proof expectations are explicit | [RELEASE_GOVERNANCE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/RELEASE_GOVERNANCE.md:1) |
| runtime configuration governance | documented and usable | source-of-truth secrets, env boundaries, propagation flow, and anti-drift rules are explicit | [RUNTIME_CONFIGURATION_GOVERNANCE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/RUNTIME_CONFIGURATION_GOVERNANCE.md:1) |
| moderation | stable | live admin moderation still works and unauthorized access remains blocked | EXEC-25 smoke + EXEC-26 failure simulation `401` on unauthorized moderation mutation |
| billing | stable for controlled rollout | manual commercial flow remains explicit; webhook path is reachable, guarded, and throttled | webhook failure `400`; webhook burst `429`; alerts still enabled |
| storage | stable | GCS upload and approved public delivery remain healthy | EXEC-25 smoke healthy; EXEC-26 missing-asset simulation produced controlled `404` |
| monitoring | stable | shared Monitoring dashboards remain live | `OpenStaff Prod - Overview`, `OpenStaff Prod - Operational Signals` |
| alerting | stable | notification channel + live alert policies remain enabled | `10` policies enabled |
| synthetic monitoring | stable | key user and operator journeys have uptime probes | `7` live probes for homepage, login, API health/status, asset delivery, webhook guard, admin readiness |
| operational automation | stable for current baseline | scripted production ops-check and safe failure simulation are now available | `scripts/release/exec-26-production-ops-check.ps1`, `scripts/release/exec-26-failure-simulations.ps1` |
| backups | stable | backups + PITR enabled and retained | latest visible automated backup `1779159600000` succeeded |
| restore drill | stable | rehearsal executed on isolated recovery instance | restore duration `4m 59.686s`, SQL validation passed, cleanup completed |
| secret rotation | documented and usable | rotation flow, rollback, and downtime expectations are explicit | [SECRET_ROTATION_RUNBOOK.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SECRET_ROTATION_RUNBOOK.md:1) |
| disaster readiness | documented and usable | recovery ordering, regional assumptions, and rollback criteria are explicit | [DISASTER_RECOVERY_PLAN.md](/C:/Users/admin/Desktop/openstaff-platform/docs/DISASTER_RECOVERY_PLAN.md:1) |
| cost visibility | documented and usable | cost drivers, growth expectations, and anomaly triggers are explicit | [COST_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/COST_BASELINE.md:1) |
| SLO baseline | documented and initial | first governance-grade service targets now exist | [SLO_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SLO_BASELINE.md:1) |
| operator tooling | stable | admin moderation, billing, security, readiness pages usable | EXEC-25 smoke and EXEC-26 ops-check baseline |
| support readiness | documented and usable | SOPs, escalation, and controlled-rollout ownership remain active | EXEC-21 docs remain active |
| ops audit trail | active and durable | production deploy, restore, IAM, and governance entries now have a permanent home | `docs/ops-log/` plus seeded entries |
| rollout limitations | explicit | manual billing, no automated email, no SMS requirement remain unchanged | `/status.integrations` remains aligned |
| future automation gaps | partial | governance and checks are stronger, but business automation remains intentionally manual | `billingPayments = manual_only`, `emailDelivery = not_configured` |
| capacity baseline | stable for current rollout | Cloud Run limits, DB growth expectations, and uptime checks exist together | no load/stress test performed in EXEC-26 |
| IAM least privilege | stable and more durable | runtime SA stayed constrained; build/deploy identity remains separate | EXEC-25 identity split remains active |
| deploy pipeline resilience | stable | deploy path no longer depends on broad runtime IAM | dedicated build SA remains baseline |
| cleanup posture | improved | bootstrap artifacts removed; rollback assets retained intentionally | temp jobs removed; revisions kept for rollback safety |

## Governance Verdict

`EXEC-26 PASS`

The production baseline is now suitable for repeatable ongoing operations because:

1. incident response is defined
2. release governance is defined
3. runtime configuration ownership is explicit
4. ops automation exists for repeated checks and safe simulations
5. an audit structure exists for deploys, restores, IAM, security, and future incidents
6. initial SLO targets make current maturity visible

## Accepted Remaining Limitations

1. `billingPayments = manual_only`
2. `publicUpgradeFlow = request_upgrade`
3. `operatorReviewRequired = true`
4. `emailDelivery = not_configured`
5. `smsDelivery = not_required`
6. critical security alerting currently uses Cloud Logging-visible proxy signals until richer native metrics are exported
7. Cloud Run ingress remains `all`, and public `run.app` URLs remain directly reachable
