# Human Load Audit

Last updated: `2026-05-19`  
Scope: `EXEC-32`

## Purpose

This audit identifies where controlled rollout still depends on repeated human effort and classifies which workflows are safe automation candidates versus workflows that should remain human-reviewed.

## Classification Model

| Classification | Meaning |
|---|---|
| low-risk automation candidate | repeatable, rules-based work where automation mainly reduces clerical effort and does not remove a required trust decision |
| medium-risk automation candidate | partially rules-based work where automation can prepare or triage the action, but human confirmation should remain |
| high-risk/manual-only workflow | work where user trust, money movement, safety, access, or rollout authority depends on explicit human judgment |

## Workflow Audit

| Workflow | Repetitive human actions today | Current burden | Classification | Why |
|---|---|---|---|---|
| moderation queue review | open queue, inspect item, compare state, approve or reject, explain waiting state | high | medium-risk automation candidate | queue ordering, duplicate detection, and reason suggestions can be automated, but final approval still affects public trust |
| moderation rejection explanation | restate why an item is pending or rejected, explain next step, note resubmission path | medium | low-risk automation candidate | templated reason drafting and response helpers can remove repetition without auto-publishing content |
| manual billing acknowledgement | confirm request received, confirm next operator step, track follow-up | medium | low-risk automation candidate | acknowledgement, reminders, and state nudges are repetitive and low-risk while final billing approval stays human-owned |
| manual upgrade review | inspect request, validate plan path, confirm invoice/proforma follow-up, activate after review | high | high-risk/manual-only workflow | commercial trust and entitlement activation still depend on explicit operator approval |
| support triage | classify issue, check `/status`, identify owner, route escalation | high | medium-risk automation candidate | triage and owner suggestion can be automated, but the real state still requires operator confirmation |
| repeated onboarding clarification | explain required steps, explain review expectations, direct next action | medium | low-risk automation candidate | guided copy, contextual help, and response templates can reduce repeated human explanation |
| rollout report preparation | collect counts, summarize backlog, summarize incidents, write daily report | high | low-risk automation candidate | summaries are mostly aggregation work from known sources of truth |
| cohort review preparation | gather scorecard inputs, summarize friction themes, summarize support burden | medium | medium-risk automation candidate | input collection can be automated, but expand/hold/fix-first/rollback decisions remain human-owned |
| release proof collection | confirm builds, capture script outputs, verify commit/push, summarize results | high | low-risk automation candidate | evidence gathering is repetitive and predictable even though release approval remains human-owned |
| release gate review | verify required docs, clean tree, branch, env examples, builds | medium | low-risk automation candidate | the repository side is already scriptable and mostly deterministic |
| rollback decision | decide whether to freeze, revert traffic, or hotfix | low frequency but critical | high-risk/manual-only workflow | rollback authority must stay human because blast radius is operational and user-facing |
| incident update drafting | restate state, owner, mitigation, next step, communication cadence | medium | medium-risk automation candidate | status summaries can be drafted automatically, but severity, truthfulness, and comms judgment remain human-owned |
| deploy timing and freeze coordination | choose window, confirm rollback owner, check active incidents | medium | high-risk/manual-only workflow | this is release-risk judgment, not clerical repetition |
| alert review | inspect repeated signals, decide whether action is needed, correlate logs | medium | medium-risk automation candidate | dedupe and routing can help, but alert credibility still needs human review |
| support backlog handoff | summarize open issues, age, owner, blockers | medium | low-risk automation candidate | daily handoff summaries are structurally repetitive |

## Highest Human-Load Themes

1. repeated explanation of the same truth across support, moderation, and billing
2. repeated summary work for reports, proof, and handoff
3. repeated queue-ordering and queue-follow-up work where the real decision remains human
4. concentrated operator judgment in commercial approval, rollback, and expansion authority

## Final Assessment

OpenStaff's biggest remaining scale limiter is not that operators perform rare hard work. It is that they keep repeating the same low-leverage explanation, summary, and queue-follow-up work around a smaller set of decisions that must remain human-owned.
