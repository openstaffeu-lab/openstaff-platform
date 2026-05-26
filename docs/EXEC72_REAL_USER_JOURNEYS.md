# EXEC-72 Real User Journeys

Date: 2026-05-26

## Flow A: Professional

1. Register/login through public auth.
2. Complete identity and profile onboarding.
3. Upload CV or portfolio through `/profile`.
4. Run RELU profile enrichment/classification.
5. Moderator approves public profile.
6. Public profile renders at `/profiles/:slug`.

Persistence proof:

- `User`, `IdentityProfile`, `Profile`, `ProfileDocument`
- `ReluTask`, `ReluProcessingRun`, `ReluClassificationResult`
- `AuditLog`

## Flow B: Contractor Company

1. Create company profile through company onboarding.
2. Run CUI/company lookup where provider data is available.
3. Create or publish project/public post.
4. Upload PDFs/images/video.
5. Run RELU extraction/classification.
6. Moderator approves project/media/documents.
7. Public company page renders approved company projects at `/companies/:slug`.

Persistence proof:

- `IdentityCompanyProfile`, `Profile`, `PublicPost`, `PublicPostMedia`, `PublicPostDocument`
- `Project`, `ProjectDocument`, `ProjectAIInterpretation`
- RELU result tables and moderation `AuditLog`

## Flow C: Subcontractor Discovery

1. Browse public professionals/projects.
2. Use conversational search mapping in authenticated project dashboard.
3. Run taxonomy match or eligibility.
4. Store compatibility in `ReluMatchResult`.
5. Generate recommendation/contact follow-up in `ReluRecommendation`.
6. Contact/chat trigger is created from recommendation context where applicable.
7. Pricing/upsell remains tied to subscription feature/contact limits.

## Browser Proof Boundary

Local build proof is complete. Full live credentialed browser journeys still require reusable test accounts, mailbox access, and production data cleanup approval.

## Verdict

`PASS locally for implementation and persistence`, with live multi-account journey proof pending operator credentials.
