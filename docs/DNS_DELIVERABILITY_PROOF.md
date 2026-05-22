# DNS Deliverability Proof

Last updated: 2026-05-22

## EXEC-57 Live DNS Snapshot

Fresh DNS checks during EXEC-57 returned:

- `nslookup -type=MX openstaff.eu` -> `MX preference = 0, mail exchanger = openstaff.eu`
- `nslookup -type=TXT _dmarc.openstaff.eu` -> `v=DMARC1; p=none;`

No visible SPF TXT record was confirmed at `openstaff.eu` in this execution.

DKIM could not be verified honestly because no active provider selector or provider verification contract was available to inspect.

## Honest Outcome

Mailbox presence is not enough for production-grade transactional delivery.

Deliverability hardening is still blocked by:

1. SPF proof not confirmed
2. DKIM not verified
3. DMARC policy still at `p=none`
4. no active mounted provider runtime to validate end-to-end delivery
