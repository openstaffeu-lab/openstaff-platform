# Product Analytics Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-28`

## Purpose

This baseline defines the initial analytics model needed to understand adoption readiness without violating the current privacy and operational contract.

## Event Baseline

Track at minimum:

1. registrations
2. onboarding completion
3. publish attempts
4. moderation outcomes
5. upgrade requests
6. auth failures
7. upload failures
8. admin interventions

## Ownership

| Area | Owner |
|---|---|
| event definition | engineering owner |
| implementation correctness | engineering owner |
| operational interpretation | Technical Ops + support owner |
| moderation outcome interpretation | moderation owner |
| billing/upgrade interpretation | billing owner |

## Privacy Constraints

1. analytics must not expose secrets, tokens, or private auth data
2. public-facing reporting should prefer aggregate counts, not raw sensitive payloads
3. support and moderation review should use operational identifiers already allowed by the existing platform contract
4. analytics must not become a shadow source of truth for billing, identity, or compliance records

## Retention Expectations

1. retain analytics in line with conservative operational and audit expectations
2. do not treat product analytics as more authoritative than Cloud SQL business records or Cloud Logging operational evidence
3. revisit retention when dedicated privacy/compliance policy becomes stricter

## Initial Event Definitions

| Event | Meaning |
|---|---|
| `registration_created` | a new account registration completed successfully |
| `onboarding_completed` | onboarding reached the completion state |
| `publish_attempted` | a public post create/update submission was attempted |
| `moderation_approved` | a moderated entity was approved |
| `moderation_rejected` | a moderated entity was rejected |
| `upgrade_request_created` | a pricing/upgrade request was submitted |
| `auth_failed` | login or auth flow failed in a user-visible way |
| `upload_failed` | media/document upload failed |
| `admin_intervention_required` | operator action was required to unblock or clarify a user-facing flow |

## Observability Gaps

Current gaps:

1. no dedicated first-class product analytics pipeline is documented as live today
2. current truth relies on application state, Cloud Logging, uptime checks, and operator proof
3. admin intervention rate still requires some manual interpretation
4. richer funnel reporting remains future work

## Final Assessment

The platform now has a documented analytics baseline for adoption-readiness thinking, but analytics maturity still trails operational maturity. This is acceptable for controlled rollout as long as event ownership and privacy discipline remain explicit.
