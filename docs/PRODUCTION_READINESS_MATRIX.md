# Production Readiness Matrix

Last updated: `2026-05-19`  
Scope: `EXEC-32`

## Matrix

| Area | Status | Current baseline | Evidence / Notes |
|---|---|---|---|
| infrastructure | stable | Cloud Run healthy, Cloud SQL hardened, storage configured | production runtime healthy; Cloud SQL `RUNNABLE`, backups/PITR on, `ENCRYPTED_ONLY` |
| auth / security | stable | `firebase-admin`, audit/security flows operational, security posture documented | [SECURITY_POSTURE_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SECURITY_POSTURE_REVIEW.md:1) and EXEC-25 live proof |
| security posture | stable with accepted residual risks | attack surface, ingress, CORS, secret access, admin exposure, and DB exposure documented | no wildcard CORS; anonymous admin API still blocked; public `run.app` exposure accepted |
| incident response | documented and usable | severity model, ownership, escalation, rollback authority, and recovery expectations are explicit | [INCIDENT_RESPONSE_RUNBOOK.md](/C:/Users/admin/Desktop/openstaff-platform/docs/INCIDENT_RESPONSE_RUNBOOK.md:1) |
| release governance | documented and usable | deploy approvals, rollback rules, freeze rules, hotfix path, and PASS proof expectations are explicit | [RELEASE_GOVERNANCE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/RELEASE_GOVERNANCE.md:1) |
| release lifecycle governance | documented and usable | cadence, deprecation rules, rollback support window, and quality gates are explicit | [RELEASE_LIFECYCLE_POLICY.md](/C:/Users/admin/Desktop/openstaff-platform/docs/RELEASE_LIFECYCLE_POLICY.md:1) |
| runtime configuration governance | documented and usable | source-of-truth secrets, env boundaries, propagation flow, and anti-drift rules are explicit | [RUNTIME_CONFIGURATION_GOVERNANCE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/RUNTIME_CONFIGURATION_GOVERNANCE.md:1) |
| architecture governance | documented and usable | public/admin/api/data/monitoring boundaries and responsibilities are explicit | [ARCHITECTURE_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/ARCHITECTURE_BASELINE.md:1) |
| dependency governance | documented and usable | framework baselines, drift risks, upgrade policy, and emergency patch flow are explicit | [DEPENDENCY_GOVERNANCE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/DEPENDENCY_GOVERNANCE.md:1) |
| technical debt governance | documented and usable | structural debt and accepted debt are now tracked in one register | [TECHNICAL_DEBT_REGISTER.md](/C:/Users/admin/Desktop/openstaff-platform/docs/TECHNICAL_DEBT_REGISTER.md:1) |
| moderation | stable | live admin moderation still works and unauthorized access remains blocked | EXEC-25 smoke + EXEC-26 failure simulation `401` on unauthorized moderation mutation |
| billing | stable for controlled rollout | manual commercial flow remains explicit; webhook path is reachable, guarded, and throttled | webhook failure `400`; webhook burst `429`; alerts still enabled |
| storage | stable | GCS upload and approved public delivery remain healthy | EXEC-25 smoke healthy; EXEC-26 missing-asset simulation produced controlled `404` |
| data lifecycle governance | documented and conservative | billing, audit, moderation, backup, and rejected-asset handling expectations are now explicit | [DATA_LIFECYCLE_POLICY.md](/C:/Users/admin/Desktop/openstaff-platform/docs/DATA_LIFECYCLE_POLICY.md:1) |
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
| first-user experience baseline | documented and improved | company/professional onboarding, publish, moderation wait states, and public browsing trust risks are now audited | [FIRST_USER_EXPERIENCE_AUDIT.md](/C:/Users/admin/Desktop/openstaff-platform/docs/FIRST_USER_EXPERIENCE_AUDIT.md:1) |
| UX trust governance | documented and improved | pricing, moderation, onboarding, and public-detail trust language now has an explicit review baseline | [UX_TRUST_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/UX_TRUST_REVIEW.md:1) |
| support readiness | documented and usable | SOPs, support playbook, escalation, and controlled-rollout ownership remain active | [OPERATOR_SUPPORT_PLAYBOOK.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OPERATOR_SUPPORT_PLAYBOOK.md:1) |
| ownership model | documented and usable | engineering, Technical Ops, moderation, billing, security, and escalation ownership are explicit | [OWNERSHIP_MATRIX.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OWNERSHIP_MATRIX.md:1) |
| ops audit trail | active and durable | production deploy, restore, IAM, and governance entries now have a permanent home | `docs/ops-log/` plus seeded entries |
| rollout limitations | explicit | manual billing, no automated email, no SMS requirement remain unchanged | `/status.integrations` remains aligned |
| future automation gaps | partial | governance and checks are stronger, but business automation remains intentionally manual | `billingPayments = manual_only`, `emailDelivery = not_configured` |
| capacity baseline | stable for current rollout | Cloud Run limits, DB growth expectations, and uptime checks exist together | no load/stress test performed in EXEC-26 |
| controlled scale baseline | documented and usable | first-10 and first-100 user expectations, bottlenecks, and freeze triggers are explicit | [SCALE_READINESS_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SCALE_READINESS_BASELINE.md:1) |
| product analytics baseline | documented and initial | first adoption-readiness events, ownership, and privacy constraints are explicit | [PRODUCT_ANALYTICS_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/PRODUCT_ANALYTICS_BASELINE.md:1) |
| operational metrics baseline | documented and implemented at first level | onboarding, moderation, billing, backlog, escalation, and failure KPIs are now defined and exposed through rollout summaries | [OPERATIONAL_METRICS_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OPERATIONAL_METRICS_BASELINE.md:1) |
| funnel visibility baseline | documented and implemented at first level | landing, register, onboarding, publish, upgrade, auth-failure, and upload-failure visibility now exist | [FUNNEL_VISIBILITY_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/FUNNEL_VISIBILITY_BASELINE.md:1) |
| operational feedback loop | documented and implemented at first level | onboarding friction, moderation confusion, billing confusion, failed flows, escalations, and repeated confusion can now be logged | [OPERATIONAL_FEEDBACK_LOOP.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OPERATIONAL_FEEDBACK_LOOP.md:1) |
| supportability review | documented and usable | support load, moderation burden, billing burden, and escalation quality are now assessed explicitly | [SUPPORTABILITY_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/SUPPORTABILITY_REVIEW.md:1) |
| error intelligence baseline | documented and usable | retryability, severity, wording expectations, and escalation triggers now exist for rollout-critical failures | [ERROR_INTELLIGENCE_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/ERROR_INTELLIGENCE_BASELINE.md:1) |
| rollout reporting baseline | documented and usable | daily rollout, moderation, onboarding, billing, incident, and support backlog reporting expectations are now explicit | [ROLLOUT_REPORTING_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/ROLLOUT_REPORTING_BASELINE.md:1) |
| cohort review framework | documented and usable | every bounded rollout cohort now has a required review structure and explicit decision output | [COHORT_REVIEW_FRAMEWORK.md](/C:/Users/admin/Desktop/openstaff-platform/docs/COHORT_REVIEW_FRAMEWORK.md:1) |
| product iteration decision rules | documented and usable | rollout evidence now has explicit rules for copy fixes, onboarding work, pauses, freezes, expansion, and automation prioritization | [PRODUCT_ITERATION_DECISION_RULES.md](/C:/Users/admin/Desktop/openstaff-platform/docs/PRODUCT_ITERATION_DECISION_RULES.md:1) |
| feedback triage workflow | documented and usable | rollout feedback now has a lifecycle from receipt through assignment, resolution, escalation, debt conversion, and backlog conversion | [FEEDBACK_TRIAGE_WORKFLOW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/FEEDBACK_TRIAGE_WORKFLOW.md:1) |
| adoption readiness scorecard | documented and usable | onboarding, publish, moderation, billing, support, trust, stability, security, and cohort satisfaction now share one review model | [ADOPTION_READINESS_SCORECARD.md](/C:/Users/admin/Desktop/openstaff-platform/docs/ADOPTION_READINESS_SCORECARD.md:1) |
| operational sustainability review | documented and usable | operator fatigue, moderation, billing, support, release, and governance burden are now explicitly reviewed | [OPERATIONAL_SUSTAINABILITY_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OPERATIONAL_SUSTAINABILITY_REVIEW.md:1) |
| business continuity baseline | documented and usable | degraded mode, fallback operation, partial outage procedure, and emergency operator actions are now explicit | [BUSINESS_CONTINUITY_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/BUSINESS_CONTINUITY_BASELINE.md:1) |
| knowledge continuity policy | documented and usable | tribal knowledge, handover, and operator onboarding expectations are now first-class continuity controls | [KNOWLEDGE_CONTINUITY_POLICY.md](/C:/Users/admin/Desktop/openstaff-platform/docs/KNOWLEDGE_CONTINUITY_POLICY.md:1) |
| maintenance window governance | documented and usable | deploy timing, freeze periods, rollback timing, and hotfix expectations are now explicit | [MAINTENANCE_WINDOW_POLICY.md](/C:/Users/admin/Desktop/openstaff-platform/docs/MAINTENANCE_WINDOW_POLICY.md:1) |
| production drift governance | documented and usable | config, runtime, secret, IAM, and documentation drift now have formal prevention rules | [PRODUCTION_DRIFT_POLICY.md](/C:/Users/admin/Desktop/openstaff-platform/docs/PRODUCTION_DRIFT_POLICY.md:1) |
| long-term cost sustainability | documented and usable | infrastructure and human operational cost growth are now considered together | [LONG_TERM_COST_PROJECTION.md](/C:/Users/admin/Desktop/openstaff-platform/docs/LONG_TERM_COST_PROJECTION.md:1) |
| operational capacity limits | documented and usable | moderation, support, billing, overload, freeze, and automation thresholds are now explicit | [OPERATIONAL_CAPACITY_LIMITS.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OPERATIONAL_CAPACITY_LIMITS.md:1) |
| human load audit | documented and usable | repetitive operator work is now classified into low-risk, medium-risk, and manual-only automation categories | [HUMAN_LOAD_AUDIT.md](/C:/Users/admin/Desktop/openstaff-platform/docs/HUMAN_LOAD_AUDIT.md:1) |
| automation priority matrix | documented and usable | highest-value automation opportunities are now ranked by time savings, risk reduction, trust impact, and rollout impact | [AUTOMATION_PRIORITY_MATRIX.md](/C:/Users/admin/Desktop/openstaff-platform/docs/AUTOMATION_PRIORITY_MATRIX.md:1) |
| operator efficiency review | documented and usable | moderation, support, billing, context switching, and escalation friction are now explicitly reviewed | [OPERATOR_EFFICIENCY_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/OPERATOR_EFFICIENCY_REVIEW.md:1) |
| release efficiency review | documented and usable | release-proof burden, validation effort, and safe simplification opportunities are now explicit | [RELEASE_EFFICIENCY_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/RELEASE_EFFICIENCY_REVIEW.md:1) |
| noise reduction review | documented and usable | alerts, dashboards, logs, reports, and escalations now have a noise classification baseline | [NOISE_REDUCTION_REVIEW.md](/C:/Users/admin/Desktop/openstaff-platform/docs/NOISE_REDUCTION_REVIEW.md:1) |
| automation guardrails | documented and usable | what may be automated versus what must remain human-reviewed is now explicit across moderation, billing, auth, storage, incidents, and rollout | [AUTOMATION_GUARDRAILS.md](/C:/Users/admin/Desktop/openstaff-platform/docs/AUTOMATION_GUARDRAILS.md:1) |
| efficiency metrics baseline | documented and usable | human-efficiency KPIs now complement operational health KPIs | [EFFICIENCY_METRICS_BASELINE.md](/C:/Users/admin/Desktop/openstaff-platform/docs/EFFICIENCY_METRICS_BASELINE.md:1) |
| IAM least privilege | stable and more durable | runtime SA stayed constrained; build/deploy identity remains separate | EXEC-25 identity split remains active |
| deploy pipeline resilience | stable | deploy path no longer depends on broad runtime IAM | dedicated build SA remains baseline |
| engineering quality baseline | documented and enforceable | PASS now requires builds, release checks, proof, and rollback expectations rather than narrative optimism | [RELEASE_LIFECYCLE_POLICY.md](/C:/Users/admin/Desktop/openstaff-platform/docs/RELEASE_LIFECYCLE_POLICY.md:1) |
| cleanup posture | improved and intentional | contradictory topology docs were corrected; legacy folders and tracked local DB remain documented debt, not hidden state | EXEC-27 hygiene review |

