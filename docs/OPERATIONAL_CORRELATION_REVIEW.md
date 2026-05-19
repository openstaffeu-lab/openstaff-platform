# Operational Correlation Review

Last updated: `2026-05-19`  
Scope: `EXEC-35`

## Purpose

This review defines where operators still correlate signals manually and what safe correlation assistance may do.

## Current Manual Correlation Areas

Operators still manually correlate:

1. logs
2. alerts
3. queues
4. rollout events
5. billing events
6. moderation events
7. auth events

## Correlation Candidates

Safe correlation candidates include:

1. auth-failure spikes aligned with support pressure
2. upload failures aligned with queue growth or public publish friction
3. webhook failures aligned with billing follow-up risk
4. moderation backlog growth aligned with support confusion or rollout pressure
5. incident alerts aligned with queue aging or cohort instability

## Correlation Safety Limits

Correlation may:

1. suggest related signals
2. group likely connected events
3. shorten review paths

Correlation may not:

1. declare root cause automatically
2. close ambiguity automatically
3. change queue state
4. change incident state

## Summary-Only Correlation Rules

Correlation output should remain summary-only when:

1. the blast radius is still unclear
2. multiple plausible causes exist
3. billing or trust state could be misread
4. monitoring visibility is partial

## No-Authority Correlation Rules

Correlation assistance must never:

1. auto-promote an alert to incident severity
2. auto-route mandatory escalations without operator confirmation
3. auto-declare degraded mode
4. auto-trigger rollback or freeze

## Final Assessment

Correlation assistance is valuable because operators currently do a lot of this work manually. EXEC-35 keeps it safe by limiting correlation to visibility improvement, not root-cause authority or recovery authority.
