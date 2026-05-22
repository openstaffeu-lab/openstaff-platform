# Romanian Provider Operator Handoff

Last updated: 2026-05-22

## Goal

This handoff defines what the operator must procure and verify before OpenStaff can activate provider-backed Romanian company autofill in production.

## Current State

- the code already supports `ROMANIAN_COMPANY_LOOKUP_URL` and `ROMANIAN_COMPANY_LOOKUP_API_KEY`
- production still has no Romanian provider secret in Secret Manager
- Romanian lookups currently remain limited to trusted baseline matches, VIES checks, and manual fallback

## Required Operator Inputs

- selected Romanian provider name
- `ROMANIAN_COMPANY_LOOKUP_URL`
- `ROMANIAN_COMPANY_LOOKUP_API_KEY`
- provider documentation link
- one approved valid Romanian CUI/VAT value
- one approved invalid Romanian CUI/VAT value
- expected response fields if known
- rate-limit expectations
- timeout expectations

## Required Provider Capability Checklist

The operator should confirm whether the selected provider returns:

- legal company name
- registration or registry number
- VAT identifier
- address
- city/locality
- postal code
- VAT payer state
- legal status

## Privacy And Data Handling

The operator must confirm:

- the provider is contractually acceptable for production lookup traffic
- test lookups are allowed
- there are no restrictions that would prohibit storing provider-returned metadata in audit logs

## Proof Requirements After Injection

The handoff is not complete until EXEC-50 can verify:

1. valid Romanian CUI returns provider-backed data
2. invalid Romanian CUI fails cleanly
3. provider metadata is persisted in `AuditLog`
4. manual override still works
5. fallback behavior remains safe if the provider is unavailable

## Missing Today

Selected Romanian provider: `MISSING`  
Provider URL: `MISSING`  
Provider API key: `MISSING`  
Approved Romanian test CUI/VAT values: `MISSING`
