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