## Governance Verdict

`EXEC-32 PASS`

The production baseline is now suitable for repeatable ongoing operations and controlled real-user onboarding because:

1. incident response is defined
2. release governance is defined
3. runtime configuration ownership is explicit
4. architecture, dependency, lifecycle, data, and ownership governance now exist as first-class docs
5. ops automation exists for repeated checks and safe simulations
6. an audit structure exists for deploys, restores, IAM, security, and future incidents
7. first-user trust, support, scale, analytics, operational metrics, funnel visibility, feedback loops, error intelligence, and reporting baselines are now explicit
8. cohort reviews, adoption scorecards, and product iteration decisions are now explicitly tied to rollout evidence
9. sustainability, continuity, drift prevention, long-term cost, and human-capacity limits are now explicit enough for longer-term controlled growth
10. human load, automation priorities, efficiency guardrails, and noise reduction are now explicit enough to improve operator leverage without weakening trust

## Accepted Remaining Limitations

1. `billingPayments = manual_only`
2. `publicUpgradeFlow = request_upgrade`
3. `operatorReviewRequired = true`
4. `emailDelivery = not_configured`
5. `smsDelivery = not_required`
6. critical security alerting currently uses Cloud Logging-visible proxy signals until richer native metrics are exported
7. Cloud Run ingress remains `all`, and public `run.app` URLs remain directly reachable
