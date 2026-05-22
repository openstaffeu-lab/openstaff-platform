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
