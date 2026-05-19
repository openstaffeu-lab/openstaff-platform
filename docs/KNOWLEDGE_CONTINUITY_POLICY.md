# Knowledge Continuity Policy

Last updated: `2026-05-19`  
Scope: `EXEC-31`

## Purpose

This policy reduces tribal knowledge risk in production operations.

## Hidden Knowledge Risks

Audit focus:

1. undocumented operational knowledge
2. hidden deployment assumptions
3. hidden recovery assumptions
4. hidden moderation workflows
5. hidden billing workflows
6. hidden release or rollback shortcuts

## Mandatory Documentation Expectations

The following must not remain undocumented:

1. production deploy steps
2. rollback steps
3. restore expectations
4. moderation queue rules
5. billing acknowledgement and follow-up rules
6. escalation ownership
7. accepted manual limitations

## Handover Requirements

Every production-impacting execution should leave:

1. current owner
2. backup owner when available
3. open risk summary
4. next review date
5. link to the governing doc or proof

## Operator Onboarding Expectations

New operators should be able to learn:

1. current rollout mode
2. moderation and billing reality
3. incident and rollback expectations
4. how to find proof, runbooks, and current limits

without requiring hidden verbal context to understand the basics.

## Tribal Knowledge Prevention Rules

1. repeated verbal-only instructions must be converted into docs
2. production-only assumptions must be captured in runbooks or policies
3. undocumented manual workarounds must be treated as risk, not convenience

## Final Assessment

OpenStaff now has a policy that treats undocumented operational knowledge as a continuity risk. This is essential for controlled growth because the real scaling bottleneck is often hidden knowledge, not only hidden load.
