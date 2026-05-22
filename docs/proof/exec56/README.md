# EXEC-56 Proof

Last updated: 2026-05-22

## Summary

EXEC-56 did not fake provider activation. It improved the public web auth contract, re-audited production runtime truth, and clarified the real email deliverability posture, while keeping the final verdict blocked by missing provider secrets and incomplete DNS hardening.

## Runtime Truth

- `gcloud secrets list --project openstaff-platform` still shows no email-provider or Romanian-provider secrets
- `gcloud run services describe openstaff-api --region europe-west1 --project openstaff-platform --format=json` still shows no provider env mounts
- `GET https://api.openstaff.eu/status` still reports `integrations.emailDelivery.mode = not_configured`

## Auth Noise Progress

- `apps/admin/web/lib/api.ts` now avoids refresh cascades when no real refresh token exists
- targeted clean-anonymous browser proof on promoted `openstaff-web-00020-wtl` returned no `401`, no `4xx/5xx`, no console errors, and no page errors across Chrome desktop, Edge desktop, and mobile Chrome
- targeted stale-access-token browser proof returned no `401`, no `4xx/5xx`, no console errors, and no page errors
- only navigation-aborted requests were observed during route changes

## Deploy Proof

- web build `ca45df68-113b-40b1-9c2d-a1f173c6464c`
- latest ready web revision `openstaff-web-00020-wtl`
- latest ready API revision `openstaff-api-00014-tfr`

## DNS Snapshot

- MX currently resolves to `openstaff.eu`
- `_dmarc.openstaff.eu` currently returns `v=DMARC1; p=none;`
- no visible SPF TXT record was confirmed at `openstaff.eu`
- DKIM could not be proven without the active provider selector

## What Remains Blocked

1. no mounted transactional email provider
2. no mounted Romanian provider
3. no live password-reset delivery proof
4. no provider-backed Romanian autofill proof
5. no final browser matrix on the activated provider-backed runtime
6. no production-safe email sender proof while SPF/DKIM/DMARC remain incomplete
