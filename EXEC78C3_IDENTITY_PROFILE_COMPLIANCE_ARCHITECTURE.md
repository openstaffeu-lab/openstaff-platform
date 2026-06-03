# EXEC-78C.3 Identity, Profile, Compliance, Geography & Publishing Architecture Realignment

Date: 2026-06-03

Status: Architecture, workflow, UX, and readiness audit approved for implementation planning.

Final verdict: `OWNER APPROVED FOR IMPLEMENTATION`

No redesign work, deployment, backend business logic change, permission change, payment change, or RELU core logic change was performed.

## Owner Approval

Owner approval was recorded on 2026-06-03 for implementation planning with the following direction:

1. Account creation must be authentication-only.
2. Account should activate after email verification.
3. Professional Identity, Company Identity, and Both must be supported.
4. Profile, company, and public visibility require approval.
5. RELU AI assists extraction, drafting, taxonomy mapping, compliance analysis, and recommendations.
6. RELU AI never approves, certifies, publishes, or bypasses human review.
7. Manual fallback remains available but should not be the primary profile creation experience.
8. Publishing lifecycle must support Draft, Ready For Review, Submitted, Approved, Published, Live, Paused, Archived, and Deleted.
9. Geography must use OpenStaff canonical IDs enhanced by Google Places, not replaced by Google Places.
10. Compliance wording must remain assistance/readiness only, not legal certification.
11. Password policy should move toward minimum 8 characters plus uppercase, lowercase, and number for new passwords.
12. Email OTP remains default 2FA now; authenticator app is future; SMS OTP requires later cost/privacy approval.

## A. Executive Summary

OpenStaff's current technical foundation is stable enough to continue product architecture work, but the live owner/superadmin testing confirms that the operational model still needs realignment before EXEC-78D implementation.

The main architecture issue is separation of concerns. The current registration flow creates authentication, profile, identity, company identity, onboarding, and subscription records in one transaction. The target model should split these layers:

- Account: authentication and security only.
- Identity: professional, company, or both.
- Profile: public/professional presentation built from approved identity data.
- Compliance: evidence, expiry, eligibility, and human review.
- Publishing: structured opportunities, service offers, contractor requests, and lifecycle state.
- Moderation: human approval for public visibility and compliance-sensitive claims.
- Geography: canonical OpenStaff location IDs enhanced by Google Places, not replaced by it.
- RELU AI: advisory extraction, mapping, drafting, and recommendations only.

Because this blueprint affects compliance handling, moderation rights, publishing rights, identity verification, and future monetization gates, the next implementation step requires owner approval before execution.

## B. Account Architecture

### Current State

Current account registration is implemented in `apps/admin/api/src/auth/auth.service.ts`. It accepts account-level fields plus identity/profile fields, then creates:

- `User`
- `Profile`
- `IdentityProfile`
- optional `IdentityCompanyProfile`
- `OnboardingSession`
- default subscription assignment

The user is currently created with `approvalStatus: PENDING` and `accountStatus: OFFLINE`, which means the account approval gate is doing work that should belong to identity/profile/public visibility approval.

### Target Account Model

Account purpose: authentication only.

Required at account creation:

- email
- password
- preferred language
- country

Optional:

- phone number

Account creation should not require administrative approval. The account should become active after email verification. Administrative approval should move to identity/profile/company/publishing/compliance layers.

### Email Verification

Target model:

1. User registers account.
2. OpenStaff sends verification email or email OTP.
3. Account becomes active after verification.
4. User is routed to identity selection.

Account activation must not imply public trust, verified organization status, compliance approval, or publishing rights.

### Two-Factor Authentication

Current state:

- Email OTP is implemented for setup, login challenge, disable, and recovery-code flows.
- Login can issue a two-factor challenge when settings require it.
- OTP lifetime and lockout controls are configurable.
- SMS OTP is not implemented.
- Authenticator app is not implemented.

Recommended default:

- Default now: Email OTP, optional but encouraged unless admin-enforced.
- Future preferred default: Authenticator app for high-trust accounts, with email OTP as recovery/fallback.
- SMS OTP: optional future channel only after cost, fraud, regional delivery, and privacy decisions are approved.

