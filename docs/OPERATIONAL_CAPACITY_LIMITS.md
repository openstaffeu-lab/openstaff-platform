# Operational Capacity Limits

Last updated: `2026-05-19`  
Scope: `EXEC-32`

## Purpose

This baseline defines practical human-capacity limits for controlled rollout and identifies when efficiency work or automation becomes operationally necessary rather than optional.

## Maximum Sustainable Moderation Load

Moderation is sustainable only while:

1. pending items are cleared within one business day
2. rejections still receive understandable explanation
3. backlog aging does not trend upward across cohorts
4. operator minutes per item do not keep rising because of repeated context gathering

## Maximum Sustainable Support Load

Support is sustainable only while:

1. repeated confusion is captured and triaged
2. support backlog remains understandable and owned
3. operators are not spending most of their time explaining avoidable friction
4. interruption rate stays low enough that one issue does not routinely break work on three others

## Manual Billing Limits

Manual billing is sustainable only while:

1. upgrade requests are acknowledged within one business day
2. invoice and payment state remain coherent
3. billing follow-up does not displace core moderation and support work
4. manual follow-up minutes per request remain bounded enough that billing does not become the dominant queue

## Operator Overload Thresholds

Treat the following as overload signals:

1. same backlog remains open across multiple daily handoffs
2. one operator owns multiple critical queues without backup
3. escalation volume rises while product confusion remains unresolved
4. release work competes with active continuity work
5. interruption rate rises because the same operator keeps switching between support, moderation, billing, and release proof
6. report-writing or proof collection starts delaying queue decisions

## Freeze and Escalation Conditions

Freeze rollout or escalate when:

1. moderation backlog exceeds sustainable aging
2. support pressure rises without clear ownership
3. manual billing follow-up becomes a bottleneck
4. incident or maintenance work removes too much operator capacity
5. operator efficiency drops because repeated manual explanation consumes more time than the underlying decision itself

## Required Automation Thresholds

Prioritize automation when:

1. the same operator action repeats across cohorts
2. queue aging is driven by manual repetition, not by exceptional edge cases
3. product truth no longer depends on manual explanation
4. release proof, rollout reporting, or handoff summaries consume enough time to compete with live queue work
5. interruption rate rises because routing and summaries are still being built manually

## Final Assessment

OpenStaff now has explicit operational capacity limits and explicit efficiency triggers. Controlled growth should be framed not only as traffic growth, but as whether human attention is still being used on judgment instead of repetition.
