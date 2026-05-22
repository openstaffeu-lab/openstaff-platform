# EXEC-54 Proof

Last updated: 2026-05-22

## Summary

EXEC-54 turned the public identity step into a more human-friendly onboarding experience without pretending to close the still-blocked provider work from EXEC-52.

## What Changed

- optional social links now behave like optional inputs
- invalid optional URLs now show guidance instead of hard-stop validation
- the identity step is split into clearer grouped sections
- RELU AI is visible and interactive on the same page
- public preview and local image preview are now present before completion
- taxonomy assistance appears earlier through NACE, ESCO, and Uniclass helpers

## Deploy Proof

- web build `dcd25cb4-0063-43ff-b98d-f71a0363f976`
- latest ready web revision `openstaff-web-00019-5x7`
- API build `880775e2-b428-40c3-8715-df940adc4a00`
- latest ready API revision `openstaff-api-00014-tfr`

## Live Browser Proof

### Chrome desktop

- headings confirmed the new guided flow:
  - `Construieste un profil credibil, nu doar un formular completat`
  - `A. Identitate de baza`
  - `B. Contact si localizare`
  - `C. Prezenta profesionala`
  - `D. Despre tine`
  - `E. RELU AI Assistant`
- malformed GitHub still allowed continuation
- inline optional guidance was visible
- revisit persistence restored first name in `34ms`
- `consoleErrors = []`
- `pageErrors = []`
- no `4xx/5xx` responses were observed

### Targeted Chrome RELU proof

- `RELU AI a pregatit sugestii pentru descriere, expertiza si clasificare.`
- visible `ESCO sugerat`
- visible `NACE sugerat`
- visible `Uniclass sugerat`

### Edge desktop

- COMPANY identity flow saved successfully
- revisit persistence restored first name in `46ms`
- `consoleErrors = []`
- `pageErrors = []`
- no `4xx/5xx` responses were observed

### Mobile Chrome

- optional-social toggle was visible
- revisit persistence restored first name in `56ms`
- `scrollWidth = viewportWidth = bodyScrollWidth`
- `consoleErrors = []`
- `pageErrors = []`
- no `4xx/5xx` responses were observed

## Validation Proof

- `apps/admin/web -> npm.cmd run build` ✅
- `apps/admin/api -> npx.cmd prisma validate` ✅
- `apps/admin/api -> npx.cmd prisma generate` ✅
- `apps/admin/api -> npm.cmd run build` ✅
- `apps/admin -> npm.cmd run build` ✅
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-production-ops-check.ps1` ✅
- `powershell -ExecutionPolicy Bypass -File scripts/release/exec-26-failure-simulations.ps1` ✅

## Boundaries

- EXEC-52 provider blockers remain unchanged
- extra social links beyond the supported persisted production set remain onboarding-assistance inputs, not a new public-profile schema rollout
- homepage/public-profile approval proof was not reopened by this execution
