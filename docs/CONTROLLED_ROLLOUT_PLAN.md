# OpenStaff Controlled Rollout Plan

Last updated: 2026-05-20

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
- `docs/COHORT_REVIEW_FRAMEWORK.md`
- `docs/ADOPTION_READINESS_SCORECARD.md`
- `docs/templates/COHORT_DECISION_REPORT.md`
- `docs/BUSINESS_CONTINUITY_BASELINE.md`
- `docs/OPERATIONAL_CAPACITY_LIMITS.md`
- `docs/KNOWLEDGE_CONTINUITY_POLICY.md`
- `docs/AUTOMATION_GUARDRAILS.md`
- `docs/EFFICIENCY_METRICS_BASELINE.md`
- `docs/MULTI_OPERATOR_READINESS.md`
- `docs/OPERATIONAL_LATENCY_BASELINE.md`
- `docs/UNIFIED_OPERATOR_COCKPIT_BASELINE.md`
- `docs/CONTEXT_AGGREGATION_BASELINE.md`
- `docs/INCIDENT_TIMELINE_BASELINE.md`
- `docs/QUEUE_COORDINATION_BASELINE.md`
- `docs/OPERATIONAL_PRIORITY_MATRIX.md`
- `docs/ALERT_ROUTING_REVIEW.md`
- `docs/OPERATOR_SESSION_CONTINUITY.md`
- `docs/ASSISTED_INCIDENT_SUMMARY_BASELINE.md`
- `docs/QUEUE_PRESSURE_ASSISTANCE.md`
- `docs/OPERATIONAL_PATTERN_DETECTION.md`
- `docs/ASSISTED_TRIAGE_RECOMMENDATIONS.md`
- `docs/OPERATOR_DIGEST_BASELINE.md`
- `docs/OPERATIONAL_CORRELATION_REVIEW.md`
- `docs/ADMIN_ASSISTANCE_UX_REVIEW.md`
- `docs/ASSISTANCE_SURFACE_SAFETY_REVIEW.md`
- `docs/ASSISTANCE_RUNTIME_REVIEW.md`
- `docs/ASSISTANCE_NOISE_VALIDATION.md`
- `docs/ASSISTANCE_USABILITY_REVIEW.md`
- `docs/UNIFIED_OPERATIONAL_STATE_MODEL.md`
- `docs/OPERATIONAL_COMPRESSION_REVIEW.md`
- `docs/UNIFIED_INTELLIGENCE_SURFACE.md`
- `docs/ATTENTION_ROUTING_BASELINE.md`
- `docs/OPERATIONAL_COMPRESSION_METRICS.md`
- `docs/OPERATIONAL_ACTIONABILITY_REVIEW.md`
- `docs/ASSISTED_RESPONSE_PREPARATION.md`
- `docs/QUEUE_ACCELERATION_BASELINE.md`
- `docs/ESCALATION_COMPRESSION_MODEL.md`
- `docs/OPERATIONAL_RESPONSE_SIGNALS.md`
- `docs/OPERATIONAL_RESPONSE_TIMING.md`
- `docs/SHARED_OPERATIONAL_MEMORY_MODEL.md`
- `docs/DECISION_SUPPORT_REVIEW.md`
- `docs/ESCALATION_CONTINUITY_BASELINE.md`
- `docs/OPERATIONAL_MEMORY_COMPRESSION.md`
- `docs/DECISION_SUPPORT_SIGNALS.md`
- `docs/DECISION_TRACEABILITY_MODEL.md`
- `docs/COORDINATION_GOVERNANCE_BASELINE.md`
- `docs/CONSENSUS_VISIBILITY_REVIEW.md`
- `docs/OPERATIONAL_ACCOUNTABILITY_BASELINE.md`
- `docs/CONFLICT_RESOLUTION_BASELINE.md`
- `docs/USER_ONBOARDING_CLOSURE.md`
- `docs/COMPANY_AUTOFILL_BASELINE.md`
- `docs/RELU_PROFILE_GENERATION_BASELINE.md`
- `docs/TAXONOMY_SUGGESTION_BASELINE.md`
- `docs/PASSWORD_RECOVERY_SECURITY.md`

