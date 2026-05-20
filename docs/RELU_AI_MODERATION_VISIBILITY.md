# RELU AI Moderation Visibility

Last updated: 2026-05-20

## Admin Review Goal

RELU AI remains assistive only. Admin operators need visibility into:

- AI profile explanation
- ESCO suggestions
- NACE/category suggestions
- Uniclass suggestions
- extracted requirements
- missing-information hints
- current user-selected taxonomy

## EXEC-43 Admin Surface

`/admin/onboarding` now exposes:

1. linked legacy profile context
2. current moderation and visibility state for the linked profile
3. current user taxonomy selections
4. a first-class RELU load/refresh action
5. inline comparison between AI suggestions and user-selected taxonomy

## Authority Boundary

RELU AI may:

- analyze
- classify
- summarize
- suggest
- highlight missing information

RELU AI may not:

- approve moderation
- publish profiles
- change billing state
- override operator decisions
- alter rollout authority
