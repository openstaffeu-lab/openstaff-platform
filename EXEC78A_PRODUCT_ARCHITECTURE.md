# EXEC-78A Product Architecture and Network Operating Model

Last updated: 2026-06-01

Verdict: `REQUIRE PRODUCT DECISION`

## A. Executive Summary

EXEC-78A defines OpenStaff as a professional network, opportunity feed, contractor ecosystem, procurement platform, compliance layer, and RELU AI workspace.

This is a documentation-only architecture pass. It does not change the pricing page, feed ranking, subscription enforcement, visibility restrictions, homepage, backend APIs, schema, routes, permissions, or RELU code.

The core finding is that OpenStaff already contains many working ingredients:

- moderated public opportunity discovery through `PublicPost`
- public project and profile discovery surfaces
- profile, post, and project creation workflows
- subscription plan and private contact entitlements
- manual upgrade requests and operator-approved billing
- RELU AI assistance for summaries, taxonomy, ESCO, NACE, geography, matching, and project interpretation
- compliance-oriented profile and project workspaces

The missing layer is not technical stability. The missing layer is a formal product operating model that tells future implementation passes what to enforce, rank, show, monetize, and explain.

Final recommendation: keep the current implementation stable, modify future homepage copy, and require product approval before implementing plan limits, ranking weights, feed visibility rules, promotion rules, RELU usage quotas, or enterprise packaging.

## B. Product Definition

OpenStaff should be defined as a structured professional network for procurement, staffing, subcontracting, supplier discovery, compliance readiness, and RELU AI-assisted project delivery.

### Professional Network

OpenStaff connects:

- professionals
- companies
- contractors
- investors
- suppliers
- recruiters
- consultants

The network is not a generic social network. Profiles, posts, and interactions should be structured around work readiness, taxonomy, geography, verification, compliance, availability, and delivery intent.

### Opportunity Feed

The feed is the primary product surface. It should contain:

- projects
- workforce requests
- subcontracting opportunities
- service offers
- company announcements
- promoted opportunities
- promoted actors
- verified actor activity

The future feed should become the place where users discover relevant demand, capability, and network activity before moving into messaging, proposals, contracting, and delivery.

### Contractor Ecosystem

OpenStaff should support contractors, subcontractors, suppliers, and specialists as a delivery ecosystem. The product should help them discover, evaluate, negotiate, and execute work opportunities while preserving human approval for commitments and AI suggestions.

### Procurement Platform

OpenStaff should support:

- sourcing
- supplier discovery
- workforce acquisition
- subcontracting
- project delivery

This means buyer-side value must be visible in product messaging, feed ranking, pricing, verification, and enterprise packaging.

### Compliance Layer

OpenStaff should support workforce and contractor compliance signals including:

- A1
- PPS
- ID06
- CSCS
- CIS
- UTR
- country-specific workforce requirements

Coverage priorities:

- EU
- UK
- Ireland
- Scotland
- Nordic countries

Compliance support must remain assistive and review-based unless a future legal/compliance owner approves stronger claims. OpenStaff can collect, structure, flag, summarize, and route compliance material; it should not silently certify legal eligibility without an explicit verification workflow.

### RELU AI Workspace

RELU AI is the operational intelligence layer.

RELU AI may:

- analyze
- classify
- summarize
- draft
- recommend
- score compatibility
- support compliance
- maintain project history

RELU AI may not:

- approve content automatically
- publish automatically
- overwrite saved user data silently
- activate billing
- override moderation
- make final hiring, procurement, or compliance decisions

All RELU AI outputs require explicit human approval. Users and operators remain the final decision makers.

## C. Homepage Messaging Review

Requested headline:

`Professional Networks Connected`

Requested subtitle:

`Connect companies and professionals through one intelligent workspace.`

Current implemented homepage copy in the public web app is broader in some ways and weaker in others. It currently emphasizes projects finding professionals, NACE, RELU AI, scoring compatibility, tests, and a digital workspace. The current homepage also contains sections for approved project feed, verified network, domain exploration, and a workflow from discovery to monitored delivery.

### Evaluation

