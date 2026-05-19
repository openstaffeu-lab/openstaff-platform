# Adoption Readiness Scorecard

Last updated: `2026-05-19`  
Scope: `EXEC-30`

## Purpose

This scorecard gives operators one shared way to judge whether controlled rollout is ready to expand.

## Scorecard Categories

1. onboarding success
2. publish success
3. moderation turnaround
4. billing turnaround
5. support load
6. operational stability
7. trust / copy clarity
8. security / noise level
9. cohort satisfaction

## Rating Model

Use one rating per category:

1. `green`
2. `yellow`
3. `red`

## Category Guidance

| Category | Green | Yellow | Red |
|---|---|---|---|
| onboarding success | users complete registration and onboarding without repeated rescue | visible drop-off or repeated support prompts | conversion collapses or onboarding blocks users materially |
| publish success | publish flow completes and submissions are understandable | users need repeated clarification | users abandon or fail the publish flow repeatedly |
| moderation turnaround | queue remains within expected aging window | aging is rising but still contained | queue breaks SLA or causes trust drift |
| billing turnaround | upgrade requests are acknowledged and understandable | manual burden is rising | commercial flow blocks cohort progress |
| support load | support questions are manageable and thematic | same questions repeat heavily | support is overloaded or cannot keep pace |
| operational stability | health, status, uploads, auth, and webhooks remain stable | minor spikes are visible | runtime instability threatens rollout truth |
| trust / copy clarity | wording matches reality | some explanations need tightening | public copy misleads or hides manual reality |
| security / noise level | auth and abuse noise remain controlled | bursts need closer watching | security/noise distracts from normal operations materially |
| cohort satisfaction | users understand what happened and what happens next | partial confusion remains | user trust is visibly degraded |

## Expansion Rule

The cohort should not expand unless:

1. no category is `red`
2. `support load`, `operational stability`, and `trust / copy clarity` are not worse than `yellow`
3. any `yellow` item has a named owner and deadline

## Final Assessment

OpenStaff now has an adoption-readiness scorecard that can sit alongside funnel and backlog data. This keeps expansion decisions tied to operational truth, not only traffic counts.
