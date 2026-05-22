# Email Provider Operator Handoff

Last updated: 2026-05-22

## Goal

This handoff defines what the operator must procure and verify before OpenStaff can activate live transactional email delivery for password recovery in production.

## Current State

- code support exists for `EMAIL_PROVIDER`, `EMAIL_API_KEY`, provider-specific API keys, and `SMTP_URL`
- production Secret Manager still contains no transactional email provider secret
- `/status.integrations.emailDelivery.mode` remains `not_configured`

## Required Operator Inputs

### Required env contract

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- one of:
  - `SMTP_URL`
  - `RESEND_API_KEY`
  - `SENDGRID_API_KEY`
  - `POSTMARK_SERVER_TOKEN`
  - `MAILGUN_API_KEY`
- if `EMAIL_PROVIDER = mailgun`: `MAILGUN_DOMAIN`

### Required operational access

- access to provider delivery logs or dashboard
- proof that the sender identity is verified
- confirmation that the provider account is not sandbox-limited for the target inbox

## Procurement Notes By Provider

### Resend

- requires verified sender domain or verified sender identity
- API key required
- operator should confirm any sandbox or recipient restrictions

### SendGrid

- requires API key and verified sender or authenticated domain
- operator should confirm account reputation and sending limits

### Postmark

- requires server token
- requires approved sender signature or domain
- operator should confirm whether the chosen server is allowed for password-recovery mail

### Mailgun

- requires API key and domain
- requires DNS verification
- operator should confirm region-specific endpoint expectations if applicable

### SMTP provider

- requires a working `SMTP_URL`
- operator should confirm TLS requirements and whether the SMTP account is authorized for the sender identity

## Password Reset Proof Requirements After Injection

The operator handoff is not complete until EXEC-50 can verify:

1. forgot-password request succeeds
2. email arrives in the approved inbox
3. reset link works
4. old password fails after reset
5. new password succeeds after reset
6. reused token fails
7. invalid token fails
8. throttling and audit/security logs remain healthy

## Missing Today

Selected provider: `MISSING`  
Sender identity: `MISSING`  
Provider credential: `MISSING`  
Delivery-log access: `MISSING`