| Question | Verdict | Finding |
|---|---|---|
| Does `Professional Networks Connected` reflect the architecture? | `MODIFY COPY` | It captures network intent, but it is too abstract and underplays procurement, opportunities, delivery, and compliance. |
| Is procurement represented enough? | `MODIFY COPY` | Procurement appears in supporting language, but the headline/subtitle do not make buyer-side value obvious enough for enterprises. |
| Is opportunity discovery represented enough? | `MODIFY COPY` | The word "network" helps, but the feed/opportunity engine is not clear. |
| Is RELU AI represented enough? | `MODIFY COPY` | "Intelligent workspace" hints at AI, but RELU AI is not named and its role is not explicit. |
| Would enterprise buyers understand the value proposition? | `MODIFY COPY` | Enterprise buyers may understand collaboration, but not procurement, workforce acquisition, supplier discovery, or compliance readiness. |

### Recommended Direction

The homepage should position OpenStaff as a procurement and workforce network powered by RELU AI, not just as a connected professional network.

Recommended future headline options:

1. `The Professional Network for Procurement and Workforce Delivery`
2. `Where Workforce Networks Become Project Delivery`
3. `A Smarter Network for Contractors, Suppliers, and Project Teams`
4. `Discover, Match, and Deliver Work with RELU AI`

Recommended future subtitle options:

1. `Find verified companies, specialists, suppliers, and project opportunities in one RELU AI-assisted workspace.`
2. `OpenStaff connects opportunity discovery, contractor networks, compliance readiness, and RELU AI-assisted delivery workflows.`
3. `Source talent, publish opportunities, evaluate fit, and coordinate delivery across a structured professional network.`

Final homepage messaging verdict: `MODIFY COPY`.

No homepage implementation should happen in EXEC-78A.

## D. Feed Architecture

The feed should become the primary product surface. It should be more important than a static directory, because OpenStaff's value is in live opportunity discovery, actor discovery, compliance context, and RELU-assisted matching.

### Feed Content Types

| Feed item | Purpose |
|---|---|
| Project opportunities | Demand from companies, contractors, public buyers, and investors. |
| Workforce requests | Need for specific skills, certifications, regions, availability, or teams. |
| Subcontracting opportunities | Work packages, subcontractor pools, framework needs, and delivery packages. |
| Service offers | Supplier, consultant, recruiter, contractor, and specialist capabilities. |
| Company updates | Availability, expansion, verification, capability, and delivery announcements. |
| Promoted opportunities | Paid amplification for approved opportunities. |
| Promoted actors | Paid amplification for verified or eligible profiles. |
| Verified actor activity | New approvals, compliance readiness, portfolio updates, and capability updates. |

### Anonymous Visitor Feed

Purpose: show marketplace vitality, create trust, support SEO, and drive registration.

Visibility:

- public profiles only
- public posts only
- approved and live content only
- limited contact detail
- limited messaging entry
- visible verification badges where public-safe
- promotion labels visible when content is sponsored

Ranking:

- country and region inferred from request or default market
- language from browser or route context
- industry/category from route or query
- recency
- verification status
- moderation status
- content completeness
- promotion status

Anonymous visitors should not see private contact details, private projects, private compliance documents, or unapproved AI outputs.

### Registered User Feed

Purpose: convert profile data into relevant opportunity discovery.

Visibility:

- anonymous public feed plus registered-only recommendations
- saved interests
- profile-based matching
- onboarding completion nudges
- limited direct messaging based on subscription entitlements
- clearer "why this matches" explanations

Ranking:

- profile type
- country, region, city
- preferred language
- NACE/ESCO/Uniclass taxonomy
- industry interests
- previous views, saves, publishes, contacts, and applications
- verification state
- RELU compatibility signals
- freshness and moderation quality

Registered ranking should remain explainable enough to avoid a black-box marketplace.

### Paid User Feed

Purpose: increase reach, reduce discovery effort, and expose deeper RELU assistance.

Visibility:

- registered feed plus stronger recommendations
- higher contact allowance
- saved searches and alerts
- promoted content eligibility
- richer RELU summaries
- higher publishing volume
- expanded audience targeting where approved

Ranking:

- same base signals as registered feed
- subscription plan influences reach and access, not trust
- paid promotion can increase placement only when content is approved and labeled
- verification should remain a quality gate independent of payment

Paid plans should buy workflow capacity, visibility tools, and AI depth. They should not buy fake trust.

### Enterprise Feed Experience

Purpose: serve procurement teams, multi-country contractor networks, and high-volume workforce programs.

Visibility:

- enterprise-specific procurement views
- private supplier networks
- private project pipelines
- compliance readiness filters
- team and role-based views
- audit and decision history
- dedicated escalation paths
- custom RELU workflows where approved

Ranking:

