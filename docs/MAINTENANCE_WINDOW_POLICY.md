# Maintenance Window Policy

Last updated: `2026-05-19`  
Scope: `EXEC-31`

## Purpose

This policy defines when production changes should happen and when they should not.

## Maintenance Window Expectations

1. normal production changes should happen in planned windows
2. risky changes require narrower windows and explicit rollback readiness
3. maintenance timing must consider operator coverage, not only technical convenience

## Deploy Timing Rules

Prefer deploys when:

1. primary owner is available
2. rollback owner is available
3. moderation and billing queues are not already stressed
4. current production health is green

## Rollback Timing Rules

Rollback should happen immediately when:

1. the new state is clearly worse than the previous state
2. user trust or operator control is at risk
3. recovery is more important than proving the current deploy correct

## Freeze Periods

Freeze periods apply during:

1. active `SEV-1` or `SEV-2` incidents
2. unresolved degraded mode
3. high backlog pressure
4. high-risk migrations or secret rotations

## High-Risk Deploy Conditions

A deploy is high risk when it includes:

1. schema change
2. auth/runtime config change
3. public moderation visibility change
4. billing workflow change
5. DNS, domain, or secret rotation work

## Rollback Authority

1. Technical Ops owns rollback mechanics
2. incident commander owns rollback authority during active incidents
3. change owner cannot delay rollback when the runtime is clearly degraded

## Production Hotfix Expectations

Hotfixes must:

1. stay minimal
2. keep proof and rollback explicit
3. avoid bundling unrelated work
4. create follow-up work for any rushed compromise

## Final Assessment

OpenStaff now has a maintenance-window policy that treats timing, freeze conditions, and rollback authority as first-class operational controls rather than informal team habits.
