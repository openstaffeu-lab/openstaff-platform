# Provider Procurement Checklist

Last updated: 2026-05-22

## Purpose

This checklist captures the exact external provider decisions and operator-supplied inputs required before OpenStaff can complete provider-backed onboarding proof in production.

## Transactional Email Provider

Selected provider status: `MISSING`

Choose one:

- `Resend`
- `SendGrid`
- `Postmark`
- `Mailgun`
- `SMTP provider`

Operator must provide:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- one of:
  - `SMTP_URL`
  - `RESEND_API_KEY`
  - `SENDGRID_API_KEY`
  - `POSTMARK_SERVER_TOKEN`
  - `MAILGUN_API_KEY`
- if `Mailgun` is selected: `MAILGUN_DOMAIN`
- provider dashboard access or delivery-log visibility
- verified sender identity or verified sending domain

Operator must confirm:

- sender domain
- sender email
- sending limits or sandbox restrictions
- current provider verification status
- SPF status
- DKIM status
- DMARC status

## Romanian Company Lookup Provider

Selected provider status: `MISSING`

Choose one trusted provider:

- `ANAF-compatible provider`
- `Termene.ro API`
- `ListaFirme API`
- `other trusted Romanian registry provider`

Operator must provide:

- `ROMANIAN_COMPANY_LOOKUP_URL`
- `ROMANIAN_COMPANY_LOOKUP_API_KEY`
- provider documentation link
- allowed production test CUI/VAT values
- rate-limit expectations
- timeout expectations
- supported response fields

Operator must confirm:

- whether provider supports company legal name
- whether provider supports address
- whether provider supports city/locality
- whether provider supports VAT status
- whether provider supports registration number or registry metadata
- whether provider has explicit commercial or privacy restrictions for test lookups

## Test Data Pack

Operator must also provide or approve:

- one accessible password-reset inbox
- one valid Romanian CUI/VAT value for testing
- one invalid Romanian CUI/VAT test case
- one company onboarding test account
- one professional onboarding test account
- one admin or SUPERADMIN validation path

## Completion Rule

EXEC-50 may start only after all required email-provider values, Romanian-provider values, and test data are supplied or approved by the operator.
