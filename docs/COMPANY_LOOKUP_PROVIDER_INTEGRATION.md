# Company Lookup Provider Integration

Last updated: 2026-05-20

## Live Lookup Paths

The onboarding company lookup flow now supports two live provider paths:

1. Romania
2. EU VAT

## Romania

Romanian company lookup now supports a configured provider abstraction through:

- `ROMANIAN_COMPANY_LOOKUP_URL`
- `ROMANIAN_COMPANY_LOOKUP_API_KEY`

Fallback compatibility aliases:

- `COMPANY_LOOKUP_PROVIDER_URL`
- `COMPANY_LOOKUP_PROVIDER_API_KEY`
- `ANAF_LOOKUP_URL`
- `ANAF_LOOKUP_API_KEY`

Expected provider result fields:

- company name
- legal name
- registration number
- VAT / fiscal identifier
- address
- city
- postal code
- VAT payer state
- legal status

## EU VAT

EU VAT validation now uses the official European Commission VIES service.

The implementation validates:

- country code
- VAT body
- validity state
- provider-returned company name
- provider-returned address
- provider request date when available

## User Experience

The onboarding UI now preserves:

- lookup status
- provider label
- trusted-source indicator
- lookup timestamp
- legal status when available
- manual override at all times

## Operational Truth

The VIES integration is code-live once deployed.

Romanian deep company lookup still depends on production configuration of a trusted provider endpoint. Without that provider configuration, Romanian lookup can only fall back to baseline records or VIES-style VAT validation where applicable.
