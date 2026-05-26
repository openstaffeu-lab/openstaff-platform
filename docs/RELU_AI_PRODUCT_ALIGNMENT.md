# RELU AI Product Alignment

EXEC-71 aligns OpenStaff as an AI-Driven Procurement & Staffing Ecosystem for Industrial, Construction, and Tourism/HORECA work.

## Operational Positioning

- Public homepage metadata and hero copy identify OpenStaff as RELU AI-powered procurement, staffing, contractor matching, and moderated workspace software.
- Public project cards expose RELU match percentage, fit label, confidence context, duration/budget/risk/certification summaries, and moderated public visibility.
- Authenticated project workspaces preserve structured project data, taxonomy, documents, AI interpretation, and moderation state.
- Backoffice RELU moderation exposes persisted runs, extracted structures, raw snapshots, confidence, override/correction logs, and auto-approve eligibility.

## Parity Rule

Every AI-generated artifact must retain:

- source entity type and id
- moderation/review status
- visibility state
- input snapshot
- generated output
- confidence/score
- fallback flag
- override data
- reviewed-by metadata when moderated

## Current Implementation Proof

- Public: `apps/admin/web/app/page.tsx`, `apps/admin/web/components/JobCard.tsx`
- Workspace: `apps/admin/web/app/projects/page.tsx`, `apps/admin/web/components/projects/ProjectWorkspaceForm.tsx`
- Pricing: `apps/admin/web/app/pricing/pricing-page-client.tsx`
- Backoffice: `apps/admin/app/admin/relu/page.tsx`
- API persistence: `apps/admin/api/src/relu/relu.service.ts`, `apps/admin/api/prisma/schema.prisma`

## EXEC-72 Operational Closure

- Secured RELU assistant flows now persist operational `ReluProcessingRun` rows plus classification, match, or recommendation records.
- Public company pages are now first-class marketplace surfaces at `/companies/:slug`.
- Public company pages use only approved profile state, approved media, and approved public project posts.
- RELU moderation overrides and public-post moderation actions now create before/after audit events.
- Persistence details are indexed in `docs/AI_PERSISTENCE_AUDIT.md` and `docs/AI_MODERATION_PERSISTENCE_PROOF.md`.
