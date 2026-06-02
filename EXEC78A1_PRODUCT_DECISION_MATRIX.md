# EXEC-78A.1 Product Decision Matrix

Last updated: 2026-06-01

Verdict: `REQUIRE OWNER APPROVAL`

## A. Executive Summary

EXEC-78A.1 converts the open decisions from EXEC-78A into an approval-ready decision matrix for homepage messaging, homepage feed ranking, pricing plans, public visibility, RELU AI limits, messaging/contact limits, compliance wording, and Enterprise routing.

This remains documentation-only. It does not implement UI, backend logic, schema changes, routes, permissions, pricing enforcement, or RELU code.

The recommended product posture is:

- modify homepage copy before the next major public homepage pass
- rank the homepage feed by relevance and trust before recency or paid promotion
- use Starter, Professional, Business, and Enterprise as the future public plan names
- align the existing BASIC/BRONZE/GOLD/ENTERPRISE implementation to those names in a later implementation pass only after approval
- keep all RELU AI outputs human-approved
- treat compliance as assistance and verification support, not legal certification
- route multi-company, multi-country, API/ERP, custom RELU, and high-volume procurement users to Enterprise

EXEC-78B should not start until the owner approves or revises this matrix.

## B. Homepage Messaging Decision

Requested headline:

`Professional Networks Connected`

Requested subtitle:

`Connect companies and professionals through one intelligent workspace.`

Decision: `MODIFY COPY`

Reason: the requested copy is clean and directionally aligned, but it under-represents procurement, opportunity discovery, compliance, and explicit RELU AI value. It may work as a short brand line, but not as the primary hero message for enterprise buyers, contractors, suppliers, recruiters, and procurement teams.

Recommended future homepage copy:

| Element | Recommended copy |
|---|---|
| Headline | `The Professional Network for Procurement and Workforce Delivery` |
| Subtitle | `Discover verified companies, specialists, suppliers, and project opportunities in one RELU AI-assisted workspace.` |
| Supporting line | `OpenStaff connects opportunity discovery, contractor networks, compliance readiness, and human-approved AI assistance from sourcing to delivery.` |

Fallback marketing-test candidates:

1. `Where Workforce Networks Become Project Delivery`
2. `A Smarter Network for Contractors, Suppliers, and Project Teams`
3. `Discover, Match, and Deliver Work with RELU AI`

Decision rule:

- use the recommended copy for the next product-aligned homepage pass
- keep `Professional Networks Connected` available as a compact campaign or section line
- defer A/B marketing tests until after pricing, feed, and visibility rules are owner-approved

## C. Feed Ranking Decision

The homepage feed should not be a pure newest-first feed. It should prioritize useful, trustworthy, local, understandable opportunities while preventing paid placement from overpowering relevance.

Hard gates before ranking:

1. content must be approved
2. content must be public or visible to the current user
3. unsafe, rejected, private, or unmoderated content must not appear publicly
4. promoted content must be labeled

Recommended homepage ranking order:

| Rank | Signal | Reason |
|---|---|---|
| 1 | Geographic relevance | Marketplace value is strongest when opportunity, workforce, supplier, and compliance context match the user's country/region. |
| 2 | Language relevance | Users must understand the opportunity before RELU, pricing, or promotion can matter. |
| 3 | User interest relevance | Registered users should see industries, roles, regions, and categories aligned with their profile and activity. |
| 4 | RELU AI relevance | RELU can improve fit through taxonomy, compatibility, missing-information, and project-context signals, but must stay explainable. |
| 5 | Verification and completeness | Verified and complete actors should rank better because trust and readiness matter. |
| 6 | Newest opportunities | Freshness matters, but should not outrank stronger geographic, language, trust, and fit signals. |
| 7 | Paid/promoted status | Promotion may boost approved content, but should be capped, labeled, and bounded by relevance. |

Homepage feed caps:

- no more than 1 promoted item in the first 4 feed items
- no more than 25 percent promoted content in any standard feed page
- promoted content must still pass moderation and relevance gates
- verified content can outrank unverified promoted content when trust is materially stronger

Anonymous homepage feed:

1. country/region default
2. language
3. verified/completeness
4. recent approved opportunities
5. promoted content cap

Registered homepage feed:

1. country/region
2. language
3. profile interests and taxonomy
4. RELU relevance
5. verification/completeness
6. freshness
7. promoted content cap

Paid homepage feed:

1. registered feed logic
2. richer RELU recommendations
3. saved searches and alerts
4. promotion eligibility for the user's own approved content

Enterprise homepage/feed:

1. procurement team context
2. approved supplier lists
3. country/compliance rules
4. custom RELU relevance
5. audit and governance filters
6. private and public opportunity streams

## D. Pricing Plan Matrix

Future public plan names:

- Starter
- Professional
- Business
- Enterprise

Recommended implementation mapping for a later pass:

| Future public plan | Existing closest concept |
|---|---|
| Starter | BASIC / FREE |
| Professional | BRONZE / PRO |
| Business | GOLD / BUSINESS |
| Enterprise | ENTERPRISE |

Recommended limits for first owner approval:

| Dimension | Starter | Professional | Business | Enterprise |
|---|---:|---:|---:|---|
| Active posts | 1 | 5 | 25 | Custom or unlimited by contract |
| Direct messages/contacts | 5/month | 25/month | 100/month | Custom or unlimited fair-use |
| Public visibility level | Basic public profile and approved posts | Enhanced profile and service visibility | Company/contractor/supplier visibility with richer feed reach | Public/private procurement network controls |
| Company/profile completeness | 60 percent recommended minimum | 80 percent recommended minimum | 90 percent recommended minimum | Contract-defined onboarding and verification |
| Promoted content allowance | 0 | 1 promoted item/month after approval | 5 promoted items/month after approval | Managed campaigns by contract |
| RELU AI usage level | Basic | Standard | Advanced | Custom |
| Team access | 1 user | 1 user | Up to 5 users | Custom seats and roles |
| Analytics | Basic profile/post views | Standard views, contacts, saves | Advanced funnel and opportunity analytics | Custom procurement and supplier analytics |
| Compliance tools | Basic checklist | Checklist plus document reminders | Compliance workspace and document summaries | Custom compliance workflows |
| Enterprise boundary | Upgrade prompts only | Route when team/multi-country/API needs appear | Route when high-volume/custom compliance appears | Dedicated procurement, compliance, and support path |

Pricing enforcement notes:

- Starter should remain useful enough to seed the network.
- Professional should monetize individual reach, better recommendations, and moderate contact volume.
- Business should monetize company publishing, supplier discovery, team workflows, and richer RELU use.
- Enterprise should monetize custom procurement, private networks, high-volume workflows, compliance support, and custom RELU usage.

## E. Visibility Matrix

Public exposure should be plan-aware, but moderation, verification, and privacy remain stronger than payment.

| Public field/action | Starter | Professional | Business | Enterprise |
|---|---|---|---|---|
| Company name | Public after approval | Public after approval | Public after approval | Public/private by workspace policy |
| Logo | Public after approval | Public after approval | Public after approval | Public/private by workspace policy |
| Website | Public after approval | Public after approval | Public after approval | Public/private by workspace policy |
| Email | Hidden; contact form or login prompt | Hidden until contact reveal or user approval | Reveal through approved contact workflow | Custom policy |
| Phone | Hidden | Hidden until contact reveal or user approval | Reveal through approved contact workflow | Custom policy |
| Contact person | Hidden or role-only | Name/role optional after approval | Name/role visible when owner enables it | Custom policy |
| Portfolio | Up to 3 public items | Up to 10 public items | Up to 25 public items | Custom |
| Project budget | Optional range only | Range visible after approval | Range or full budget visible by owner choice | Custom procurement visibility |
| Project documents | No public document exposure by default | Approved previews only | Approved previews/downloads with owner controls | Custom secure document rooms |
| Direct message button | Sign-in/upgrade guided | Enabled within monthly limit | Enabled within monthly limit | Custom governed messaging |
| Promoted badge | Not available | Available for approved promoted item | Available for approved promoted items | Managed campaign labeling |
| Verified badge | Visible only if verified | Visible only if verified | Visible only if verified | Visible according to verification policy |