- procurement strategy
- approved supplier lists
- compliance readiness
- risk flags
- region and country rules
- supplier performance and project history
- RELU compatibility and risk summaries
- human-approved enterprise policy controls

Enterprise feed ranking should be configurable but still auditable.

### Feed Visibility Signals

| Signal | Role |
|---|---|
| Country | Default market, compliance context, and delivery geography. |
| Language | Copy, search relevance, and user comprehension. |
| Region | Local opportunity match and travel feasibility. |
| Industry | Domain relevance through category, NACE, ESCO, and Uniclass. |
| Interests | User-declared and behavior-derived relevance. |
| Activity | Views, saves, publishes, applications, contacts, and ignored suggestions. |
| Subscription plan | Access depth, reach controls, publishing volume, messaging limits, promotion eligibility. |
| Verification level | Trust, eligibility, contact confidence, compliance readiness. |
| RELU AI ranking | Compatibility, taxonomy overlap, missing information, compliance hints, risk summaries. |
| Promotion status | Paid amplification after moderation, always labeled. |

## E. Actor Model

### Professional

| Area | Future model |
|---|---|
| Onboarding | Individual identity, location, skills, experience, languages, availability, portfolio, CV/documents, verification. |
| Profile structure | Summary, skills, ESCO, NACE, Uniclass, work history, certifications, documents, media, compliance readiness, regions served. |
| Publishing rights | Service offers, availability posts, subcontractor availability, portfolio updates. |
| Visibility rights | Public profile after approval; stronger placement with completeness, verification, and plan. |
| Messaging rights | Limited on Starter; expanded with paid plans; always abuse-controlled. |
| Promotion rights | Eligible after approval and verification thresholds. |
| RELU AI access | Profile drafting, skill extraction, taxonomy suggestions, compatibility scoring, compliance hints, portfolio summary. |

### Company

| Area | Future model |
|---|---|
| Onboarding | Company identity, fiscal/VAT data, location, industries, capabilities, documents, representative, verification. |
| Profile structure | Company summary, services, portfolio, certifications, compliance, regions, public posts, team contacts. |
| Publishing rights | Projects, workforce requests, subcontracting packages, service offers, announcements. |
| Visibility rights | Public company profile after approval; stronger reach through paid plan, verification, and promoted content. |
| Messaging rights | Contact candidates, suppliers, professionals, and contractors within plan limits. |
| Promotion rights | Promote approved opportunities, service offers, and company profile. |
| RELU AI access | Draft summaries, classify opportunities, recommend suppliers/professionals, analyze documents, compliance support. |

### Contractor

| Area | Future model |
|---|---|
| Onboarding | Contractor identity, company data, trade coverage, workforce capacity, regions, certifications, references. |
| Profile structure | Delivery capabilities, subcontracting categories, capacity, equipment, compliance readiness, previous work. |
| Publishing rights | Subcontractor pool, project availability, service offers, delivery capacity announcements. |
| Visibility rights | Public contractor profile and pool visibility after approval. |
| Messaging rights | Buyer, subcontractor, supplier, and specialist conversations governed by plan. |
| Promotion rights | Promote capacity, subcontractor pools, and bids. |
| RELU AI access | Work-package matching, taxonomy mapping, bid drafting, compatibility scoring, compliance gap hints. |

### Supplier

| Area | Future model |
|---|---|
| Onboarding | Supplier identity, product/service categories, delivery regions, certifications, documentation. |
| Profile structure | Catalog summary, service areas, compliance docs, certifications, logistics and delivery capability. |
| Publishing rights | Service offers, product availability, supplier announcements, project-specific offers. |
| Visibility rights | Public or verified supplier profile depending on approval and plan. |
| Messaging rights | Buyer and contractor conversations under plan limits. |
| Promotion rights | Promote service offers and supplier profile when approved. |
| RELU AI access | Classification, buyer-fit recommendations, document summaries, compliance support. |

### Recruiter

| Area | Future model |
|---|---|
| Onboarding | Recruiter identity, company/agency data, target roles, regions, compliance scope. |
| Profile structure | Recruitment categories, geographies, sectors, placement model, compliance readiness. |
| Publishing rights | Workforce requests, candidate pool announcements, staffing offers. |
| Visibility rights | Public recruiter profile after moderation and verification where required. |
| Messaging rights | Candidate and buyer contact governed by plan and privacy rules. |
| Promotion rights | Promote workforce campaigns and recruiter services. |
| RELU AI access | Candidate/job matching, summary drafting, taxonomy, compliance checklist support. |

