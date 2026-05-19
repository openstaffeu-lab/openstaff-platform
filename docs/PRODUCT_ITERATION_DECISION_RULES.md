# Product Iteration Decision Rules

Last updated: `2026-05-19`  
Scope: `EXEC-30`

## Purpose

These rules define when rollout data should cause product, support, or operational change.

## Fix UX Copy

Prioritize copy fixes when:

1. the same support or feedback confusion appears at least `3` times in one cohort
2. users misread moderation, billing, or upgrade state
3. a truthful manual flow is being interpreted as automation
4. trust language creates avoidable support burden

## Improve Onboarding

Prioritize onboarding improvements when:

1. `registerStartToCompletePct < 60%`
2. `registerCompleteToOnboardingPct < 70%`
3. onboarding friction is the top feedback category in a cohort review
4. operators repeatedly rescue the same onboarding step manually

## Pause Rollout

Pause rollout when:

1. `/health` or `/status` degrade
2. auth failures spike materially
3. moderation or upgrade queue ownership is lost
4. support backlog grows faster than operators can clear it
5. the product is causing misleading user expectations

## Increase Cohort Size

Increase cohort size only when:

1. the current cohort review ends in `expand`
2. moderation and upgrade aging remain within the agreed window
3. support burden is understandable and staffed
4. the current funnel does not show a major drop-off that still needs interpretation
5. no unresolved trust or copy contradiction remains open

## Freeze Releases

Freeze non-essential releases when:

1. there is unresolved adoption-critical confusion
2. backlog aging already threatens operator capacity
3. production stability signals are noisy
4. a cohort review ends in `fix-first` or `rollback`

## Prioritize Automation

Move an area toward automation when:

1. the same operator action repeats frequently and predictably
2. manual handling creates queue aging risk
3. product truth no longer depends on human explanation
4. the automated step can be introduced without hiding real review requirements

## Escalate Billing / Payment Automation

Escalate billing automation planning when:

1. upgrade turnaround becomes a cohort-expansion blocker
2. billing confusion becomes a repeated theme
3. manual invoice follow-up dominates support burden
4. operator review remains necessary, but payment collection itself is the bottleneck

## Final Assessment

OpenStaff now has explicit decision rules for turning rollout evidence into product and operational prioritization. This keeps automation and expansion tied to measured pain instead of abstract roadmap pressure.
