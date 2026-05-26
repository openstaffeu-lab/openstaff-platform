# AI Persistence Audit

Date: 2026-05-26

EXEC-72 makes RELU AI outputs operationally persistent instead of relying on frontend-only state.

## Persistence Contract

Every RELU output must have at least one durable owner:

- `ReluTask`: request, access mode, source entity, input summary, result summary, status, error
- `ReluProcessingRun`: source type/id, trigger user, domain, input snapshot, output, score, fallback, completion status
- `ReluClassificationResult`: taxonomy, extraction, moderation-facing classifications
- `ReluMatchResult`: compatibility and eligibility results
- `ReluRecommendation`: recommendations, generated actions, follow-up triggers
- `ProjectAIInterpretation`: project wizard extraction payload and reviewed state
- `AuditLog`: configuration changes, RELU task execution, overrides, status changes, moderation actions

## Output Matrix

| Output | Generated | Stored | Editable | Moderated | Published | Archived/deleted | Logged |
| --- | --- | --- | --- | --- | --- | --- | --- |
| taxonomy suggestions | `ReluService.classifyPublicPost`, `classifyProfile`, project AI interpretation | `ReluClassificationResult.outputData`, `PublicPost.classificationJson`, taxonomy relation tables, `ProjectAIInterpretation.extractedJson` | admin RELU override, project apply-selected flow, profile edit | `AdminReluController` result status/override, public post moderation | approved public posts/profiles/company pages only | source entity delete cascades where modeled; overrides remain in audit | `AuditLog` RELU actions and correction logs |
| AI summaries | onboarding/profile/project assistants, project wizard, public post ingestion | `ReluTask.resultSummaryJson`, `ReluProcessingRun.outputData`, `ReluClassificationResult.outputData`, `ProjectAIInterpretation.extractedJson` | profile/project editors and admin override | RELU result review and public visibility moderation | public profile/company/project surfaces after approval | entity archive/delete hides public output; audit trail remains | `AuditLog` |
| AI classifications | public post/profile/project classification | `ReluClassificationResult`, `PublicPost.classificationJson`, profile/project taxonomy joins | admin override and project/profile edit | result status and override | public after moderation approval | source deletion removes public entity; result/audit trail remains unless DB retention removes it | `AuditLog` |
| project predictions | project list flash prediction and project AI interpretation | deterministic UI predictions derive from persisted `Project`; AI extraction persists in `ProjectAIInterpretation` and EXEC-72 secured run/result records | project workspace apply-selected controls | project review and RELU admin result review | public project/public post after approval | project archive/delete hides public discovery | project audit and RELU audit |
| extraction results | project document extraction, profile document extraction, public post ingestion | `ProjectDocument.extractedText`, `ProfileDocument.extractedText`, `ProjectAIInterpretation.extractedJson`, `ReluClassificationResult.outputData` | workspace source text and admin override | document/media/post moderation and RELU override | only approved public media/documents render | delete removes local/GCS stored asset and references | upload failure, moderation, and RELU audit |
| moderation recommendations | RELU moderation queue, contract lifecycle, public post ingestion | `ReluRecommendation`, `ReluClassificationResult`, `ReluTask` | admin override | admin result status/override | only approval changes visibility | public entity delete removes public visibility, audit remains | `AuditLog` with `correctionLog` for overrides |
| compatibility scoring | public-post match, taxonomy match, eligibility | `ReluMatchResult.compatibilityPercent`, `score`, `outputData` | admin override | admin result status/override | contact/chat trigger can be created from recommendations | source entity archive hides discovery; result retained | RELU audit |
| flash predictions | project cards | derived from persisted `Project`, taxonomy, budget, dates, and `ProjectAIInterpretation` | project edit | project moderation/review | project cards/public marketplace after approval | project archive/delete | project audit where project changes are logged |

## EXEC-72 Code Changes

- `runSecuredTask` now optionally creates operational `ReluProcessingRun` records and persists secured assistant outputs to classification, match, or recommendation tables.
- Onboarding assistant, profile completion, project interpretation, taxonomy match, eligibility, certification gap, test generation, candidate recommendation, contract lifecycle, and notification generation now receive operational persistence config.
- RELU result status and override operations now log before/after correction metadata.

## Verdict

`PASS`

No RELU output added or touched by EXEC-72 is frontend-only. Some UI-only flash predictions intentionally remain deterministic projections from persisted project fields rather than standalone AI records.