### Consultant

| Area | Future model |
|---|---|
| Onboarding | Consultant identity, expertise, industries, regions, references, documents. |
| Profile structure | Advisory domains, case studies, certifications, service packages, languages. |
| Publishing rights | Service offers, availability, project advisory posts, thought-leadership announcements. |
| Visibility rights | Public consultant profile after approval; premium placement if plan and verification allow. |
| Messaging rights | Buyer and network conversations within plan limits. |
| Promotion rights | Promote advisory offers and profile. |
| RELU AI access | Proposal drafting, domain classification, matching, document summary, compliance support. |

## F. How OpenStaff Works

This section is the definitive future content basis for the homepage.

### Join the Network

Create a professional, company, contractor, supplier, recruiter, or consultant profile. Add identity details, regions, skills, services, industries, taxonomy, portfolio items, documents, certifications, and compliance signals.

Company and contractor onboarding should collect business identity, fiscal/VAT context, operating regions, work categories, proof documents, and representative details.

Verification should make trust visible without exposing private documents. Portfolio building should help actors show work history, service capacity, language coverage, certifications, and delivery readiness.

### Publish Opportunities

Publish structured work opportunities:

- projects
- workforce requests
- subcontracting packages
- service offers
- company announcements

Publishing should vary by plan:

- Starter: limited publishing, public profile and basic opportunity participation
- Professional: more frequent profile/service publishing and direct opportunity participation
- Business: higher-volume company publishing, project and subcontracting requests, promoted listing eligibility
- Enterprise: custom procurement pipelines, private networks, high-volume publishing, compliance workflows, and team governance

All public publishing should remain moderated before public distribution.

### RELU AI Assists

RELU AI helps users and operators:

- match profiles to opportunities
- recommend skills, categories, and taxonomy
- draft summaries, posts, and project descriptions
- score compatibility
- analyze documents
- summarize contract and project context
- support compliance readiness
- preserve project interpretation history

RELU AI suggestions must be reviewed and explicitly applied by a human. RELU can accelerate drafting, classification, screening, and matching, but it must not silently publish, approve, reject, contact, invoice, or contract.

### Connect and Deliver

OpenStaff should help users move from discovery to delivery:

- communication
- negotiation
- proposals
- contracts
- workforce coordination
- milestone and delivery monitoring
- project and compliance history

The product should treat messaging, contracts, and execution as governed work surfaces rather than simple chat.

### Grow with the Right Plan

Plans should define:

- visibility
- reach
- publishing volume
- promotion access
- messaging/contact access
- RELU AI usage
- verification requirements
- enterprise service paths

Users should understand that free access gives them a credible entry into the network, while paid plans expand reach, workflow capacity, RELU depth, and procurement control.

## G. Compliance Layer

Compliance should be a platform layer across profiles, opportunities, documents, and matching.

Target compliance signals:

- A1
- PPS
- ID06
- CSCS
- CIS
- UTR
- VAT/fiscal identity
- country-specific workforce documents
- role-specific certifications
- medical or safety requirements where applicable

Target regions:

- EU
- UK
- Ireland
- Scotland
- Nordic countries

Compliance model:

1. collect structured compliance data and documents
2. classify by country, work type, and actor type
3. surface public-safe readiness indicators
4. keep sensitive documents private
5. route incomplete or risky cases for human review
6. let RELU summarize gaps and suggest next checks
7. preserve audit history for verification decisions

Compliance claims must be conservative. OpenStaff should say "compliance readiness" or "verification support" unless a formal verification process approves stronger language.

## H. RELU AI Workspace Model

RELU AI should operate across four layers:

| Layer | RELU role |
|---|---|
| Creation | Draft profile summaries, post descriptions, project summaries, taxonomy, and geography suggestions. |
| Discovery | Rank fit, explain why an opportunity or actor is relevant, and recommend missing profile improvements. |
| Delivery | Summarize documents, support work-package interpretation, track project history, and highlight risks. |
| Compliance | Suggest required documents, flag missing information, summarize evidence, and route human review. |

Required RELU safeguards:

- advisory-only outputs
- explicit apply or approve action
- editable text before save
- no hidden overwrites
- no automatic publish
- no automatic moderation approval
- no automatic billing activation
- no automatic legal/compliance conclusion
- no secret or provider internals in user-facing UI
- auditability for material AI-assisted changes

RELU usage should become a monetization dimension, but only after quotas, cost controls, fallbacks, and user-facing explanations are product-approved.

