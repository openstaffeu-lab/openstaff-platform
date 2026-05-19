# Efficiency Metrics Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-32`

## Purpose

This baseline defines the efficiency KPIs needed to tell whether controlled operations are becoming more sustainable or simply more exhausting.

## Core Efficiency KPIs

1. moderation minutes per item
2. support minutes per ticket
3. billing minutes per request
4. rollout review time
5. release preparation time
6. operator interruption rate
7. alert-action ratio
8. dashboard usefulness ratio

## Metric Definitions

| Metric | Meaning |
|---|---|
| moderation minutes per item | operator minutes spent from first queue touch to final moderation disposition |
| support minutes per ticket | operator minutes spent from first support acknowledgement to clear closure or escalation |
| billing minutes per request | operator minutes spent from upgrade request receipt through acknowledgement, follow-up, and commercial resolution |
| rollout review time | human time required to prepare and complete a cohort review and decision report |
| release preparation time | human time required to prepare a release, collect proof, and finalize the summary before completion |
| operator interruption rate | count of unplanned context switches per shift across moderation, support, billing, incidents, and release work |
| alert-action ratio | share of alerts that result in a concrete operator action, mitigation, or tracked follow-up |
| dashboard usefulness ratio | share of dashboard views or widgets that directly inform a real operational decision during review windows |

## Final Assessment

OpenStaff now has an explicit efficiency baseline. The platform can now ask not only whether operations are controlled, but whether they are becoming cheaper in human attention without becoming less trustworthy.
