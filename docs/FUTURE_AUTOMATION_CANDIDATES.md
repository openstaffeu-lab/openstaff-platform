# Future Automation Candidates

Last updated: `2026-05-19`  
Scope: `EXEC-34`

## Purpose

This baseline maps future operational automation candidates while preserving the distinction between operator assistance and operator authority.

## Assistance Versus Authority

OpenStaff may automate assistance earlier than authority.

Operational assistance includes:

1. summaries
2. routing hints
3. aging detection
4. duplicate detection
5. recommendation drafts

Operational authority includes:

1. final moderation outcomes
2. final billing activation decisions
3. incident severity assignment
4. degraded-mode declaration
5. rollback approval

Authority remains human-owned.

## Candidate Mapping

| Candidate | Classification | Why |
|---|---|---|
| queue summaries and aging digests | safe | reduces clerical load without changing authority |
| owner-and-backup reminders | safe | improves coordination without changing decisions |
| support confusion clustering | operator-assist only | helps routing, but human review still needed |
| billing coherence summaries | operator-assist only | useful for orientation, but final truth still human-reviewed |
| moderation case recommendations | recommendation-only | can support consistency, but approval/rejection stays human |
| incident timeline drafting | summary-only | reduces handoff burden without changing incident command |
| alert deduplication hints | safe | lowers noise while preserving operator review |
| escalation routing suggestions | operator-assist only | helpful, but receiving owner should confirm |
| degraded-mode or freeze recommendation | escalation-only | may be proposed, never auto-declared |
| rollback recommendation | escalation-only | can surface candidate data, never execute or approve automatically |
| automatic final moderation approval | unsafe | trust decision must remain human-owned |
| automatic subscription activation from incomplete billing context | unsafe | commercial truth cannot be assumed |
| automatic incident severity assignment without review | unsafe | high-stakes judgment stays human |
| automatic closure of unresolved escalations | unsafe | risks hiding live operational ambiguity |

## Safe Automation Rules

Automation is safest when it:

1. shortens search time
2. shortens summary writing
3. highlights aging or ownership gaps
4. reduces duplicate alert or queue review effort

## Unsafe Automation Rules

Automation is unsafe when it:

1. changes public trust state
2. changes billing truth
3. changes severity or rollback authority
4. hides unresolved ambiguity behind a confident summary

## Final Assessment

EXEC-34 clarifies that the next automation wins should accelerate orientation, summarization, and routing. They should not transfer authority away from operators in moderation, billing, incident command, or rollback decisions.
