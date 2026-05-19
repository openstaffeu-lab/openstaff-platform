# Assisted Triage Recommendations

Last updated: `2026-05-19`  
Scope: `EXEC-35`

## Purpose

This baseline defines the safe recommendation categories that the system may present during triage.

## Allowed Recommendation Categories

The system may suggest:

1. likely affected surface
2. likely affected service
3. likely affected workflow
4. likely escalation owner
5. likely next checks
6. likely rollback candidate
7. likely user impact

## Recommendation Examples

Examples of safe assistance:

1. `likely affected surface: admin production readiness and login`
2. `likely affected service: billing webhook path`
3. `likely affected workflow: upgrade request acknowledgement`
4. `likely escalation owner: Technical Ops with billing owner visibility`
5. `likely next checks: review /status, webhook queue, and failed event count`
6. `likely rollback candidate: latest billing-related release window`
7. `likely user impact: delayed acknowledgement rather than entitlement loss`

## Explicit Prohibitions

The assistance layer must not:

1. make autonomous operational decisions
2. assign severity automatically
3. execute recovery actions automatically
4. execute rollback automatically
5. trigger escalation automatically
6. mark a recommendation as already approved

## Presentation Rules

Recommendations must use non-authoritative wording such as:

1. `likely`
2. `suggested`
3. `candidate`
4. `may require review`

They must not use authoritative wording such as:

1. `must`
2. `approved`
3. `executed`
4. `confirmed` without operator confirmation

## Final Assessment

Assisted triage recommendations are useful only if they remain clearly advisory. EXEC-35 sets that line explicitly so faster operator orientation never turns into hidden authority transfer.
