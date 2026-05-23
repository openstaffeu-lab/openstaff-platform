# EXEC-60 Proof

Date: 2026-05-23

## Scope

EXEC-60 validated real production user/product flows for:

1. `PROFESSIONAL`
2. `COMPANY` offering projects
3. `COMPANY / SUBCONTRACTOR` looking for projects
4. RELU enrichment/classification
5. media/document/video upload
6. moderated public visibility
7. browser/public profile rendering

## Runtime Proof

- API runtime script: `apps/admin/api/scripts/exec-60-runtime-check.js`
- proof run id: `exec60-1779549538497`
- live `/status` contract during proof:
  - `emailDelivery.mode = configured`
  - `warnings = []`
  - `errors = []`

## Proven Live

- all three proof accounts registered and logged in
- onboarding identity/company saves succeeded
- profile save persisted across relogin
- profile asset uploads succeeded
- CV extraction completed
- RELU enrich/classify/results succeeded
- public posts were created and moderated to public visibility
- approved media/documents were publicly reachable
- rejected subcontractor document stayed hidden with `403`
- public profile APIs returned `200` before cleanup

## Browser Proof

Fresh browser proof after the ActorCard public-media fix on `openstaff-web-00022-mfn` covered:

- `/`
- `/login`
- `/forgot-password`
- `/dashboard`
- `/onboarding/identity`
- `/professionals`
- `/jobs`
- the three public profile routes

Results:

- Chrome desktop: `consoleErrors = []`, `pageErrors = []`, `badResponses = []`
- Edge desktop: `consoleErrors = []`, `pageErrors = []`, `badResponses = []`
- Mobile Chrome: `consoleErrors = []`, `pageErrors = []`, `badResponses = []`, no horizontal overflow

The only remaining browser request failures were `net::ERR_ABORTED` navigation-aborted background requests during route transitions.

## Honest Remaining Blockers

1. `POST /relu/onboarding-assistant` still returned `INTERNAL_ERROR`
2. profile-side structured taxonomy/geography relations remain incomplete because `/countries` and legacy `/esco` returned empty live datasets
3. uploaded proof assets still reported `storage.provider = local`
4. the subcontractor/company-looking-for-projects listing did not appear in the public feed summary even though its direct public detail route was visible before cleanup

## Cleanup

The temporary proof posts were deleted and the temporary proof profiles were returned to `OFFLINE` after validation so no internal EXEC/test labels remain publicly visible.
