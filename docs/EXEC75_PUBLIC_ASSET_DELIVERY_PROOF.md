# EXEC-75 Public Asset Delivery Proof

Date: 2026-05-26

## Status

STATUS: PASS LOCALLY

EXEC-75 fixes the EXEC-74 finding where public company/profile pages exposed authenticated document URLs for logo, banner, photo, and gallery assets.

## Implementation

Changes:

- `ProfileDocument.moderationStatus` was added.
- new profile uploads default to `PENDING`.
- public asset rendering filters to approved profile assets.
- public profile/company asset URLs now use `/profiles/assets/:documentId`.
- authenticated owner document URLs remain for private profile document management.
- admin document moderation endpoint was added for profile media review.

## Public Delivery Rules

Anonymous public asset delivery requires:

- parent profile `visibility = PUBLIC`
- parent profile `moderationStatus = APPROVED`
- parent profile `status = LIVE`
- document `moderationStatus = APPROVED`
- document asset kind in public-safe set: `LOGO`, `PHOTO`, `BANNER`, or `PORTFOLIO`

Rejected or pending media stays hidden even if the profile is public.

## Test Proof

`apps/admin/api/src/profiles/profiles.service.spec.ts` proves:

- an approved asset on an approved public profile is returned anonymously
- an unapproved asset is rejected
- an approved asset on a non-public/non-approved parent profile is rejected

## Operational Note

The migration defaults existing profile documents to `PENDING`. Existing public company logos, banners, and gallery assets need operator review before they become public through the new safe route.

## Remaining Production Verification

After deploy, live browser proof should load an approved public company page anonymously and verify:

- logo image request returns `200`
- banner image request returns `200`
- gallery image request returns `200`
- pending/unapproved profile media returns `403` or `404`
