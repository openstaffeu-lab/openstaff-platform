# RELU Profile Generation Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-42`

## Purpose

Make RELU AI visible in the real onboarding flow instead of leaving profile enrichment hidden behind separate specialist tooling.

## Current User-Facing Flow

The onboarding completion step now shows a visible RELU AI action:

1. `Analyzeaza cu RELU AI`
2. analysis state while the request runs
3. suggested summary
4. suggested ESCO candidates
5. suggested NACE or category candidates
6. suggested Uniclass candidates
7. missing-information guidance
8. a direct path to the editable profile workspace

## RELU AI May

1. analyze current profile data
2. enrich profile context
3. classify profile content
4. suggest taxonomy
5. summarize likely profile positioning
6. highlight missing information

## RELU AI May Not

1. publish automatically
2. approve automatically
3. change moderation state
4. activate billing
5. override user edits
6. override operator decisions

## Current Runtime Shape

The current flow uses the existing RELU profile endpoints to:

1. enrich the profile
2. classify the profile
3. read back result sets

The completion page then renders those suggestions with explicit advisory wording.

## Trust Rules

1. label the output as suggested by RELU AI
2. keep confidence or uncertainty visible where available
3. keep the editable profile draft one click away
4. require user confirmation before profile publication
5. require operator moderation before public visibility

## Remaining Work

1. apply selected RELU suggestions directly into structured profile fields from the completion surface
2. show the same suggestion context inside backoffice review surfaces
3. improve provider-backed extraction quality when richer document pipelines are available