## I. Pricing Strategy

Do not redesign the current pricing UI in EXEC-78A.

The future external plan model should be:

- Starter
- Professional
- Business
- Enterprise

The current implementation still uses backend enum and runtime plan codes:

- BASIC
- BRONZE
- GOLD
- ENTERPRISE

There is also a frontend pricing constants file that names:

- FREE
- PRO
- BUSINESS
- ENTERPRISE

This means the plan architecture requires a product and implementation decision before any enforcement pass. The likely mapping is:

| Future plan | Current closest implementation concept |
|---|---|
| Starter | BASIC / FREE |
| Professional | BRONZE / PRO |
| Business | GOLD / BUSINESS |
| Enterprise | ENTERPRISE |

This mapping must be approved before any schema, API, pricing UI, or entitlement change.

### Starter

| Dimension | Future model |
|---|---|
| Visibility | Public profile and limited public discovery after moderation. |
| Reach | Organic reach only; limited ranking boost from completeness and verification. |
| Publishing limits | Low monthly active post limit; basic profile/service presence. |
| Messaging limits | Limited private contacts per month. Current BASIC seed uses 5 private contacts per month. |
| Promoted content | Not eligible or very limited trial promotion. |
| RELU AI usage | Basic profile setup, summary help, limited taxonomy suggestions. |
| Verification requirements | Optional for basic visibility, required for contact expansion and promotion. |
| Enterprise escalation path | Upgrade prompt only. |

### Professional

| Dimension | Future model |
|---|---|
| Visibility | Stronger professional profile placement, portfolio visibility, saved interests. |
| Reach | Regional and category-based reach beyond organic defaults. |
| Publishing limits | Moderate service offer, availability, and opportunity participation limits. |
| Messaging limits | Higher private contact allowance. Current BRONZE seed uses 25 private contacts per month. |
| Promoted content | Limited promoted profile or service offer eligibility after approval. |
| RELU AI usage | Compatibility prompts, profile refinement, taxonomy, geography, and project-fit suggestions. |
| Verification requirements | Verification recommended and required for promoted placement. |
| Enterprise escalation path | Sales-assisted upgrade for teams or higher contact volume. |

### Business

| Dimension | Future model |
|---|---|
| Visibility | Company, contractor, supplier, or recruiter visibility with richer discovery surfaces. |
| Reach | Multi-region/category reach, buyer-side visibility, and promoted opportunity eligibility. |
| Publishing limits | High-volume projects, workforce requests, subcontracting packages, and service offers. |
| Messaging limits | High contact allowance. Current GOLD seed uses 100 private contacts per month. |
| Promoted content | Eligible for promoted opportunities and actor placement after moderation. |
| RELU AI usage | Advanced parsing, predictive summaries, contractor matching, document analysis, and risk summaries. |
| Verification requirements | Verification expected for high-reach publishing and promotions. |
| Enterprise escalation path | Procurement, compliance, and multi-user review path. |

### Enterprise

| Dimension | Future model |
|---|---|
| Visibility | Custom procurement networks, private supplier lists, public and private actor visibility controls. |
| Reach | Custom multi-country reach, private distribution, and managed campaigns. |
| Publishing limits | Custom or unlimited by contract, with governance and moderation controls. |
| Messaging limits | Custom or unlimited by contract. Current ENTERPRISE seed uses unlimited private contacts through limit `0`. |
| Promoted content | Managed promotion, procurement campaigns, and enterprise-grade targeting after approval. |
| RELU AI usage | Custom RELU workflows, procurement intelligence, compliance support, project history, and dedicated review flows. |
| Verification requirements | Required for enterprise procurement workflows. |
| Enterprise escalation path | Dedicated account, procurement, compliance, and support escalation. |

Important copy correction for future pricing: existing documentation mentions "auto-approve policy controls" for Enterprise. That phrase conflicts with the RELU/human-approval operating model. Future copy should use "approval workflow controls", "policy review controls", or "human-approved governance controls".

## J. Visibility Model

### Public

| Surface | Rule |
|---|---|
| Profile visibility | Public-safe profile after moderation/approval. |
| Company visibility | Public-safe company profile after approval. |
| Contact visibility | Limited; private contact gated by authentication and plan. |
| Project visibility | Public posts only when LIVE, APPROVED, and PUBLIC. |
| Promoted visibility | Sponsored content can appear only after moderation and with labeling. |

### Verified

