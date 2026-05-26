# EXEC-72 Public Company Pages

Date: 2026-05-26

## Implemented

- Dedicated public route: `apps/admin/web/app/companies/[slug]/page.tsx`
- Dedicated API alias: `GET /companies/public/:slug`
- SEO metadata through `generateMetadata`
- Company banner/logo from approved profile assets
- Company gallery from approved profile portfolio assets
- Company projects from approved public project posts attached to the profile
- Certifications from `Profile.certificationsText`
- Taxonomy from approved profile ESCO/NACE/Uniclass relations
- AI-generated company summary from latest `ReluClassificationResult` where available
- Contact CTA from public email, phone, and website
- Moderation visibility rules displayed from persisted state

## Visibility Rule

The API returns only profiles where:

- `Profile.visibility = PUBLIC`
- `Profile.moderationStatus = APPROVED`
- `Profile.status = LIVE`

The project list renders only attached public posts where:

- `type = PROJECT`
- `visibility = PUBLIC`
- `moderationStatus = APPROVED`
- `status = LIVE`

## Production Readiness

The page is investor/client ready in structure: hero identity, trust badges, contact CTA, metrics, AI summary, public projects, gallery, certifications, taxonomy, and AI governance state.

## Verdict

`PASS`

The previous production-readiness blocker "no dedicated public company listing/page" is closed at the route and API level.