## Expansion Bands

Rollout expansion now follows these review bands:

1. first 10 users
2. first 25 users
3. first 50 users
4. first 100 users

No band may expand to the next one without:

1. a completed cohort review
2. a scorecard with no `red` category
3. an explicit decision report ending in `expand`

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
- review the shared cockpit or equivalent consolidated context before acting in specialist tools
- use assistance summaries as orientation support, not as authority-bearing outcomes
- review live assistance cards together with their source metrics before escalating, pausing rollout, or changing queue priorities
- confirm that assistance timestamps still match the current operational moment before treating a summary as active context
- use the compressed operator orientation layer as the first review surface before opening deeper queue, digest, or correlation sections
- use the response-acceleration layer to prepare the next queue, escalation, or rollout review before opening specialist tools
- use the shared operational memory layer to recover recent decisions, unresolved carryover, and handoff context before rebuilding the same reasoning from scratch
- use the coordination-governance and decision-traceability layer to confirm who owns the current review, what rationale is visible, and whether disagreement or blocked consensus remains unresolved
- treat grouped operational state as orientation support only and resolve conflicts against source metrics and specialist queue surfaces
- treat grouped next-action summaries as preparation support only and confirm them against live owner context before acting
- treat shared operational memory and decision-support summaries as continuity support only and confirm them against fresh source evidence before making a human decision
- treat accountability, rationale, and unresolved-consensus summaries as coordination support only and confirm them against active human ownership before acting
- clear moderation and upgrade queues within the agreed SLA
- escalate runtime, billing, or security anomalies immediately
- leave handoff-ready notes another operator can act on safely

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
- use the forgot-password flow and neutral support wording when helping users recover access; never confirm account existence through manual copy alone
- treat autofilled company data as suggested context until the user confirms it and an operator reviews any public visibility consequence
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
- use progressive onboarding support rather than asking users to complete every field in one pass
- treat RELU AI and taxonomy suggestions as draft enrichment only, not as approved public truth
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

## Cohort Review Discipline

At the end of each cohort window:

1. review funnel outcomes
2. review moderation, upgrade, and support burden
3. review incidents and friction themes
4. complete `docs/templates/COHORT_DECISION_REPORT.md`
5. choose `expand`, `hold`, `fix-first`, or `rollback`
6. note whether repeated human effort should trigger automation prioritization
7. note whether operator coordination or handoff latency created avoidable delay
8. note whether command-surface, queue-coordination, or alert-routing gaps slowed action materially
9. note whether the live assistance surfaces reduced synthesis time or created noise, duplication, or stale-summary confusion
10. note whether browser-visible wording, timestamps, and source reasoning remained trustworthy during the cohort window
11. note whether the compressed orientation layer reduced context switching or hid any nuance that still mattered for safe human judgment
12. note whether the response-acceleration layer reduced time-to-next-action or merely added more visible advice without reducing prep work
13. note whether the shared operational memory layer reduced decision reconstruction, escalation rediscovery, and handoff-context loss without creating stale-memory confusion

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

## Continuity Expectations

During controlled rollout:

1. degraded mode must be declared explicitly when service quality drops but full outage is not present
2. operator handoff must remain sufficient for another trained owner to continue safely
3. expansion must stop before continuity depends on one exhausted operator
4. automation must reduce repeated clerical work before it attempts to reduce required human judgment
5. active cohorts must not depend on one operator holding private operational context

## Success Criteria For EXEC-21

EXEC-21 can remain `PASS` when:

- rollout ownership is assigned
- first-user and first-operator paths are documented end-to-end
- monitoring cadence is active for the first 24-48 hours
- rollback criteria are explicit
- accepted commercial limitations remain visible and understood by operators

EXEC-30 extends this by requiring expansion decisions to be cohort-reviewed, scorecard-backed, and documented rather than implied.