## C. Identity Architecture

### Current State

The schema already has `IdentityProfile` and `IdentityCompanyProfile`, but registration creates them immediately. This is useful technically, but the workflow should not force identity/profile creation inside account creation.

### Target Identity Choice

After account activation, the user chooses:

- Professional Identity
- Company Identity
- Both

The user should be able to add the second identity later. This avoids locking a founder, recruiter, consultant, contractor, or company representative into one actor type too early.

### Professional Identity

Required:

- display/legal name
- country
- preferred language
- professional role or occupation
- contact route
- identity owner account

Optional:

- phone
- city/locality
- website
- LinkedIn URL
- portfolio URL
- CV
- certificates
- languages
- service areas
- NACE, ESCO, Uniclass mappings

Approval requirement:

- Account activation: no admin approval.
- Professional identity verification: human/admin approval before verified status.
- Public professional profile: visible only after profile/public visibility gates pass.

### Company Identity

Required:

- company display name
- legal name where applicable
- country
- representative/owner account
- registration number or VAT/CUI when applicable
- operating location or registered address

Optional:

- website
- logo
- presentation
- portfolio
- operating countries
- service categories
- NACE, ESCO, Uniclass mappings
- insurance/compliance evidence

Approval requirement:

- Human/admin approval before the company is marked verified.
- Public company page should require company identity approval plus public visibility approval.

### Both

A single account may operate a professional identity and a company identity. The dashboard should clearly show which identity is active for each action: profile editing, company onboarding, publishing, compliance evidence, and moderation status.

## D. RELU Profile Extraction Model

### Target Input Sources

RELU-assisted profile creation should accept:

- CV
- PDF
- certificates
- portfolio
- website
- LinkedIn URL
- company website
- company presentation
- project documentation

### Extraction Output

RELU should extract:

- professional occupations
- skills
- competencies
- experience
- certifications
- languages
- industries
- compliance evidence
- project history

RELU should map extracted information to:

- NACE
- ESCO
- Uniclass

### Confidence and Review

Each extracted field should carry:

- source document/link
- extracted value
- suggested normalized value
- taxonomy mapping
- confidence score
- reason or evidence snippet
- review status

Recommended confidence model:

- High confidence: preselect but require user confirmation.
- Medium confidence: suggest but do not preselect.
- Low confidence: show as review item only.

### Human Approval Flow

1. User uploads source material.
2. RELU extracts and drafts a profile.
3. User reviews, edits, accepts, or rejects each suggestion.
4. User submits the profile or company profile for moderation.
5. Moderator approves, requests changes, or rejects.

RELU remains advisory only. RELU never approves identities, certifies compliance, publishes public content, or bypasses moderation.

## E. Compliance Architecture

### Current State

The platform already has compliance-oriented models and services for actor documents, certifications, medical fitness, compliance alerts, user tasks, verification cases, and worker documents. Current statuses include `PENDING`, `VALID`, `EXPIRED`, `REJECTED`, and `REQUIRES_REVIEW`.

Current document categories are generic enough for a foundation:

- company document
- tax document
- insurance document
- project authority document
- identity document
- NACE activity document
- authorization document
- certificate document
- license document
- training document
- medical document
- other

### Required Regional Scope

OpenStaff should support compliance evidence handling for:

- EU
- UK
- Ireland
- Nordics

Target evidence families:

- A1
- PPS
- CSCS
- Safe Pass
- ID06
- UTR
- CIS
- VCA
- SCC
- SSIP
- SMSTS
- IOSH
- NEBOSH
- First Aid
- Working at Height
- Confined Space
- Fire Safety
- Electrical Safety
- country-specific workforce certifications

### Recommended Storage Model

Each compliance evidence record should track:

- owner user
- professional identity, company identity, worker, project, or contract relation
- country and jurisdiction
- evidence type
- issuing authority
- issue date
- expiration date
- document/file asset
- extracted metadata
- taxonomy relation if relevant
- verification status
- reviewer
- reviewed at
- rejection/change reason
- audit history
- RELU confidence and extraction source

### Validation Model

Validation should have layered responsibility:

