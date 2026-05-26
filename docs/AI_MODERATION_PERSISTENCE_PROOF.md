# AI Moderation Persistence Proof

Date: 2026-05-26

## What Persists

- RELU requests persist in `ReluTask`.
- RELU execution state persists in `ReluProcessingRun`.
- Classification, match, and recommendation outputs persist in dedicated result tables.
- Moderator status changes persist `status`, `reviewedByUserId`, and `reviewedAt`.
- Moderator overrides persist `overrideData`, changed score/explanation fields, `reviewedByUserId`, and `reviewedAt`.
- Correction logs persist in `AuditLog` with `correctionLog: true` and before/after payloads.

## Operational Actions

| Action | Persistence proof |
| --- | --- |
| approve/review RELU result | `PATCH /admin/relu/results/:id/status` updates result state and writes audit before/after |
| override RELU result | `PATCH /admin/relu/results/:id/override` stores override data and audit correction trail |
| rerun RELU action | new task/run/result records are appended; previous overrides are not overwritten |
| approve/reject public post | `PATCH /admin/public-posts/:id/status` updates visibility/status and writes marketplace moderation audit |
| approve/reject media/document | `PATCH /admin/public-post-media/:id/status` and `/admin/public-post-documents/:id/status` write moderation audit |
| auto-approve eligibility | backoffice UI can identify candidates; operational approval still writes the same moderation state and audit event |

## Governance Notes

- The correction trail is append-only at the audit-log level.
- RELU output remains traceable to source type/id and triggered user.
- Fallback state is explicit through `fallbackUsed` and `errorMessage`.
- Public visibility is not controlled by AI confidence alone; approval and lifecycle state remain required.

## Verdict

`PASS`

AI moderation has durable state, durable correction logs, and audit-friendly before/after evidence.