Sensitive rule:

- project documents, compliance documents, identity documents, contracts, and private contact details must never become public only because of a paid plan
- public exposure requires owner intent, moderation/approval, and privacy-safe rendering

## F. RELU AI Limits

All RELU AI output remains advisory and user-approved. RELU may recommend, draft, score, classify, summarize, and flag gaps, but it must not publish, approve, contact, invoice, contract, or certify automatically.

Recommended first-pass RELU usage model:

| RELU capability | Starter | Professional | Business | Enterprise |
|---|---:|---:|---:|---|
| Monthly RELU credits | 20 | 150 | 1000 | Contract-defined |
| Profile drafting | 5/month | 25/month | 100/month | Custom |
| Post drafting | 3/month | 25/month | 150/month | Custom |
| Matching | 10/month | 50/month | 300/month | Custom |
| Compatibility scoring | 5/month | 50/month | 300/month | Custom |
| Document analysis | Not included | 25 pages/month | 500 pages/month | Custom volume |
| Contract summarization | Not included | 5 summaries/month, advisory only | 50 summaries/month, advisory only | Custom review workflows |
| Compliance assistance | Basic checklist | Checklist plus gap hints | Document-aware compliance assistance | Custom compliance workflows |
| History memory | Last 7 days or latest run | 90-day personal/workspace history | 12-month project/workspace history | Contract-defined retention |
| Reruns | 2/month | 25/month | 150/month | Custom |

Credit policy:

- one draft, match, score, or rerun consumes 1 RELU credit
- one document page consumes 1 RELU credit
- failed provider attempts should not consume user credits unless the failure occurs after a usable result is returned
- manual user edits never consume RELU credits

Approval policy:

- every RELU suggestion needs explicit user action before save, publish, contact, or workflow submission
- high-impact RELU outputs should show "review required" language
- enterprise custom RELU workflows must remain human-approved unless a later governance pass explicitly changes policy

## G. Messaging and Contact Limits

Recommended contact allowances:

| Plan | Direct contacts/month | Message rules |
|---|---:|---|
| Starter | 5 | Can start limited private conversations; can receive replies; contact details remain hidden unless owner reveals. |
| Professional | 25 | Can start more direct conversations; contact reveal allowed after explicit user action and within limits. |
| Business | 100 | Can manage higher-volume buyer/supplier/professional conversations; team routing may be added later. |
| Enterprise | Custom or unlimited fair-use | Governed messaging, team routing, audit, private supplier networks, and custom policy. |

Direct message rules:

1. users must be authenticated to start private conversations
2. anonymous visitors see sign-in, registration, or contact prompts, not private contact data
3. contact reveal is a deliberate action and should count against contact allowance
4. email and phone should not be scraped from public pages
5. users can receive replies even if their monthly outbound allowance is exhausted
6. abuse controls, rate limits, and reporting must remain plan-independent
7. blocked, suspended, rejected, or unapproved accounts cannot use paid contact privileges to bypass trust controls

RELU-recommended contact suggestions:

- RELU may suggest who to contact and explain fit
- RELU may not send messages automatically
- RELU suggestions do not consume contact allowance until the user starts contact or reveals contact details
- RELU should explain when a contact recommendation is based on taxonomy, geography, compliance readiness, or project history

## H. Compliance Wording Decision

Decision: use assistance and readiness language only.

Approved safe wording:

`OpenStaff helps teams organize, review, and track workforce and contractor compliance information. RELU AI can summarize documents, flag missing information, and suggest next checks, but OpenStaff does not provide legal certification. Users, employers, operators, and qualified reviewers remain responsible for final approval and legal compliance decisions.`

