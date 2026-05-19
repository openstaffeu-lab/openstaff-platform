# Rollout Reporting Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-29`

## Purpose

This baseline defines the minimum reports needed to operate controlled adoption as a measurable process.

## Required Reports

1. daily rollout report
2. moderation report
3. onboarding report
4. billing report
5. incident report
6. support backlog report

## Report Expectations

| Report | Minimum contents |
|---|---|
| daily rollout report | funnel counts, auth/upload failures, moderation backlog, upgrade backlog, operator escalations |
| moderation report | pending counts, rejected counts, turnaround notes, repeated confusion patterns |
| onboarding report | register started/completed, onboarding completed, profile completion notes, friction themes |
| billing report | upgrade requested/approved, webhook failures, manual follow-up backlog, unresolved clarification items |
| incident report | trigger, impact, timeline, current state, rollback/escalation, next operator action |
| support backlog report | open issues, age, repeated questions, escalation ownership, blockers to closure |

## Source of Truth

The reporting baseline now draws from:

1. `/status` rollout intelligence summaries
2. admin moderation queues
3. admin subscription upgrade queues
4. admin security events
5. operational feedback events
6. audit logs for recent operator actions

## Cadence

1. daily while active controlled rollout is running
2. same-day when a new cohort is opened
3. immediately after an incident or visible trust regression

## Minimum Decision Questions

Every rollout report should answer:

1. are people entering the funnel and finishing it
2. are operators keeping up with moderation and upgrades
3. are failures isolated or systemic
4. is confusion coming from wording, unsupported expectations, or runtime defects
5. should rollout continue, pause, or narrow

## Verdict

OpenStaff now has a formal rollout reporting baseline. The next maturity step is generating and archiving these reports routinely rather than only during milestone executions.
