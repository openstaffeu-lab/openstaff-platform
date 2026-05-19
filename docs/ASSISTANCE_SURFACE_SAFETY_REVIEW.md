# Assistance Surface Safety Review

Last updated: `2026-05-19`  
Scope: `EXEC-36`

## Purpose

This review defines how live operational assistance surfaces must behave inside admin so they remain helpful without creating false authority signals.

## Surfaces Reviewed

1. production readiness assistance summary
2. moderation, billing, and support queue assistance cards
3. incident assistance surface
4. digest rendering sections
5. operational correlation cards

## Safe Presentation Rules

1. every assistance card must display a snapshot timestamp
2. every assistance card must display source reasoning tied to visible metrics
3. every assistance card must use non-authoritative wording such as `suggests`, `highlights`, `may indicate`, or `review`
4. every assistance card must avoid hidden scoring, opaque ranks, or unexplained severity labels
5. every assistance card must preserve the operator’s ability to inspect raw source metrics on the same surface

## Prohibited Signals

The live assistance surface may not:

1. imply a moderation approval or rejection already happened
2. imply billing activation already happened
3. imply severity was assigned automatically
4. imply an escalation has already been opened automatically
5. imply rollback was triggered or enforced automatically
6. imply rollout state changed automatically

## Wording Review

Safe wording examples:

1. `review the oldest pending items first`
2. `check failed webhook events before deciding whether to escalate`
3. `this summary treats the queue as advisory backlog pressure`
4. `operators must confirm whether conversion drop is real before acting`

Unsafe wording examples:

1. `critical incident`
2. `rollback now`
3. `auto-escalated`
4. `billing activated`
5. `severity assigned`

## Operator Clarity Review

The EXEC-36 surface now keeps clarity by:

1. showing queue pressure, incident hints, digests, and correlations as separate sections
2. keeping source metrics visible below the summaries
3. labeling correlation cards as `Summary only correlation`
4. labeling incident and queue cards as `Advisory only`
5. repeating guardrails where a recommendation might otherwise look authoritative

## Acknowledgment Expectations

1. operators should treat assistance output as orientation support, not as a final decision
2. operators should confirm source metrics before escalating or re-prioritizing work
3. operators should treat assistance surfaces as stale once a newer `/status` snapshot is available
4. handoff notes should capture whether an operator agreed or disagreed with a recommendation

## Visibility Hierarchy

1. blockers and runtime health remain above assistance
2. queue and incident assistance come before digest and correlation detail
3. raw source metrics remain visible below interpreted summaries
4. runtime capabilities and integrations remain visible so operators can sanity-check the summary

## Final Assessment

EXEC-36 assistance surfaces are safe when they remain visibly derived from `/status`, explicitly advisory, and easy for operators to confirm or reject without ambiguity.