Specific safe wording:

| Requirement | Safe wording |
|---|---|
| A1 | `A1 readiness support for cross-border social security documentation.` |
| PPS | `PPS information support for Ireland-related workforce records.` |
| ID06 | `ID06 readiness support for Swedish site-access documentation.` |
| CSCS | `CSCS card information support for UK construction readiness.` |
| CIS | `CIS status information support for UK construction tax workflows.` |
| UTR | `UTR information support for UK tax identifier records.` |
| Country-specific requirements | `Country-specific workforce requirement checklists and review support where configured.` |

Prohibited wording unless approved by legal/compliance owner:

- `certified compliant`
- `guaranteed legal`
- `automatically approved`
- `legally verified by RELU`
- `OpenStaff certifies workforce eligibility`
- `AI-approved compliance`

Compliance approval rule:

- compliance indicators may be public-safe
- source documents remain private unless explicitly shared in a governed workflow
- final approval remains with users, operators, employers, or qualified reviewers

## I. Enterprise Boundary

Route a user or account to Enterprise when any of these conditions apply:

| Trigger | Enterprise route |
|---|---|
| Multiple companies or legal entities | Enterprise account structure and custom verification. |
| Multiple countries | Enterprise compliance, localization, and procurement workflow review. |
| Procurement team usage | Enterprise team seats, roles, audit, and supplier network controls. |
| ERP/API access | Enterprise integration review and contract. |
| More than 25 active posts | Enterprise or Business-plus review depending on use case. |
| More than 100 direct contacts/month | Enterprise fair-use or custom allowance. |
| Unlimited publishing request | Enterprise contract. |
| Compliance workflows | Enterprise when custom country/document workflows are required. |
| Custom RELU AI usage | Enterprise provider-cost, retention, governance, and workflow review. |
| Managed onboarding | Enterprise success/support process. |
| Private supplier network | Enterprise workspace and permission model. |
| Dedicated procurement analytics | Enterprise reporting and audit model. |

Enterprise should not mean "bypass controls." It should mean custom governance, custom limits, custom workflows, and dedicated support.

## J. Remaining Open Questions

These items still need owner approval before EXEC-78B:

1. Confirm the final public plan names: Starter, Professional, Business, Enterprise.
2. Confirm whether current BASIC/BRONZE/GOLD/ENTERPRISE should map directly to those plans in a later implementation pass.
3. Confirm the recommended active post limits: 1, 5, 25, custom.
4. Confirm the recommended contact limits: 5, 25, 100, custom/unlimited fair-use.
5. Confirm promoted content allowances and feed caps.
6. Confirm RELU monthly credit limits and per-capability limits.
7. Confirm whether document pages should consume RELU credits one-to-one.
8. Confirm whether Business should include 5 team seats or another default.
9. Confirm compliance wording with legal/compliance owner before public use.
10. Confirm whether Enterprise routing starts at more than 25 active posts, more than 100 contacts/month, or both.
11. Confirm whether "Professional Networks Connected" remains as secondary copy or is retired.

## K. Final Recommendation

Verdict: `REQUIRE OWNER APPROVAL`.

The matrix is specific enough for EXEC-78B planning, but implementation should not begin until the owner approves the limits, ranking order, visibility rules, compliance wording, and Enterprise boundary.

Recommended approval package:

1. Approve `MODIFY COPY` for homepage messaging.
2. Approve feed ranking order with paid promotion capped and labeled.
3. Approve Starter/Professional/Business/Enterprise plan names.
4. Approve plan limits: active posts `1 / 5 / 25 / custom`, contacts `5 / 25 / 100 / custom`.
5. Approve RELU credits: `20 / 150 / 1000 / contract-defined`.
6. Approve compliance assistance wording.
7. Approve Enterprise routing triggers.

After owner approval, EXEC-78B may be scoped as a separate implementation pass.
