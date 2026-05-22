# Onboarding Identity Form Proof

Last updated: 2026-05-22

## Scope

This proof captures the live usability and persistence checks for `https://openstaff.eu/onboarding/identity` after the EXEC-53 fixes.

## Root Cause Summary

The live form had two practical problems:

1. local typing could be overwritten by advisory defaults or a later onboarding snapshot
2. the save CTA could stay in an unhelpful loading state while prior data was still being fetched

The page also felt too compressed for real onboarding because it relied too heavily on placeholder-only guidance and narrow field presentation.

## Implemented Fixes

- one stable local form state now owns the inputs
- onboarding-state hydration is now one-time and guarded
- defaults remain advisory and stop applying once the user edits the form
- snapshot loading no longer blocks the user behind a permanently disabled save CTA
- the layout now uses clearer sections, larger fields, Romanian helper text, and required/optional indicators

## Live Proof

### Chrome desktop

- typing accepted for first name, city, links, and bio
- local onboarding cache stored the saved identity values immediately after save
- revisit restored saved first name in `52ms`
- reload restored saved first name in `18ms`
- targeted relogin proof restored saved first name in `558ms`

### Edge desktop

- COMPANY onboarding identity form saved successfully
- revisit restored the saved first name in `74ms`

### Mobile Chrome

- saved values reappeared on revisit in `637ms`
- post-save revisit restored city in `561ms`
- `scrollWidth = viewportWidth = bodyScrollWidth = 412`

### Diacritics

Targeted Chrome proof accepted:

- `Ștefan`
- `București`
- `Mecanică, întreținere și coordonare.`

## Boundaries

- provider-backed password reset remains blocked by missing provider secrets
- provider-backed Romanian company lookup remains blocked by missing provider secrets
- this proof closes identity-form usability and persistence only
