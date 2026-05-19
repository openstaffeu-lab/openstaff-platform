# Production Drift Policy

Last updated: `2026-05-19`  
Scope: `EXEC-31`

## Purpose

This policy formalizes how OpenStaff detects and prevents production drift over time.

## Drift Types

Primary drift categories:

1. config drift
2. runtime drift
3. dependency drift
4. undocumented infrastructure change
5. manual production edits
6. untracked secret changes
7. untracked IAM changes

## Prevention Rules

1. production changes should flow through repo-tracked governance where possible
2. secret and IAM changes must be recorded in the ops log
3. runtime contract changes must update `/status`-relevant docs when applicable
4. dependency changes must update dependency governance when materially relevant

## Detection Expectations

Detect drift through:

1. release checks
2. production ops-check
3. failure simulations
4. dashboard and alert review
5. runbook and topology review

## Manual Production Edit Rules

Manual edits in production should be:

1. exceptional
2. reversible
3. documented
4. followed by repo alignment if they become part of the new baseline

## Secret and IAM Change Rules

1. untracked secret rotation is not acceptable
2. untracked IAM widening is not acceptable
3. emergency changes must still be recorded after the fact if immediate logging is impractical

## Documentation Drift Rules

When production truth changes materially:

1. update `STATUS.md`
2. update the relevant runbook or policy
3. update proof where the execution is milestone-grade

## Final Assessment

OpenStaff now has a production-drift policy that treats undocumented changes as governance failures, not harmless shortcuts. This protects long-term continuity as the system evolves.
