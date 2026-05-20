# Taxonomy Suggestion Baseline

Last updated: `2026-05-20`  
Scope: `EXEC-42`

## Purpose

Reduce manual taxonomy work during onboarding while keeping classification transparent and reversible.

## Suggestion Inputs

Taxonomy suggestions may use:

1. account type
2. company lookup result
3. profile text
4. uploaded evidence
5. selected domain
6. existing profile structure

## Suggestion Outputs

The current baseline surfaces:

1. ESCO candidates
2. NACE or category candidates
3. Uniclass candidates
4. missing-information reminders

## UX Rules

1. suggestions must be labeled as RELU AI suggestions when AI produced them
2. confidence should be visible when available
3. every suggested item must remain removable
4. every taxonomy still needs manual confirmation
5. searchable manual selectors remain the fallback truth path

## Decision Boundary

Suggestions are advisory only.

They may:

1. speed up profile completion
2. reduce blank-state confusion
3. give the user a better first draft

They may not:

1. silently classify a profile
2. silently publish a profile
3. silently route moderation
4. silently upgrade billing or visibility

## Remaining Work

1. connect selected suggestions into structured save actions in the profile workspace
2. show taxonomy suggestions in admin moderation views
3. extend deterministic fallback suggestions for cases where AI is unavailable
