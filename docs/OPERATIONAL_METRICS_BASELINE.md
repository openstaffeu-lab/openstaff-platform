# Operational Metrics Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-28`

## Purpose

This baseline defines the launch KPIs needed to judge whether the platform is supportable for controlled real-user onboarding.

## Core KPIs

1. onboarding success rate
2. moderation turnaround
3. upgrade turnaround
4. operator backlog
5. failed uploads
6. failed auth
7. webhook failures
8. admin intervention rate
9. support escalation frequency

## Metric Definitions

| Metric | Meaning |
|---|---|
| onboarding success rate | registrations that reach onboarding completion |
| moderation turnaround | time from submit/upload to approve/reject |
| upgrade turnaround | time from upgrade request creation to first operator action and to final disposition |
| operator backlog | pending moderation, billing, and support items without closure |
| failed uploads | count/rate of failed media or document uploads |
| failed auth | count/rate of login or token-related user-facing failures |
| webhook failures | failed or rejected billing webhook events |
| admin intervention rate | share of user journeys that require manual operator action |
| support escalation frequency | number of issues that move from L1 to billing, technical, or security owners |

## Current Baseline Use

Use these KPIs to answer:

1. are first users completing onboarding successfully
2. are moderation and billing staying within operator capacity
3. are support issues coming from product confusion or runtime instability
4. is the current controlled-rollout contract still believable at the observed scale

## Ownership

| Metric family | Owner |
|---|---|
| onboarding/auth/upload | engineering owner + Technical Ops |
| moderation | moderation owner |
| upgrade/billing | billing owner |
| escalation/support backlog | support owner + Technical Ops |

## Interpretation Notes

1. high admin intervention is expected during controlled rollout, but it must remain visible
2. moderation and billing latency matter more than raw traffic volume at this stage
3. support escalations should be treated as product-trust signals, not only support-load signals

## Final Assessment

OpenStaff now has an explicit operational metrics baseline for controlled rollout. The next maturity step is turning these KPI definitions into routine operator reporting rather than relying only on episodic proof capture.
