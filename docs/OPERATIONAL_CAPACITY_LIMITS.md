# Operational Capacity Limits

Last updated: `2026-05-19`  
Scope: `EXEC-31`

## Purpose

This baseline defines practical human-capacity limits for controlled rollout.

## Maximum Sustainable Moderation Load

Moderation is sustainable only while:

1. pending items are cleared within one business day
2. rejections still receive understandable explanation
3. backlog aging does not trend upward across cohorts

## Maximum Sustainable Support Load

Support is sustainable only while:

1. repeated confusion is captured and triaged
2. support backlog remains understandable and owned
3. operators are not spending most of their time explaining avoidable friction

## Manual Billing Limits

Manual billing is sustainable only while:

1. upgrade requests are acknowledged within one business day
2. invoice and payment state remain coherent
3. billing follow-up does not displace core moderation and support work

## Operator Overload Thresholds

Treat the following as overload signals:

1. same backlog remains open across multiple daily handoffs
2. one operator owns multiple critical queues without backup
3. escalation volume rises while product confusion remains unresolved
4. release work competes with active continuity work

## Freeze and Escalation Conditions

Freeze rollout or escalate when:

1. moderation backlog exceeds sustainable aging
2. support pressure rises without clear ownership
3. manual billing follow-up becomes a bottleneck
4. incident or maintenance work removes too much operator capacity

## Required Automation Thresholds

Prioritize automation when:

1. the same operator action repeats across cohorts
2. queue aging is driven by manual repetition, not by exceptional edge cases
3. product truth no longer depends on manual explanation

## Final Assessment

OpenStaff now has explicit operational capacity limits. Controlled growth should stop being framed only as traffic growth and start being framed as whether human operational burden is still sustainable.
