# RELU AI Onboarding Baseline

Last updated: 2026-05-22

## Purpose

This baseline defines how RELU AI now participates in onboarding after EXEC-54.

## Product Rules

- RELU AI is visible directly inside onboarding, not hidden behind later profile tooling
- RELU AI remains advisory only
- RELU AI never silently overwrites user input
- RELU AI never auto-publishes, auto-approves, or changes billing or moderation state
- the user must explicitly copy or accept suggestions

## Current Live Scope

On the identity step, RELU AI can now:

- save the current draft profile
- run enrichment and classification on the underlying profile
- show a richer summary when available
- suggest ESCO
- suggest NACE
- suggest Uniclass
- highlight missing information
- let the user copy suggestions into the current draft

## Boundaries

- RELU AI suggestions are not treated as truth
- RELU AI suggestions do not replace moderation
- RELU AI suggestions do not replace company-provider proof or password-reset provider proof
- the onboarding assistant still depends on the existing RELU backend contract rather than a new dedicated onboarding-only AI service
## EXEC-60 Note

Fresh EXEC-60 runtime proof confirmed that RELU profile enrichment and RELU taxonomy classification still work live for professional and company proof accounts through:

- `POST /relu/profiles/:id/enrich`
- `POST /relu/profiles/:id/classify`
- `GET /relu/profiles/:id/results`

The same execution also confirmed that the visible onboarding-assistant surface was not closure-ready because `POST /relu/onboarding-assistant` returned `INTERNAL_ERROR` for all three proof actors.

## EXEC-61 Continuity Closure

EXEC-61 closes the visible onboarding-assistant blocker from a product-flow perspective:

- `POST /relu/onboarding-assistant` now returns usable advisory output instead of surfacing `INTERNAL_ERROR`
- the fallback path is explicit, non-destructive, and keeps suggestions editable/advisory
- RELU still does not silently overwrite user content, auto-publish, or auto-approve anything

Current honest runtime note:

- upstream Gemini quota is still depleted, so the assistant may enter continuity mode and explain the degraded state while still returning helpful onboarding guidance
- this is now a provider-capacity note, not a broken-endpoint blocker
