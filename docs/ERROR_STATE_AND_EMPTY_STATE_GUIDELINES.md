# Error State And Empty State Guidelines

Date: 2026-05-26

## EXEC-73 Standard

Backoffice error states must:

- stay inside the current page layout
- preserve navigation
- use compact inline warnings
- provide retry actions where useful
- avoid large destructive error panels
- avoid exposing stack, transport, or infrastructure details
- keep mobile scroll stable

Backoffice empty states must:

- explain the operational meaning of no data
- tell the operator what will populate the view
- avoid API/debug language
- use the same card and spacing system as populated states

## Applied Pages

- Countries & VAT: inline warning and retry; layout remains intact.
- Projects: loading, empty, unauthorized, and error states no longer expose local testing or raw payload language.
- Media & Documents: empty queues are compact and queue-specific.
- RELU Moderation: no-match state is compact and business-readable.

## Verdict

`PASS`

EXEC-73 establishes a safer error and empty-state pattern for operational admin pages.
