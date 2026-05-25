# Live <-> Backoffice Alignment Matrix - EXEC-68

Date: 2026-05-25

| Entity | Public Live | Authenticated Workspace | Backoffice | Parity Verdict |
| --- | --- | --- | --- | --- |
| User account | READ through session-aware surfaces | READ/UPDATE security settings; logout visible | READ/UPDATE approval, role, account status, trust actions; logout visible | PARTIAL: delete/archive and session revoke need backoffice parity. |
| Professional profile | READ at `/profiles/[slug]`, `/professionals/[id]` | CREATE/UPDATE/SAVE profile, CV, certifications, skills, media via `/profile` and profile subresources | READ/MODERATE through users/professionals; no full edit/create/delete | PARTIAL. |
| Company profile | READ through public posts/profiles where available | CREATE/UPDATE company onboarding/profile fields | READ/MODERATE fragmented across users/posts/onboarding | PARTIAL. |
| Subcontractor company | READ in marketplace/professional pools | CREATE/UPDATE as profile/public post | READ/MODERATE through posts/users | PARTIAL. |
| Project | READ public project/job pages | CREATE/UPDATE/SAVE docs/conditions/job requests/AI interpretation | READ and adjacent moderation/hiring/workforce controls | PARTIAL. |
| Media | READ public assets | UPLOAD/PREVIEW/SAVE metadata for profiles/public posts/projects | APPROVE/REJECT/FLAG public-post media | PARTIAL: replace/delete missing in backoffice. |
| Documents | READ/download where exposed | UPLOAD/PREVIEW/EXTRACT/DELETE profile/project documents | APPROVE/REJECT/FLAG public-post documents | PARTIAL: replace/delete missing in backoffice. |
| Banners | READ on public profiles/posts | UPLOAD as profile/public-post media | MODERATE public-post media | PARTIAL: direct admin replace missing. |
| Avatars | READ on public profiles where asset exists | UPLOAD as profile photo | Indirect moderation only | PARTIAL. |
| RELU-generated content | READ where saved on project/profile/post | GENERATE/APPLY for project interpretation and profile/post content | REVIEW/OVERRIDE/RERUN RELU results | WORKING/PARTIAL: entity-local save/discard is not universal. |
| Trust/security state | READ limited trust indicators | 2FA setup, recovery, logout, password reset | Trust action, require 2FA, clear lock, audit/security events | WORKING/PARTIAL: session revoke missing. |

## Lifecycle Coverage

| Action | Live/Workspace | Backoffice | Verdict |
| --- | --- | --- | --- |
| CREATE | Profiles, posts, projects, documents, messages | Users indirectly, workforce/payroll/imports; not full profiles/projects | PARTIAL |
| READ | Broad public and authenticated reads | Broad admin reads | WORKING |
| UPDATE | Profiles, projects, posts, settings, documents metadata | Roles, users, moderation, taxonomy, RELU, billing, workflows | PARTIAL |
| DELETE | Profile/project/public-post docs and posts in selected flows | Limited; media/profile/project delete missing | PARTIAL |
| SAVE | Profile, project, post, settings saves are API-backed | Many admin saves are API-backed; some views read-only | PARTIAL |
| PUBLISH/UNPUBLISH | Public post/project status supported in live flows | Admin post status moderation exists | PARTIAL |
| APPROVE/REJECT | User-facing verification submits | Admin users, verification, media, comments, reviews, hiring | WORKING |
| ARCHIVE | Some project/status workflows | Limited backoffice archive controls | PARTIAL |

