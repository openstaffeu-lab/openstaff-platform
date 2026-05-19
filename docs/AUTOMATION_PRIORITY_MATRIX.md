# Automation Priority Matrix

Last updated: `2026-05-19`  
Scope: `EXEC-35`

## Purpose

This matrix ranks automation opportunities by operator hours saved, risk reduction, implementation complexity, trust impact, and rollout impact.

## Priority Matrix

| Priority | Automation area | Operator hours saved | Risk reduction | Implementation complexity | Trust impact | Rollout impact | Why |
|---|---|---|---|---|---|---|---|
| P1 | rollout reporting automation | high | medium | low | medium | high | daily and cohort summaries are repetitive, well-scoped, and already have known data sources |
| P2 | support triage automation | high | medium | medium | high | high | routing the issue faster reduces response lag and context switching without removing human ownership |
| P3 | billing workflow automation | high | high | medium | high | high | acknowledgement, follow-up reminders, and state coherence checks reduce the most fragile manual load |
| P4 | moderation assistance | medium | medium | medium | high | high | queue ordering, duplicate hints, and reason drafting reduce fatigue while preserving human review |
| P5 | onboarding guidance automation | medium | medium | low | high | medium | better self-serve guidance removes repetitive support load and improves user trust |
| P6 | incident reporting automation | medium | medium | low | medium | medium | drafting incident state and evidence saves time during stressful windows |
| P7 | escalation automation | medium | medium | medium | medium | medium | owner suggestions and stale-escalation reminders help, but only after the issue taxonomy is used consistently |

## EXEC-35 Assistance Emphasis

The next safe assistance wave should emphasize:

1. assisted incident summaries
2. queue-pressure summaries
3. operator digests
4. pattern detection
5. safe correlation summaries
6. advisory triage recommendations

These are high-value precisely because they reduce synthesis time without changing operational authority.

## Recommended Automation Roadmap

### Phase 1

1. generate daily rollout, moderation, billing, and support backlog summaries from existing visibility surfaces
2. add billing acknowledgement and stale-follow-up reminders for upgrade requests and unresolved invoice actions
3. add support and onboarding response templates tied to the controlled-rollout contract
4. add release-proof summary generation from the existing validation scripts

### Phase 2

1. suggest support owner and escalation path based on issue category
2. prioritize moderation queue items by age, repeat submitter friction, and rollout criticality
3. suggest moderation reasons and next-step wording from known rule sets
4. draft incident updates from script outputs, logs, and known validation checkpoints

### Phase 3

1. flag billing-state mismatches automatically before operators discover them manually
2. recommend rollout pauses or automation priorities from KPI thresholds
3. suggest freeze or overload conditions based on capacity, backlog aging, and interruption rate

## Not Recommended For Full Autonomy

1. automatic subscription activation without operator approval
2. automatic moderation approval for public content
3. automatic rollback execution without incident authority
4. automatic cohort expansion approval
5. automatic secret, IAM, or auth-permission changes in production

## Final Assessment

The first automation wave should remove summary work, reminder work, and routing work. OpenStaff should not spend its next effort trying to automate final trust decisions before it automates the repetitive clerical work surrounding those decisions.
