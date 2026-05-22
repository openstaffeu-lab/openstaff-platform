# EXEC-53 Proof

Last updated: 2026-05-22

## Summary

EXEC-53 fixed the live usability and persistence gap on the public identity onboarding step without mixing in the still-blocked provider work from EXEC-52.

## Root Cause

- the identity page could rehydrate from advisory defaults or onboarding snapshot data at the wrong time and compete with active typing
- the save CTA could remain in a confusing loading state while prior data was still loading
- the layout was too compressed for confident real-user completion

## Implementation Proof

- `apps/admin/web/app/onboarding/identity/page.tsx` now uses a guarded one-time hydration path plus a dirty-state guard
- the page now renders four clearer sections with larger spacing, better labels, Romanian helper text, and stronger save/error/success feedback
- the save CTA is now blocked only while the form is actively saving

## Deploy Proof

- public web build `1d707272-b37b-4e59-acfb-9e7a0ab64cf2`
- latest ready public web revision `openstaff-web-00018-fb5`

## Live Browser Proof

### Chrome desktop

- identity typing accepted for `Stefan`, `Bucuresti`, links, and bio
- local onboarding cache stored the submitted identity payload immediately after save
- revisit restored the saved first name in `52ms`
- reload restored the saved first name in `18ms`
- targeted relogin bootstrap restored the saved first name in `558ms`
- `consoleErrors = []`
- `pageErrors = []`
- no `4xx/5xx` responses were observed

### Edge desktop

- COMPANY identity onboarding saved successfully
- revisit restored the saved first name in `74ms`
- `consoleErrors = []`
- `pageErrors = []`
- no `4xx/5xx` responses were observed

### Mobile Chrome

- saved first name restored on revisit in `637ms`
- saved city restored after a mobile edit/save loop in `561ms`
- `scrollWidth = viewportWidth = bodyScrollWidth = 412`
- `consoleErrors = []`
- `pageErrors = []`
- no `4xx/5xx` responses were observed

### Diacritics

Targeted Chrome proof accepted:

- `Ștefan`
- `București`
- `Mecanică, întreținere și coordonare.`

## Validation Proof

- `apps/admin/web -> npm.cmd run build` ✅
- `apps/admin/api -> npx.cmd prisma validate` ✅
- `apps/admin/api -> npx.cmd prisma generate` ✅
- `apps/admin/api -> npm.cmd run build` ✅
- `apps/admin -> npm.cmd run build` ✅
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1` ✅
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-13-release-check.ps1` ✅

## Boundaries

- EXEC-52 provider blockers remain unchanged: no production email provider secret and no Romanian provider secret are mounted
- EXEC-53 closes identity-form usability and persistence only
