# Cohort Review Framework

Last updated: `2026-05-19`  
Scope: `EXEC-30`

## Purpose

This framework turns controlled-rollout evidence into a repeatable cohort review instead of relying on narrative confidence.

## Review Trigger

Run a cohort review:

1. after each new bounded cohort is onboarded
2. before expanding from one cohort size band to the next
3. after any incident, confusion spike, or backlog spike that materially changes rollout risk

## Required Inputs

1. rollout funnel summary from `/status.rolloutIntelligence`
2. moderation, upgrade, and failure summaries from `/status`
3. operational feedback categories from `POST /ops/feedback`
4. support and operator observations from `docs/ROLLOUT_REPORTING_BASELINE.md`
5. incident notes, if any

## Review Structure

### Cohort shape

Capture:

1. cohort name and dates
2. target size
3. actual activated users
4. company / professional mix
5. special constraints or manual handling assumptions

### Flow outcomes

Review:

1. landing to register outcomes
2. register to onboarding outcomes
3. onboarding to profile-complete outcomes
4. publish start to submit outcomes
5. publish submit to approve outcomes
6. upgrade request to approval outcomes

### Moderation outcomes

Review:

1. pending counts
2. rejected counts
3. oldest pending age
4. confusion caused by moderation wording or rejection explanation

### Support and operator outcomes

Review:

1. support load
2. repeated confusion themes
3. operator escalations
4. billing clarification burden
5. moderation burden
6. technical intervention burden

### Incident and friction review

Capture:

1. incidents
2. user-facing friction
3. operator-facing friction
4. trust or copy contradictions
5. rollout blockers that should pause expansion

## Decision Outputs

Every cohort review must end with one decision:

1. `expand`
2. `hold`
3. `fix-first`
4. `rollback`

The decision must include:

1. owner
2. deadline
3. evidence source
4. exact blockers, if expansion is denied

## Minimum Review Questions

1. did users complete the intended flow without hidden operator rescue
2. did moderation keep up with the cohort without trust drift
3. did billing and upgrade handling stay understandable
4. did support questions reveal product confusion or only normal rollout learning
5. did operator effort stay within the accepted manual model
6. is the next cohort size still truthful given the observed burden

## Final Assessment

OpenStaff now has a formal cohort review mechanism. The next maturity step is running this review consistently enough that product and operational changes are driven by evidence instead of launch optimism.
