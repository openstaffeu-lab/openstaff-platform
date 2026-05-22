# EXEC-57 Proof

Last updated: 2026-05-22

## Summary

EXEC-57 did not fake transactional email activation. It revalidated the real production blocker state and confirmed that the remaining closure gap is still entirely external to the codepath: missing provider runtime secrets plus incomplete DNS hardening.

## Runtime Truth

- Secret Manager still exposes no email-provider secrets
- Secret Manager still exposes no Romanian-provider secrets
- `openstaff-api` still mounts no transactional email envs
- `openstaff-api` still mounts no Romanian provider envs
- `/status` still reports `integrations.emailDelivery.mode = not_configured`

## DNS Truth

- MX resolves to `openstaff.eu`
- `_dmarc.openstaff.eu` still returns `v=DMARC1; p=none;`
- no visible SPF TXT record was confirmed
- DKIM could not be verified honestly

## What Could Not Be Proven

1. real delivered password-reset email
2. usable reset link from delivered email
3. expired-token rejection from delivered flow
4. reused-token rejection from delivered flow
5. old-password rejection after successful reset
6. new-password login success after successful reset
7. provider-backed Romanian company autofill

## Verdict Basis

EXEC-57 remains blocked by missing provider activation inputs and incomplete DNS deliverability hardening, not by a newly discovered code defect.
