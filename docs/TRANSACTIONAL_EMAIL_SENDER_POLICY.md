# Transactional Email Sender Policy

Last updated: 2026-05-22

## Intended Sender Contract

- primary transactional sender: `no-reply@openstaff.eu`
- support mailbox: `support@openstaff.eu`
- contact mailbox: `contact@openstaff.eu`
- operational mailbox visibility may also involve `office@openstaff.eu`
- privacy and compliance contact remains `gdpr@openstaff.eu`

## Allowed Transactional Use

- password reset
- onboarding confirmations
- moderation notices
- security notices
- account or notification workflow delivery

## Sender Policy Rules

- transactional delivery must use a mounted provider or SMTP contract, not hardcoded credentials
- `EMAIL_FROM` must resolve to the verified transactional sender identity
- support and contact mailboxes may appear in reply-to or help copy, but not as hidden provider substitutions
- provider secrets may not be logged, committed, or exposed through `/status`

## Deliverability Readiness Reality

As of `2026-05-22`:

- mailbox identities may exist operationally
- production still has no mounted transactional email provider secret
- `_dmarc.openstaff.eu` returns `v=DMARC1; p=none;`
- no visible SPF TXT record was confirmed at `openstaff.eu` in this execution
- DKIM could not be proven without the actual provider selector

So sender-policy closure is still blocked by:

1. real provider or SMTP runtime credentials
2. Secret Manager injection
3. Cloud Run mounting
4. verified sender identity
5. stronger deliverability proof

## EXEC-57 Revalidation

No runtime sender activation occurred in EXEC-57. This document remains a policy and blocker snapshot, not a claim of live transactional-delivery closure.
