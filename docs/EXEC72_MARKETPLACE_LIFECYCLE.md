# EXEC-72 Marketplace Lifecycle

Date: 2026-05-26

## Professional

| Stage | Operational path |
| --- | --- |
| create/onboarding | `/onboarding/*`, `/profile`, `Profile`, `IdentityProfile`, `OnboardingSession` |
| AI enrichment | `/relu/profiles/:id/enrich`, `/relu/profiles/:id/classify`, `ReluProcessingRun`, `ReluClassificationResult` |
| moderation | `Profile.visibility`, `Profile.moderationStatus`, `Profile.status`, RELU admin result review |
| public visibility | `/profiles/:slug` only renders `PUBLIC + APPROVED + LIVE` profiles |
| edit | `PUT /profile` resets non-admin edits to pending/offline review rules |
| media upload | `ProfileDocument`, asset kinds `LOGO`, `PHOTO`, `BANNER`, `CV`, `PORTFOLIO` |
| archive/delete | document delete removes stored file and profile asset reference; profile visibility/status hides public surface |

## Company

| Stage | Operational path |
| --- | --- |
| create/onboarding | `/onboarding/company-profile`, `IdentityCompanyProfile`, `/profile` company fields |
| CUI enrichment | `/onboarding/company-lookup` with provider/audit evidence |
| AI enrichment | profile RELU enrichment/classification result tables |
| moderation | profile visibility/moderation/lifecycle gates |
| public company page | new `/companies/:slug` route backed by `GET /companies/public/:slug` |
| edit | `PUT /profile` and onboarding company update paths |
| banner/logo/media | `ProfileDocument` asset kinds and public asset gate |
| archive/delete | profile state hides public page; document delete removes references |

## Project

| Stage | Operational path |
| --- | --- |
| create | `/projects/new`, `Project`, job requests, conditions |
| upload docs/media | `ProjectDocument`, public-post media/documents for marketplace posts |
| RELU extraction | `ProjectAIInterpretation`, `ReluProcessingRun`, `ReluClassificationResult` |
| moderation | project/public-post/admin moderation paths |
| publish | public post/project status and visibility gates |
| public discovery | `/projects`, `/jobs`, `/public-posts`, `/companies/:slug` company project list |
| edit/update | project workspace and public post update |
| archive/delete | `Project.status = ARCHIVED` or public-post delete hides discovery and clears stored public-post assets |

## Verdict

`PASS`

Professional, company, and project lifecycles have persistent entities, moderation gates, public visibility rules, and media/document persistence paths.
