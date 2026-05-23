# SUBCONTRACTOR_PUBLIC_VISIBILITY_PROOF

Last updated: 2026-05-23

## EXEC-61 Summary

EXEC-61 closes the public-discovery gap for the company/subcontractor looking-for-projects flow.

## Prior Gap

The EXEC-60 proof item was visible by direct public detail route, but not reliably visible in the public feed summary.

## Fix

The public web marketplace merge now sorts the combined professional + subcontractor pool dataset before slicing the summary list, preventing subcontractor pools from being starved by earlier slicing behavior.

## Live Proof

Runtime proof run: `exec60-1779554181293`

Confirmed before cleanup:

- direct public detail route returned `200`
- `publicFeedSummary.containsSubcontractorPool = true`
- moderation boundaries still held: no pending/rejected artifacts leaked publicly

## Cleanup

The temporary proof listing and profile were cleaned back out of the marketplace after validation so no internal EXEC/test content remains public.
