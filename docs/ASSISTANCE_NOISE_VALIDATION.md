# Assistance Noise Validation

Last updated: `2026-05-19`  
Scope: `EXEC-37`

## Purpose

This review checks whether the live assistance layer in `/admin/production-readiness` helps orientation without creating dashboard clutter, repeated warnings, stale summaries, or operator scanning fatigue.

## Live Validation Context

- validated against `https://backoffice.openstaff.eu/admin/production-readiness`
- validated after admin deploy build `6761661d-1f06-488a-8b72-1b106ab57c8c`
- validated on latest ready revision `openstaff-admin-00012-jj8`
- authenticated browser proof completed in Chrome and Edge on `2026-05-19`
- active runtime snapshot during proof was quiet: queue counts, failure bursts, and support pressure were all `0`, with `/status.readiness.warnings = []` and `/status.readiness.errors = []`

## Findings

1. summary duplication remained acceptable because queue cards, digest cards, and correlation cards each answer a different operator question:
   queue cards explain backlog and aging, digest cards explain current operational slices, and correlation cards explain cross-signal relationships
2. repeated warnings did not create false incident pressure during the quiet snapshot because the page consistently rendered neutral wording such as `No ... is suggested` instead of repeating alarm-style language
3. stale-summary risk is visible but bounded because every assistance card shows a snapshot timestamp and cites source metrics from the active `/status` payload
4. low-signal cards were still readable in a quiet snapshot because they collapsed to brief neutral summaries instead of verbose warning stacks
5. operator scanning cost remained reasonable because the safety contract appears before recommendation-style content and the cards follow a stable order: safety, queues, incident, digests, correlations, source metrics
6. dashboard overload risk remains present if future `/status` payloads become much denser, but the current live surface stayed scannable in desktop browser proof without console noise or fetch churn

## Noise Risks To Watch

1. if the same warning appears simultaneously in queue cards, digest cards, and incident cards with stronger wording each time, operators may overestimate urgency
2. if the `/status` payload gains more categories without grouping changes, the current page may become too tall for rapid shift handoff scanning
3. if quiet-state cards become longer than their alert-state equivalents, the page will create passive reading cost without helping decisions
4. if timestamps become stale or drift from the source payload refresh behavior, operators may trust outdated summaries

## Current Verdict

`PASS - live assistance is visible and informative without obvious dashboard noise in the current production shape`

The current live layer is not overload-free forever, but it is not presently misleading, repetitive, or alarmist in the validated production state.

## Follow-Up Expectations

1. keep timestamp visibility on every assistance surface
2. keep source reasoning on every queue, digest, and correlation surface
3. prefer neutral quiet-state language over empty warning chrome
4. treat future increases in card count or repeated warning text as a usability regression to review, not as harmless growth
