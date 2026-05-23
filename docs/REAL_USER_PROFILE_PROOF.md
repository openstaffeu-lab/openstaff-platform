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

## EXEC-61 Rerun Closure

Fresh proof run `exec60-1779554181293` closed the remaining EXEC-60 account-shape gaps:

- `POST /relu/onboarding-assistant` returned usable advisory output instead of `INTERNAL_ERROR`
- profile-side geography and taxonomy selections persisted across relogin
- the subcontractor/company-looking-for-projects proof item appeared in the public feed summary before cleanup

### Confirmed persistence details

- `country = Romania`
- `region = Bucuresti-Ilfov`
- `city = Bucharest`
- `languages = [ro, en]`
- ESCO codes persisted through `/profile`
- NACE codes persisted through `/profile`
- Uniclass codes persisted through `/profile`

The proof artifacts were cleaned back out of the public marketplace afterward so no internal EXEC/test content remains public.

## Cleanup

The temporary proof profiles and public posts were cleaned out of the live marketplace after proof so no internal EXEC/test labels remain public.
