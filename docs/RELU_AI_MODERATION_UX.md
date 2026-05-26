# RELU AI Moderation UX

Date: 2026-05-26

## EXEC-73 Changes

The RELU moderation page was converted from a raw data review surface into a business workflow.

Normal moderation now shows:

- source summary
- uploaded-file/document counts
- AI interpretation summary
- matched category
- confidence badge
- low-confidence warning
- auto-approve candidate badge
- approve, reject, adjust category, rerun RELU actions
- correction log
- AI audit trail summary

Removed from the normal moderation workflow:

- giant raw JSON containers
- raw input snapshots as visible payload dumps
- source IDs as headings
- target IDs as labels
- storage and implementation payload language

## Moderator Flow

1. Review submitted source summary.
2. Confirm RELU interpretation and confidence.
3. Approve, reject, or adjust category.
4. Use rerun only when the source entity needs a fresh RELU pass.
5. Correction trail persists through audit events and override data.

## Verdict

`PASS`

RELU moderation now preserves AI power while presenting it as an auditable business workflow.
