# RELU AI Productization Baseline

Last updated: 2026-05-22

## Purpose

This baseline defines how RELU AI should behave as a real onboarding product assistant in production, without silently taking authority away from the user or the operator.

## Product Role

RELU AI may assist with:

- CV and document parsing
- company or profile summary suggestions
- skill extraction
- ESCO suggestion generation
- Uniclass suggestion generation
- category and subcategory suggestion generation
- missing-information hints
- visibility and completion recommendations

RELU AI may not:

- publish automatically
- approve automatically
- overwrite saved user data silently
- activate billing
- override moderation
- claim facts that are not visible to the user

## Required User-Trust Rules

1. suggestions remain advisory
2. the user can edit before saving
3. the user can reject suggestions
4. confidence or uncertainty should stay explainable when available
5. failures should degrade gracefully rather than block the full onboarding flow

## Required Operator-Trust Rules

1. admin review may see RELU AI suggestions and supporting context
2. operator surfaces must distinguish user-selected values from model-suggested values
3. rejected or missing suggestions must not be presented as approved content
4. auditability should remain available through existing review and audit surfaces

## Product Readiness State

As of `2026-05-22`, RELU AI is at a strong application baseline:

- onboarding completion surfaces render RELU suggestions
- admin onboarding review exposes RELU context
- taxonomy suggestions are visible as advisory
- the platform already avoids silent publication and silent approval

The remaining closure gap is fresh live proof, not baseline design:

- upload to parse
- suggestion rendering
- user edit
- save
- refresh persistence
- admin review visibility
- public-profile output after approval

## EXEC-52 Closure Requirement

EXEC-52 should re-prove RELU AI product behavior live on the same revision set as final provider activation.
