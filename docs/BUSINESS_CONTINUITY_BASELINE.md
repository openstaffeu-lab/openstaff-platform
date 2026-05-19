# Business Continuity Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-31`

## Purpose

This baseline defines how OpenStaff should continue operating when production is degraded but not fully down.

## Service Continuity Expectations

Minimum continuity expectations:

1. `/health` and `/status` remain the first source of runtime truth
2. operators know whether the platform is in normal, degraded, or frozen mode
3. public communication stays truthful about manual and delayed workflows

## Degraded-Mode Expectations

Use degraded mode when:

1. public platform remains reachable but core workflows are partially impaired
2. moderation, billing, uploads, or admin access are delayed but not completely unavailable
3. operators can still work safely with narrower scope

## Fallback Operational Modes

Allowed fallback modes:

1. pause new cohort expansion while serving current users
2. pause upgrades while preserving existing access
3. delay moderation decisions while clearly acknowledging queue delay
4. delay billing follow-up while keeping commercial wording truthful

## Partial Outage Procedures

If a partial outage exists:

1. identify impacted workflow
2. declare degraded mode or freeze
3. name owner and backup owner
4. stop making promises the system cannot keep
5. update operator handoff and continuity notes

## Communication Responsibilities

1. Technical Ops communicates runtime state
2. support owner communicates user-facing expectations
3. billing owner communicates commercial delay expectations
4. moderation owner communicates queue delay or review limitations

## Operational Freeze Conditions

Freeze non-essential rollout activity when:

1. production is degraded and ownership is unclear
2. backlog aging already exceeds comfort thresholds
3. release or migration work would increase incident risk
4. one operator is already carrying multiple critical roles

## Emergency Operator Actions

Emergency actions may include:

1. halt cohort expansion
2. stop deploys
3. shift traffic back to the last healthy revision
4. delay moderation or billing promises until state is confirmed
5. switch to manual continuity communication for affected cohorts

## Final Assessment

OpenStaff now has a continuity baseline for degraded and partial-outage operation. Long-term stability depends on using degraded mode early enough that trust and operator control are preserved before a full outage develops.
