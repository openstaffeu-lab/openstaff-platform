# Operator Digest Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-35`

## Purpose

This baseline defines recurring operator digests that summarize operational pressure, unresolved issues, and action priorities without changing authority or queue state automatically.

## Digest Types

The recurring digest types are:

1. daily operational digest
2. moderation digest
3. billing digest
4. rollout digest
5. incident digest
6. escalation digest

## Common Digest Structure

Every digest should include:

1. summary headline
2. current operational mode
3. top escalation highlights
4. unresolved issues
5. queue aging signals
6. rollout warnings if relevant
7. action priorities

## Daily Operational Digest

Should summarize:

1. runtime posture
2. cross-queue pressure
3. top alerts and incidents
4. carryover from prior session
5. highest-priority work for the day

## Moderation Digest

Should summarize:

1. total backlog
2. oldest unresolved items
3. unusual or disputed items
4. trust-impact risks
5. likely escalation-needed cases

## Billing Digest

Should summarize:

1. upgrade queue age
2. unresolved invoice or payment coherence risks
3. webhook failure cluster
4. pending user follow-up
5. likely escalation-needed commercial ambiguity

## Rollout Digest

Should summarize:

1. funnel and onboarding pressure
2. auth and upload warning signals
3. support confusion themes
4. moderation and upgrade aging
5. expand, hold, or fix-first review warnings

## Incident Digest

Should summarize:

1. active incidents
2. current commander and alternate
3. timeline changes since last digest
4. unresolved recovery risks
5. operator actions still pending

## Escalation Digest

Should summarize:

1. open escalations
2. missing-owner or transfer-delay risks
3. repeated rerouting
4. oldest unresolved escalations
5. likely next acknowledgments required

## Final Assessment

Digests should reduce repetitive synthesis and repeated status-writing. They are safe only when they remain summary and recommendation artifacts rather than hidden workflow authority.