| Surface | Rule |
|---|---|
| Profile visibility | Higher trust display and eligibility for stronger ranking signals. |
| Company visibility | Verification badge, stronger buyer confidence, higher promotion eligibility. |
| Contact visibility | Greater contact confidence, but still plan-governed. |
| Project visibility | Verified publishers may receive trust-aware ranking benefits. |
| Promoted visibility | Verification should be required for high-reach promoted actor/content placement. |

### Premium

| Surface | Rule |
|---|---|
| Profile visibility | Expanded reach, richer cards, saved-search eligibility, promotion tools. |
| Company visibility | Enhanced discovery and multi-post surfaces. |
| Contact visibility | Higher messaging/contact limits. |
| Project visibility | More active posts, better targeting, RELU-assisted drafting. |
| Promoted visibility | Paid but labeled amplification for approved content. |

### Enterprise

| Surface | Rule |
|---|---|
| Profile visibility | Private networks, approved supplier pools, team-specific visibility. |
| Company visibility | Enterprise procurement profile and governance layer. |
| Contact visibility | Custom, governed, auditable communication. |
| Project visibility | Private pipelines plus public campaigns where approved. |
| Promoted visibility | Managed campaigns with review, labeling, and auditability. |

## K. Monetization Model

Recommended monetization hierarchy:

1. Publishing capacity
2. Visibility and reach
3. Messaging and contact access
4. RELU AI usage depth
5. Promotion tools
6. Verification and trust workflows
7. Team, procurement, and compliance workflows
8. Enterprise services

### What Should Be Monetized First

Publishing capacity and contact access are already closest to implementation reality. Current backend plans include private contact limits and manual upgrade requests.

Visibility and promotion are high-value but require product rules before enforcement. Paid reach must be labeled and should never override moderation, verification, or safety.

RELU AI is strategically important, but monetization should wait for approved quotas, cost controls, fallback language, and entitlement boundaries.

### What Should Not Be Sold Directly

OpenStaff should not sell trust itself.

Payment may increase reach, workflow capacity, and tooling depth. Verification, moderation approval, compliance readiness, and profile trust should remain quality gates based on evidence and review, not just subscription.

## L. Risks

1. Plan naming mismatch: current BASIC/BRONZE/GOLD/ENTERPRISE and FREE/PRO/BUSINESS/ENTERPRISE concepts need a single approved mapping.
2. Homepage under-positioning: "Professional Networks Connected" is elegant but too abstract for procurement and enterprise buyers.
3. Feed complexity: personalization can become opaque if RELU and promotion ranking are not explainable.
4. Paid visibility risk: promoted content can damage trust if not labeled or moderated.
5. Compliance claims risk: A1, PPS, ID06, CSCS, CIS, UTR, and country-specific requirements carry legal and operational sensitivity.
6. RELU cost risk: AI usage needs quotas, caching, provider fallback, and billing controls before broad paid access.
7. Messaging abuse risk: contact expansion needs rate limits, anti-spam controls, and clear reporting.
8. Enterprise ambiguity: private networks, custom ranking, compliance support, and procurement workflows need concrete scoping before sales promises.

## M. Open Product Decisions

These decisions must be made before EXEC-78B or any implementation pass:

1. Approve final plan names and mapping: Starter/Professional/Business/Enterprise versus BASIC/BRONZE/GOLD/ENTERPRISE.
2. Approve numeric publishing limits per plan.
3. Approve private contact/messaging limits per plan.
4. Approve RELU AI quotas, included task types, and overage rules.
5. Approve feed ranking weights and explainability requirements.
6. Approve promotion labeling and eligibility rules.
7. Approve whether verified status is required for promotions.
8. Approve compliance wording and legal ownership.
9. Approve enterprise private-network scope.
10. Approve buyer-side procurement messaging for homepage and pricing.
11. Replace or clarify "auto-approve policy controls" language before public Enterprise copy is expanded.
12. Decide whether investors are first-class actors in onboarding or a future buyer persona.

## N. Final Recommendation

Verdict: `REQUIRE PRODUCT DECISION`.

OpenStaff should proceed with the architecture defined here before implementation. The current product should not be changed by EXEC-78A.

Recommended next decision sequence:

1. Approve final plan naming and entitlement mapping.
2. Approve homepage positioning and future copy direction.
3. Approve feed content types and visibility tiers.
4. Approve monetization hierarchy and numeric limits.
5. Approve RELU AI quota and approval boundaries.
6. Approve compliance claims and verification requirements.

Only after those decisions should EXEC-78B begin.
