# REAL_USER_PROFILE_PROOF

Last updated: 2026-05-23

## EXEC-60 Summary

EXEC-60 proved that OpenStaff can create and persist three real account shapes in production:

1. a `PROFESSIONAL`
2. a `COMPANY` offering projects
3. a `COMPANY / SUBCONTRACTOR` looking for projects

The live runtime proof came from `apps/admin/api/scripts/exec-60-runtime-check.js` against `https://api.openstaff.eu`.

## Proven Live

- registration succeeded for all three proof accounts
- email/password login succeeded for all three proof accounts
- onboarding identity save succeeded
- company onboarding save succeeded for both company actors
- `/profile` save succeeded
- refresh / relogin persistence succeeded
- moderation approvals succeeded
- public profile APIs returned `200` before cleanup

## Confirmed Runtime Details

- `runId = exec60-1779549538497`
- `emailDelivery.mode = configured`
- `warnings = []`
- `errors = []`

## Honest Gaps

- RELU enrichment/classification worked, but `POST /relu/onboarding-assistant` still returned `INTERNAL_ERROR`
- profile-side structured taxonomy relations were not persisted because live relation-backed taxonomy/geography datasets remain incomplete
- proof assets stored with `storage.provider = local`, so durable GCS-backed persistence was not proven

## Cleanup

The temporary proof profiles and public posts were cleaned out of the live marketplace after proof so no internal EXEC/test labels remain public.