- System: file type, date parsing, missing fields, expiration detection, duplicate detection.
- RELU: extraction, classification, summaries, risk hints, missing-evidence suggestions.
- Human reviewer: validity decision and approval boundary.

RELU may analyze, but RELU never certifies. Human approval remains mandatory for verified compliance status.

### Expiration Tracking

Compliance records should trigger:

- expiring-soon alerts
- expired alerts
- project/contract eligibility warnings
- dashboard tasks
- owner and moderator notifications

Expiration alerts should not automatically suspend identities or contracts without an approved policy decision.

## F. Geography Architecture

### Current Coverage

The current baseline country service seeds:

- Romania
- Ireland
- United Kingdom
- Germany
- France
- Italy
- Spain
- Netherlands
- Belgium
- Denmark
- Sweden
- Norway
- Finland
- Greece

Current seeded data includes one or two major regions/cities per country. This is sufficient for readiness proof, but not enough for production-grade geography, regional matching, compliance, or local project discovery.

### Current Schema

Current canonical structure:

- `Country`
- `Region`
- `City`

Missing as first-class canonical layers:

- counties/admin-level-2
- localities/sublocalities
- postal codes
- aliases and multilingual names
- NUTS or equivalent regional codes
- Google place ID mapping
- confidence/review status for external matches

### Recommended Canonical Structure

Recommended OpenStaff geography model:

- Country: ISO 3166 alpha-2 code, name, currency, VAT baseline, active flag.
- Region: canonical admin-level-1, local name, English name, optional NUTS/admin code.
- County/Admin2: county, department, province, district, council area, or equivalent.
- City/Municipality: canonical city or municipality.
- Locality: locality, village, suburb, postal town, sublocality.
- Postal Code: postal code/range linked to country and locality where licensing allows.
- Place Alias: alternative spellings and multilingual names.
- External Place Mapping: Google place ID, provider, confidence, last verified date.

### Google Places Strategy

Google Places should enhance internal geography, not replace it.

Target behavior:

1. User searches a locality.
2. Google returns a structured suggestion.
3. OpenStaff parses country, region, city/locality, formatted address, and coordinates.
4. OpenStaff attempts to map country/region/city to internal IDs.
5. If confidence is high, structured IDs are stored.
6. If matching is partial, selected text is preserved and a review flag is shown.
7. Manual country/region/city/locality entry remains available.

Geography affects feed relevance, regional matching, compliance, currency defaults, VAT behavior, workforce eligibility, project discovery, and RELU recommendations. Therefore internal IDs must remain the authoritative layer for business logic.

## G. Publishing Lifecycle

### Current State

Current public posts use:

- `PublicPostType`: `PROJECT`, `PROFESSIONAL`, `SUBCONTRACTOR_POOL`
- `PublicPostVisibility`: `PUBLIC`, `PRIVATE`
- `PublicModerationStatus`: `PENDING`, `APPROVED`, `REJECTED`, `FLAGGED`
- free-form `status` values such as `PENDING_MODERATION`, `LIVE`, and `REJECTED`

Public readers see only posts that are public, approved, and live. This is correct as a safety gate, but the lifecycle needs a clearer product state machine.

### Target Lifecycle

Required lifecycle:

Draft

Ready For Review

Submitted

Approved

Published

Live

Paused

Archived

Deleted

### State Ownership

Draft:

- Controlled by owner.
- Not public.

Ready For Review:

- Controlled by owner.
- Means the post has passed required local validation and can be submitted.

Submitted:

- Controlled by system after owner action.
- Creates moderation task.

Approved:

- Controlled by moderator/admin.
- Means content is approved, but does not necessarily mean publicly live if owner has not published it or identity gates are blocked.

Published:

- Controlled by owner or system according to approved policy.
- Means approved content is scheduled or released into the public channel.

Live:

- Controlled by visibility gates.
- Requires approved moderation, public visibility, active/approved required identity gates, and no blocking compliance policy.

Paused:

- Controlled by owner or moderator.
- Temporarily hidden but recoverable.

Archived:

- Controlled by owner or moderator.
- Hidden from active feed but retained for records.

Deleted:

