# AI Moderation Workflow

Backoffice moderation for RELU AI results is split-screen and evidence-driven.

## Split Screen

- Left/raw side: `inputSnapshot` from uploaded documents, media, source entity state, profile context, or project context.
- Right/extracted side: `outputData` with RELU AI taxonomy, summary, match, recommendation, or parsing output.

## Confidence

Moderators see `RELU Confidence NN%`, low-confidence warnings, fallback markers, and manual validation requirements.

## Correction Log

Overrides create a visible correction trail:

`Input X -> Moderator Correction Y`

Correction categories include taxonomy, budget, categories, compatibility, extracted values, and explanation text.

## Auto-Approve Eligibility

The UI identifies optional auto-approve candidates when:

- user/company trust is high
- company verification is complete
- RELU confidence is above 90%
- fallback was not used
- result did not fail moderation

## EXEC-72 Persistence Closure

- `PATCH /admin/relu/results/:id/status` stores reviewer, review timestamp, and correction audit metadata.
- `PATCH /admin/relu/results/:id/override` stores `overrideData`, before/after audit payloads, and a `correctionLog` marker.
- Public post, media, and document moderation changes now write `MARKETPLACE_MODERATION` audit events.
- Reruns append new RELU task/run/result records instead of overwriting prior correction history.
