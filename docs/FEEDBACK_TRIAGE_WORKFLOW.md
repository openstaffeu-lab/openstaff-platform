# Feedback Triage Workflow

Last updated: `2026-05-19`  
Scope: `EXEC-30`

## Purpose

This workflow defines how rollout feedback moves from raw signal to owned decision.

## Lifecycle

1. `received`
2. `classified`
3. `assigned`
4. `resolved`
5. `deferred`
6. `escalated`
7. `converted_to_technical_debt`
8. `converted_to_product_backlog`

## Intake Sources

Feedback may originate from:

1. `POST /ops/feedback`
2. support/operator notes
3. cohort review findings
4. incident review
5. repeated backlog or funnel anomalies

## Classification Rules

Classify into one primary bucket:

1. onboarding friction
2. moderation confusion
3. billing confusion
4. support pain point
5. failed flow
6. operator escalation
7. repeated user confusion

Also classify by:

1. user-facing vs operator-facing
2. trust/copy vs functional/runtime
3. retryable vs non-retryable
4. product backlog vs technical debt candidate

## Assignment Rules

1. support owner handles triage completeness
2. moderation owner handles moderation wording or queue friction
3. billing owner handles commercial clarity and turnaround friction
4. Technical Ops handles runtime, auth, storage, webhook, or systemic failure patterns
5. engineering owner handles product iteration or debt conversion

## Resolution Rules

Mark `resolved` only when:

1. the user confusion is addressed in product, process, or documentation
2. owner and deadline are recorded
3. the same issue is unlikely to recur unchanged in the next cohort

## Deferral Rules

Use `deferred` only when:

1. the issue is real but not cohort-blocking
2. a future review date exists
3. the manual workaround is still truthful and supportable

## Escalation Rules

Escalate when:

1. the issue affects more than one user
2. the issue can mislead public trust
3. the issue causes queue aging or operator overload
4. the issue overlaps incident or security risk

## Debt and Backlog Conversion

Convert to `technical debt` when:

1. the issue comes from architecture, tooling, or runtime limitations
2. documentation alone will not reduce recurrence

Convert to `product backlog` when:

1. the issue is primarily UX, copy, onboarding, or workflow design
2. a user-facing improvement can directly reduce support burden

## Final Assessment

OpenStaff now has a closed feedback-triage lifecycle. The next maturity step is attaching regular owner review cadence so every repeated confusion signal either gets fixed, deferred intentionally, or converted into tracked work.