- Controlled by owner or moderator according to retention policy.
- Prefer soft delete unless legal/product policy requires hard delete.

### Publishing Rights

Owner approval is required to decide:

- whether unverified accounts can draft
- whether unverified identities can submit
- whether approved identity is required before publishing
- whether company identity is required for project/procurement posts
- whether compliance readiness affects public visibility
- whether paid tiers affect active post counts or publishing permissions

## H. Dashboard Architecture

### Current Dashboard Issue

EXEC-78C.2 improved dashboard state clarity, but the dashboard should now be realigned as an operating console rather than a collection of status cards.

### Target Post-Approval Dashboard Actions

After approval, users should clearly see:

- Create Opportunity
- Create Project
- Create Service Offer
- Create Contractor Request
- Create Workforce Request
- Manage Published Content
- Review Public Profile
- Review Company Page

### Dashboard State Groups

Recommended dashboard structure:

- Account security: email verified, 2FA state, password health.
- Identity readiness: professional/company/both, verification state.
- Profile readiness: completion, moderation, visibility.
- Company readiness: onboarding, verification, VAT/registration review.
- Compliance readiness: evidence gaps, expiring documents, country-specific tasks.
- Publishing: drafts, submitted posts, live posts, rejected/action-required posts.
- RELU AI: pending suggestions, extraction drafts, review queue.

### Navigation Audit

Current navigation has overlapping workspaces:

- `/dashboard`
- `/profile`
- `/onboarding/company`
- `/publish`
- `/companies`
- `/professionals`
- project/workspace routes
- security/two-factor routes

Target navigation should reduce dead ends by making `/dashboard` the operational hub and keeping public directory routes separate from owner work routes.

## I. Public Visibility Model

### Current Issue

The generic unavailable message was improved in EXEC-78C.2, but the product architecture should standardize all visibility states across profiles, companies, and posts.

### Profile Visibility States

Recommended profile status model:

- Account email verification pending.
- Account active.
- Professional identity draft.
- Professional identity submitted.
- Professional identity approved.
- Profile incomplete.
- Profile submitted for moderation.
- Profile approved.
- Profile private/offline.
- Public profile live.
- Changes requested.
- Rejected.
- Suspended.

Suggested public unavailable copy:

Profile Status

- Profile completed
- Verification completed
- Administrative review pending

Estimated review time: 24-48 hours

### Company Visibility States

Recommended company status model:

- Company identity draft.
- Company verification pending.
- VAT/registration review pending.
- Company profile incomplete.
- Company profile submitted.
- Company profile approved.
- Company private/offline.
- Public company page live.
- Changes requested.
- Rejected.
- Suspended.

### Post Visibility States

Recommended post status model:

- Draft.
- Ready for review.
- Submitted.
- Pending moderation.
- Approved.
- Published.
- Live.
- Paused.
- Archived.
- Rejected.
- Deleted.

Public visibility should never depend on a single status alone. It should be computed from identity, profile/company, moderation, lifecycle, compliance policy, and visibility settings.

## J. Security & Password Audit

### Current Findings

Backend registration password requirement:

- `apps/admin/api/src/auth/dto/register.dto.ts` uses `@MinLength(8)`.

Password reset and account recovery:

- reset and recovery DTOs use `@MinLength(8)`.

Frontend visible copy:

- `/register` shows `Minimum 8 characters`.
- `/login` shows `Minimum 8 characters`.
- `/reset-password` shows `Minimum 8 characters`.

Login DTO:

- `apps/admin/api/src/auth/dto/login.dto.ts` still uses `@MinLength(6)`.

Two-factor disable DTO:

- `apps/admin/api/src/auth/dto/disable-two-factor.dto.ts` uses `@MinLength(6)` for current-password confirmation.

Interpretation:

- User-facing copy is aligned to 8 characters.
- New password creation/reset is aligned to 8 characters.
- Login/current-password validation remains permissive at 6, likely to avoid blocking legacy credential checks before bcrypt comparison.

### Recommended Unified Standard

Preferred baseline:

- minimum 8 characters
- uppercase
- lowercase
- number

Recommended implementation decision:

