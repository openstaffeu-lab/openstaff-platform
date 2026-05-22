# Onboarding Provider Test Data

Last updated: 2026-05-22

## Purpose

This document lists the operator-supplied test data required to complete final provider-backed onboarding proof in production.

## Email Test Data

Required:

- one accessible inbox for password-reset proof

Current status:

- inbox supplied: `MISSING`

## Romanian Company Test Data

Required:

- one approved valid Romanian CUI/VAT value
- one approved invalid Romanian CUI/VAT value
- expected company name or address fields if known

Current status:

- valid Romanian CUI/VAT: `MISSING`
- invalid Romanian CUI/VAT: `MISSING`
- expected provider-returned values: `MISSING`

## Account Test Data

Required:

- one company onboarding test account
- one professional onboarding test account
- one admin or SUPERADMIN validation path

Current status:

- company test account: `MISSING`
- professional test account: `MISSING`
- admin validation path: `MISSING`

## Why This Matters

Without these test values, the final provider-backed proof cannot be completed honestly for:

- password recovery
- provider-backed Romanian company autofill
- RELU AI profile completion
- homepage and public visibility validation after approval

## EXEC-51 Activation Sequence Dependency

These values are still required in this exact order:

1. inbox for delivered reset email proof
2. valid Romanian CUI/VAT for provider-backed success proof
3. invalid Romanian CUI/VAT for clean-failure proof
4. company account for autofill, publish, and approval proof
5. professional account for RELU/profile/save/public-profile proof
6. admin or SUPERADMIN path for moderation and visibility closure
