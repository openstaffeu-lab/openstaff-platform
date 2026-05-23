# Account Reset Eligibility Proof

Last updated: 2026-05-23

## Scope

EXEC-59 added an operator-safe way to answer one production question without creating a public
account-enumeration vulnerability:

Which OpenStaff accounts are actually eligible for password reset?

## Operator Tooling

The repo now includes:

- `apps/admin/api/scripts/exec-59-account-inventory.js`

The script supports:

- masked emails by default
- optional `--full-emails` only for trusted operator CLI use
- optional `--email=<value>` lookup
- JSON output for operational proof trails

## Eligibility States

The inventory and auth flow now share the same internal classifications:

- `eligible_password_reset`
- `not_found`
- `disabled`
- `external_auth_only`
- `missing_email`
- `unknown_auth_state`

## Live Production Proof

Fresh EXEC-59 production proof from one-off job
`openstaff-api-exec59-account-summary-cx69v` reported:

- `totalAccounts = 86`
- `eligibilityCounts = { eligible_password_reset = 86 }`

Targeted live lookups confirmed:

- `mydarrin.hbp@gmail.com -> eligible_password_reset`
- `exec59-missing@openstaff.eu -> not_found`

The live proof also preserved masked output for routine operator review.

## Security Boundary

Public forgot-password still stays enumeration-safe:

- eligible existing email -> neutral `200`
- missing email -> neutral `200`
- same public wording for both

Only operator-safe logs and CLI tooling reveal the true internal eligibility result.