- Enforce complexity on new password creation, reset, and account recovery.
- Do not reject login solely on length before bcrypt comparison, to avoid leaking policy hints and avoid breaking legacy credentials.
- During next successful login, prompt users with weak legacy passwords to update their password.

## K. Manual Fallback Strategy

Manual forms must remain available, but manual entry should not be the primary profile creation workflow.

### AI-Assisted Primary Fields

Recommended AI-assisted fields:

- professional headline
- summary
- occupations
- skills
- competencies
- languages
- experience history
- project history
- certifications
- service areas
- company description
- company industries
- taxonomy suggestions
- compliance evidence classification
- publishing draft content

### Manual Fallback Fields

Manual fallback should remain available for:

- account email
- password
- preferred language
- country
- phone
- identity selection
- legal names
- registration/VAT data
- public/private visibility
- structured address corrections
- taxonomy corrections
- final content edits
- compliance document metadata corrections

### Fields Requiring Approval

Approval must remain required for:

- verified professional identity
- verified company identity
- public professional profile
- public company profile
- compliance evidence validity
- public posts
- public media/documents
- RELU-generated profile and publishing content before use

## L. Risks

1. Account approval currently overlaps with identity/profile approval. Migrating this behavior requires careful production data handling.
2. Splitting account and identity models may affect onboarding, dashboard, notifications, subscription assignment, and approval queues.
3. Compliance evidence handling creates legal and operational risk if OpenStaff wording implies certification instead of readiness/assistance.
4. Geography datasets need licensing and canonical-source decisions before full production import.
5. Google Places can improve locality selection but cannot be the source of truth for compliance, VAT, currency, or procurement rules.
6. Publishing lifecycle expansion may require schema changes and migration planning.
7. RELU extraction from documents introduces privacy, retention, consent, and provider-cost risks.
8. SMS OTP introduces cost, fraud, delivery, and privacy tradeoffs.
9. Password complexity changes may require legacy account transition handling.
10. Monetization limits may intersect with publishing rights, contact rights, RELU quotas, compliance workflows, and Enterprise boundaries.

## M. Required Product Decisions

Owner approval is required for:

1. Account activation policy: account active after email verification, with no admin approval.
2. Identity approval policy: which identities require human verification before public actions.
3. "Both" identity support: whether one account can operate professional and company identities simultaneously.
4. Public publishing rights: which account/identity states can draft, submit, publish, pause, archive, or delete.
5. Company requirements: whether company identity is mandatory for project, procurement, contractor, and workforce request posts.
6. Compliance wording: exact public and dashboard language for readiness, verification, evidence, and eligibility.
7. Compliance reviewer authority: who can mark evidence valid, rejected, expired, or requiring review.
8. Geography source of truth: canonical dataset provider, licensing model, and Google Places mapping policy.
9. RELU confidence thresholds: when suggestions are preselected, shown, hidden, or escalated for review.
10. Password policy: whether uppercase/lowercase/number complexity is approved for all new passwords.
11. 2FA roadmap: email OTP default now, authenticator app future, SMS optional only if approved.
12. Monetization boundaries: whether post counts, verification, compliance workflows, or RELU extraction are tiered.

## N. Recommended Next Implementation Order

1. Owner approves or revises this architecture blueprint.
2. Define account activation and email verification behavior.
3. Design the identity selection workflow for Professional, Company, and Both.
4. Separate account approval from identity/profile/company/public visibility gates.
5. Create the RELU-assisted profile extraction review model.
6. Define canonical geography data structure and mapping rules.
7. Define compliance evidence types, jurisdictions, reviewer roles, and wording.
8. Implement publishing lifecycle state machine and transition permissions.
9. Realign dashboard around account, identity, profile, compliance, publishing, and RELU work queues.
10. Standardize public visibility reason models for profile, company, and post pages.
11. Apply unified password complexity to new password flows with legacy-safe login behavior.
12. Run owner/superadmin proof before real data population resumes.

## O. Final Verdict

`OWNER APPROVED FOR IMPLEMENTATION`

The blueprint is approved for the next implementation sequence. Implementation should proceed in controlled phases, starting with account/identity separation and preserving all human approval, moderation, compliance, payment, permission, and RELU advisory boundaries.
