# Real Visitor Simulation

Last updated: 2026-05-22

## Scope Reality

EXEC-56 could only partially simulate the real visitor journey because transactional email and Romanian provider activation are still blocked.

## What Was Proven

- anonymous visitor browsing remained clean on the public surface in the targeted browser run
- public onboarding entry routes stayed accessible
- no repeated `401` auth noise appeared in the validated anonymous and stale-token scenarios

## What Remains Blocked

The following cannot yet be completed honestly:

### Scenario A

- first-time company onboarding with provider-backed Romanian autofill

### Scenario B

- forgot password
- delivered reset email
- reset from real email
- login again after reset

### Scenario C

- final provider-backed trust closure after a fresh public-web promotion and full browser rerun

## External Inputs Still Required

- transactional email provider runtime credentials
- Romanian company provider runtime credentials
- one reset inbox
- approved Romanian valid and invalid test identifiers
- company and professional test accounts plus admin validation path

## EXEC-57 Revalidation

EXEC-57 confirmed that the blocked visitor scenarios remain the same:

- recovery cannot be simulated honestly without real delivered email
- provider-backed Romanian autofill cannot be simulated honestly without mounted provider secrets
