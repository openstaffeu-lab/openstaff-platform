# Cognitive Load Review

Last updated: `2026-05-19`  
Scope: `EXEC-33`

## Purpose

This review identifies the largest sources of operator mental load and where better tooling or coordination would reduce fatigue fastest.

## Cognitive Load Sources

| Source | Current impact | Why it is heavy |
|---|---|---|
| alert overload | medium | signals are useful, but operators still need to correlate what is already known |
| dashboard overload | medium | valuable trend views exist, but not every view is immediately actionable |
| excessive context switching | high | one issue can move across readiness, queue, logs, reporting, and governance docs |
| repetitive proof gathering | high | evidence exists, but summarizing it still costs attention |
| repeated explanations | high | moderation, billing, and onboarding truths still require human restatement |
| operator fatigue vectors | high | queue work, reporting, incident response, and handoff can pile onto the same small operator set |

## Highest Cognitive Load Sources

1. context switching across too many surfaces
2. repeated explanation of the same manual rollout truths
3. repeated proof and handoff assembly
4. uncertainty about whether another operator already owns the next step

## Best Reduction Opportunities

1. shared operator summary surfaces
2. clearer owner and backup-owner visibility
3. stronger queue-aging and escalation visibility
4. reusable response, handoff, and proof templates

## Tooling Candidates

1. owner-and-next-action digest
2. degraded-mode and incident summary surface
3. queue filtering for aging, backlog, and escalation state
4. automated handoff and proof drafting

## Final Assessment

The most expensive operator burden is not raw volume yet. It is the attention cost of reconstructing context and re-explaining truth while trying not to miss something important.
