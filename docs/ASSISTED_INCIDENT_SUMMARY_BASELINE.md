# Assisted Incident Summary Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-35`

## Purpose

This baseline defines the standard operator-assist incident summary that may be prepared for humans during triage, mitigation, handoff, and post-incident review.

## Assistance Principle

The incident summary may:

1. summarize
2. highlight
3. correlate
4. suggest
5. prioritize likely next checks

The incident summary may not:

1. assign final severity automatically
2. trigger rollback
3. declare degraded mode
4. close an incident without operator action
5. override incident commander judgment

## Required Incident Summary Sections

Every assisted incident summary should include:

1. incident overview
2. affected systems
3. timeline summary
4. affected queues
5. affected cohorts
6. severity hints
7. rollback hints
8. unresolved risks
9. required operator actions

## Incident Overview

Must summarize:

1. what signal triggered attention
2. what appears degraded or unstable
3. whether this looks isolated or cross-surface
4. whether an active incident already exists

## Affected Systems

Must identify likely affected systems such as:

1. API runtime
2. auth flows
3. storage or upload paths
4. billing webhook path
5. admin operational surfaces
6. monitoring visibility itself

## Timeline Summary

The summary should prepare, not decide:

1. first detected signal
2. first operator-visible symptom
3. latest related alert or queue movement
4. latest human action
5. time gaps that may require operator review

## Affected Queues

Must highlight likely downstream operational pressure on:

1. moderation
2. billing
3. support
4. escalations
5. rollout review

## Affected Cohorts

Must identify whether the issue likely affects:

1. internal operators only
2. active public users
3. a specific rollout cohort
4. all current cohorts

## Severity Hints

Severity hints must be clearly non-authoritative.

Allowed phrasing:

1. `may require SEV-2 review`
2. `appears bounded but user-visible`
3. `suggests cross-service impact`

Prohibited behavior:

1. auto-setting `SEV-1` to `SEV-4`
2. auto-opening or auto-closing severity states

## Rollback Hints

Rollback hints may surface:

1. likely recent change window
2. likely affected release or dependency surface
3. whether rollback review may be needed

Rollback hints may not:

1. approve rollback
2. execute rollback
3. suppress operator review

## Unresolved Risks

Must surface uncertainties such as:

1. unclear blast radius
2. incomplete ownership
3. partial monitoring blindness
4. billing or visibility-state ambiguity
5. queue pressure likely to worsen if delayed

## Required Operator Actions

The summary may recommend actions like:

1. confirm affected service
2. assign or confirm owner
3. review queue impact
4. review recent release or config changes
5. assess whether degraded mode or freeze review is needed

It may not mark them complete automatically.

## Final Assessment

EXEC-35 defines the incident summary as a safe orientation layer. It exists to shorten operator thinking setup time, not to replace severity judgment, rollback authority, or incident command.
