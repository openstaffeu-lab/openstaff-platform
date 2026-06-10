# EXEC-78G.10E Privacy/Legal Blocker Closure & Authorization Preservation Contract

Date: 2026-06-08

Verdict: `PASS WITH RISKS`

Blocker B3: `PARTIALLY CLOSED; REMAINS BLOCKING`

Authorization: `POLICY-READINESS REVIEW ONLY`

G.11 authorization: `BLOCKED - NOT AUTHORIZED`

Status: Privacy/Legal blocker closure planning only. No route, API, controller, service, DTO, schema, permission, runtime logic, UI, migration, deployment artifact, executable authority resolution, protected write, Response implementation, Participation implementation, or G.11 work was created, modified, or authorized.

## A. Executive Decision

EXEC-78G.10E converts the open G.10D blocker list into an approval-grade policy package.

This phase provides:

- exact proposed retention durations for governance evidence classes
- named legal-hold role authorities
- pseudonymization key lifecycle governance
- residency inventory from current documentation and read-only production metadata
- evidence-bearing store classification
- backup, log sink, processor, and subprocessor classification
- approval readiness findings

This phase does not provide:

- qualified legal advice
- formal Privacy/Legal sign-off
- a completed transfer-impact assessment
- a complete subprocessor data-processing register
- a physical evidence-store implementation
- executable authority resolution
- Response or Participation implementation authorization
- G.11 authorization

Blocker B3 is improved but not fully closed.

Exact durations are documented as the proposed OpenStaff retention schedule for approval review. They are not legally effective for protected writes until Privacy/Legal signs the schedule, notices, lawful bases, exception matrix, and transfer posture.

## B. Closure Summary

| Blocker from G.10D | G.10E result | Status |
|---|---|---|
| exact retention periods | exact proposed durations defined by evidence class | `APPROVED WITH CONDITIONS` |
| formal Privacy/Legal approval | still absent | `BLOCKED` |
| named legal-hold authorities | canonical role authorities named | `APPROVED WITH CONDITIONS` |
| pseudonymization key lifecycle | governance lifecycle defined | `APPROVED WITH CONDITIONS` |
| residency verification | primary DB/runtime/bucket partially verified; logs/global/build/subprocessor paths remain open | `PASS WITH RISKS` |
| evidence-bearing store classification | current and future classes classified | `PASS WITH RISKS` |
| G.11 authorization | not granted | `BLOCKED - NOT AUTHORIZED` |

## C. Evidence Reviewed

### Repository Evidence

| Evidence | Finding |
|---|---|
| `EXEC78G10D_PRIVACY_CONSENT_RETENTION_AND_LEGAL_HOLD_AUTHORIZATION_CONTRACT.md` | exact durations, named authorities, key lifecycle, and residency verification remained blocking |
| `EXEC78G10C_AUDIT_RETENTION_AND_EVIDENCE_PERSISTENCE_PREREQUISITE_CONTRACT.md` | durable audit/evidence model is planning-ready but runtime persistence and exact retention remained blocked |
| `docs/DATA_LIFECYCLE_POLICY.md` | Cloud SQL/GCS source-of-truth baseline; Cloud SQL backups and PITR are recovery controls; no automated retention engine |
| `docs/DEPLOYMENT_RUNBOOK.md` | production region `europe-west1`; Cloud SQL backup/PITR `7`; GCS soft delete `7` days |
| `docs/DISASTER_RECOVERY_PLAN.md` | single-region controlled recovery baseline; not active-active |
| `docs/SECRET_ROTATION_RUNBOOK.md` | secret rotation workflow exists for current production secret classes |
| runtime env search | Stripe, Firebase, Gemini, SMTP/email, storage bucket, and Google services appear as current processor/integration concerns |

### Read-Only Production Metadata

| Metadata source | Result |
|---|---|
| Cloud SQL `openstaff-db` | PostgreSQL 16 in `europe-west1`; zone `europe-west1-d`; backups enabled; retained backups `7`; PITR enabled; transaction log retention `7` days; transactional logs stored in Cloud Storage |
| Cloud Run services | `openstaff-api`, `openstaff-web`, and `openstaff-admin` run in `europe-west1` |
| production GCS bucket | `openstaff-platform-production` location `EUROPE-WEST1` |
| all GCS buckets | production bucket in `EUROPE-WEST1`; Cloud Build bucket `openstaff-platform_cloudbuild` in `US` |
| Cloud Logging sinks | only `_Required` and `_Default` sinks found |
| Cloud Logging buckets | `_Default` in `global` with `30` days; `_Required` in `global` locked with `400` days |
| Artifact Registry | `openstaff-repo` in `europe-west1` |
| Secret Manager | current production secrets use automatic replication |
| Cloud Monitoring | alert policies exist for Stripe webhook, Cloud Run, Cloud SQL, auth, storage, moderation, security, and latency signals |

## D. WP G10E-A Exact Retention Duration Authorization Matrix

### Retention Policy Status

The following exact durations are approved only as a proposed OpenStaff retention schedule for Privacy/Legal review.

They do not authorize implementation, protected writes, or data deletion. A later Privacy/Legal sign-off must approve the legal bases, notices, jurisdiction-specific exceptions, and operational procedures before the durations become runtime policy.

### Governance Evidence Retention Matrix

| Evidence category | Exact proposed duration | Start trigger | Expiration trigger | Preservation exceptions | Legal-hold interaction | Status |
|---|---:|---|---|---|---|---|
| authority-resolution `ALLOW` evidence | 6 years | decision timestamp | latest of relationship closure, target object closure, or dispute window close + 6 years | legal claim, security/fraud case, active dispute, unresolved dependency | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| authority-resolution `DENY` evidence | 24 months | decision timestamp | 24 months after attempt if no dispute/security case | extend to 6 years if tied to abuse, fraud, dispute, protected-write denial, or legal claim | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| stale/revoked/ambiguous/conflict/unavailable authority evidence | 24 months | attempt timestamp | 24 months after final resolution or timeout | extend to 6 years for dispute/security/fraud/legal claim | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| consent acceptance evidence | 6 years | acceptance timestamp | 6 years after Participation, Project, Contract, or dependent lifecycle closes, whichever is latest | legal claim, dispute, fraud/security case, revocation dependency | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| consent rejection evidence | 24 months | rejection timestamp | 24 months after rejection if no later dispute | extend to 6 years if rejection becomes dispute/appeal evidence | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| consent withdrawal evidence | 6 years | withdrawal timestamp | 6 years after all dependent reliance and dispute windows close | legal claim, revocation dependency, fraud/security case | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| offered-terms evidence linked to accepted consent | 6 years | terms revision creation | 6 years after all linked consent/dependent lifecycles close | legal claim, dispute, fraud/security case | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| offered-terms evidence not accepted | 24 months | offer expiry, rejection, withdrawal, or archive | 24 months after final non-acceptance outcome | extend to 6 years if disputed or relied on | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| Response revision evidence | 6 years | revision creation | 6 years after Response closes, archives, or converts and all linked lineage closes | dispute, fraud/security, legal claim, linked Project/Participation dependency | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| Participation revision evidence | 6 years | revision creation | 6 years after Participation and all dependent Project/Contract/Workspace references close | dispute, fraud/security, legal claim, revocation dependency | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| lineage/conversion evidence | 6 years | destination creation or conversion outcome | 6 years after latest linked source/destination object closes | duplicate-conversion dispute, legal claim, fraud/security | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| revocation evidence | 6 years | revocation effective timestamp | 6 years after all dependent local consequences close | legal claim, security/fraud case, disputed revocation | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| archive/restore governance evidence | 6 years | archive or restore timestamp | 6 years after restored/archive-final object closes | dispute, legal claim, reconstruction need | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| correction/supersession/redaction evidence | same as underlying evidence plus 12 months | correction timestamp | latest of underlying evidence expiry + 12 months | legal claim, dispute, fraud/security | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| protected-write command audit evidence | 6 years | command attempt timestamp | 6 years after target object/dependent lifecycle closes | dispute, fraud/security, legal claim | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| application security events | 24 months | event timestamp | 24 months after event closure | critical incident, account compromise, fraud, legal claim extends to 6 years | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| critical security incidents | 6 years | incident classification timestamp | 6 years after incident closure | legal claim, regulator request, fraud case | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| operational request traces | 30 days | request timestamp | 30 days after event | promoted incident evidence copied to governance/security evidence class before expiry | scoped hold may preserve copy | `APPROVED WITH CONDITIONS` |
| diagnostic logs | 30 days | log timestamp | 30 days after event | incident promotion before expiry | scoped hold may preserve copy | `APPROVED WITH CONDITIONS` |
| incident diagnostic package | 12 months | incident package creation | 12 months after incident closure | critical/legal/fraud/security case extends to 6 years | hold suspends expiry | `APPROVED WITH CONDITIONS` |
| Cloud Logging `_Default` | 30 days | log ingestion | Google Cloud Logging bucket expiry | promoted evidence must be copied to durable evidence store before expiry | Google bucket hold behavior not approved for governance evidence | `CURRENT FACT - NOT GOVERNANCE EVIDENCE` |
| Cloud Logging `_Required` | 400 days | log ingestion | Google-managed locked retention | Google-managed audit logs only | not a substitute for domain legal hold | `CURRENT FACT - NOT GOVERNANCE EVIDENCE` |
| Cloud SQL automated backups | retained backup count `7` | backup creation | managed backup rotation | recovery/legal hold requires restored evidence review, not backup-as-archive | backup retention is not evidence retention | `CURRENT FACT - RECOVERY ONLY` |
| Cloud SQL PITR logs | 7 days | transaction log creation | 7 days after log creation | recovery only | not governance retention | `CURRENT FACT - RECOVERY ONLY` |
| GCS soft delete | 7 days | object deletion | 7 days after delete | recovery only unless future hold mechanism approved | not governance retention | `CURRENT FACT - RECOVERY ONLY` |
| legal-hold records | hold life plus 6 years after release | hold issue timestamp | 6 years after authorized hold release and final disposition review | regulator/legal/dispute extension | self-preserving until release | `APPROVED WITH CONDITIONS` |

### Expiration Rules

Evidence may expire only after all of the following are true:

1. the exact class duration elapsed
2. every dependent object lifecycle is closed
3. every dispute, appeal, fraud, security, contractual, or legal-claim window is closed
4. legal hold state is `NONE` or released and post-release review is complete
5. subject-right restrictions and redactions are applied
6. backup residual exposure is understood
7. deletion/redaction disposition is audited

Unknown dependency state fails closed to preservation.

## E. WP G10E-B Named Legal-Hold Authority Contract

### Named Role Authorities

| Authority | Named role | Responsibility | Status |
|---|---|---|---|
| legal-hold policy owner | `OpenStaff Privacy/Legal Owner` | owns hold policy, lawful basis, notice/exceptions, release standards | `APPROVED WITH CONDITIONS` |
| hold issuing authority | `OpenStaff Privacy/Legal Owner` | issues ordinary legal holds | `APPROVED WITH CONDITIONS` |
| hold approval authority | `OpenStaff Privacy/Legal Owner` plus affected `Domain Owner` | approves scope, evidence classes, affected systems | `APPROVED WITH CONDITIONS` |
| security/fraud hold co-approver | `OpenStaff Security Owner` | approves security/fraud preservation basis and scope | `APPROVED WITH CONDITIONS` |
| hold release authority | `OpenStaff Privacy/Legal Owner` with independent `Security/Data Owner` review for high-impact holds | releases hold after necessity review | `APPROVED WITH CONDITIONS` |
| escalation authority | `OpenStaff Executive Owner` | resolves urgent conflict or unavailability of policy owner | `APPROVED WITH CONDITIONS` |
| audit owner | `OpenStaff Audit/Data Owner` | preserves hold records, access logs, release evidence, and disposition record | `APPROVED WITH CONDITIONS` |
| technical custodian | `OpenStaff Data/Platform Owner` | carries out preservation under approved hold; cannot issue/release hold alone | `APPROVED WITH CONDITIONS` |

Named role authorities are approved. Natural-person assignment, contact route, and rota coverage remain operating-procedure conditions.

### Hold Issuance Workflow

1. receive preservation request or trigger
2. classify trigger as legal claim, regulator request, dispute, fraud, security incident, contractual claim, or executive preservation
3. identify evidence scope by evidence ID, account/entity reference, object, correlation ID, command ID, domain, date range, or processor
4. approve issuing authority and co-approver where needed
5. record hold evidence with reason category, scope, effective time, authority, and review cadence
6. notify Data/Platform and affected Domain Owners where permitted
7. suspend expiry and destructive redaction for scoped evidence
8. audit all access, export, restoration, modification, release, and disposition events

### Hold Modification Workflow

1. requester proposes expansion, narrowing, or correction
2. Privacy/Legal reviews necessity and proportionality
3. affected owner confirms operational consequences
4. modification is appended as hold evidence
5. prior hold remains reconstructable

### Hold Release Workflow

1. Privacy/Legal confirms preservation purpose ended or narrowed
2. Security/Data co-review confirms no linked incident, fraud, backup, or dependent lifecycle remains
3. release evidence is appended
4. ordinary retention is recalculated
5. expired evidence moves to approved redaction/deletion disposition
6. release does not erase evidence automatically

### Emergency Preservation Workflow

If immediate preservation is required and the Privacy/Legal Owner is unavailable:

1. Security Owner or Executive Owner may initiate a 72-hour emergency preservation hold
2. emergency hold preserves evidence but does not authorize disclosure, export, or new processing
3. Privacy/Legal must ratify, narrow, or release the hold within 72 hours
4. failure to ratify converts the hold to release review, not immediate deletion
5. all emergency use is audited

## F. WP G10E-C Pseudonymization Key Lifecycle Contract

### Key Governance Matrix

| Concern | Policy | Owner | Status |
|---|---|---|---|
| key ownership | pseudonymization keys are security assets, not domain assets | `Security Owner` | `APPROVED WITH CONDITIONS` |
| mapping ownership | identity mapping is held by restricted Data custody | `Audit/Data Owner` | `APPROVED WITH CONDITIONS` |
| key generation | generated in approved managed KMS/HSM-equivalent service with audit trail | `Security Owner` | `APPROVED WITH CONDITIONS` |
| key rotation | scheduled every 12 months and after suspected compromise, role change, or algorithm/policy change | `Security Owner` | `APPROVED WITH CONDITIONS` |
| key escrow | no plaintext export; break-glass recovery requires dual authorization | `Security Owner + Privacy/Legal Owner` | `APPROVED WITH CONDITIONS` |
| key recovery | recovery allowed only for legal hold, subject-right response, dispute, security/fraud, or reconstruction | `Privacy/Legal Owner` approves; `Security Owner` executes | `APPROVED WITH CONDITIONS` |
| key access | no unrestricted domain-service access; all re-identification is case-scoped | `Security Owner` | `APPROVED WITH CONDITIONS` |
| key destruction | allowed only after all linked retention, hold, backup, and reconstruction dependencies expire | `Privacy/Legal Owner + Security Owner` | `APPROVED WITH CONDITIONS` |
| destruction verification | dual-control destruction record plus post-destruction reconstruction impact check | `Audit/Data Owner` | `APPROVED WITH CONDITIONS` |
| audit | generation, rotation, use, recovery, and destruction are append-only governance/security evidence | `Audit/Data Owner` | `APPROVED WITH CONDITIONS` |

### Rotation and Recovery Rules

- old keys remain available only as long as needed to read still-retained evidence
- new evidence uses current key version after rotation
- key version is recorded in restricted evidence metadata
- recovery does not grant domain authority or user access
- re-identification output is minimized to the approved case
- failed recovery fails closed and is audited

### Destruction Rules

Key destruction requires:

1. no active legal hold
2. all linked evidence durations expired
3. all subject-right, dispute, fraud, security, and legal-claim dependencies closed
4. backup residual period understood
5. Privacy/Legal approval
6. Security approval
7. Data/Audit verification record

Key destruction before these gates is prohibited.

Physical KMS design remains future implementation planning and is not authorized here.

## G. WP G10E-D Residency Inventory Completion

### Evidence-Bearing Residency Inventory

| Location/process | Evidence-bearing classification | Current residency/region | Transfer path | Owner | Retention interaction | Legal-hold interaction | Status |
|---|---|---|---|---|---|---|---|
| Cloud SQL `openstaff-db` | current relational truth and current audit/security tables | `europe-west1`; zone `europe-west1-d` | in-region app access through Cloud SQL connector | Data/Platform | Cloud SQL backup count `7`; PITR `7` days; canonical evidence retention future | hold not implemented; future evidence store must support holds | `VERIFIED WITH RISKS` |
| current `AuditLog` and `SecurityEvent` in Cloud SQL | current audit foundation, not canonical governance evidence | inherits Cloud SQL `europe-west1` | app/database | Audit/Data | current retention policy conservative/unimplemented | current cascade risks remain | `FOUNDATION ONLY` |
| future governance evidence store | canonical durable evidence | must be approved EEA location | none authorized yet | Audit/Data | class durations in Section D | hold-aware storage required | `PLANNING ONLY` |
| Cloud Run `openstaff-api` | processing location for API writes, logs, auth, billing, notifications | `europe-west1` | browser/external provider requests; Cloud SQL/GCS/Secret Manager | Platform | runtime logs to Cloud Logging | hold not runtime-enforced | `VERIFIED WITH RISKS` |
| Cloud Run `openstaff-web` | public/auth frontend processing and request logs | `europe-west1` | browser/API/Firebase client | Platform/Web | request logs to Cloud Logging | not evidence store | `VERIFIED WITH RISKS` |
| Cloud Run `openstaff-admin` | admin frontend processing and request logs | `europe-west1` | browser/API/Firebase client | Platform/Admin | request logs to Cloud Logging | not evidence store | `VERIFIED WITH RISKS` |
| GCS `openstaff-platform-production` | uploaded binary object source of truth | `EUROPE-WEST1` | app signed access and GCS APIs | Data/Storage | soft delete `7` days; object retention policy not proven | object legal hold not implemented | `VERIFIED WITH RISKS` |
| Cloud SQL automated backups | recovery copies of relational state | Cloud SQL instance region verified; backup storage details managed by Cloud SQL | Google-managed recovery path | Data/Platform | retained backups `7` | not a governance evidence archive | `PARTIALLY VERIFIED` |
| Cloud SQL PITR logs | recovery transaction logs | transactional log storage state `CLOUD_STORAGE`; location details not separately proven | Google-managed | Data/Platform | `7` days | not evidence archive | `PARTIALLY VERIFIED` |
| GCS soft delete | recovery for deleted objects | bucket region `EUROPE-WEST1` | GCS managed | Data/Storage | `7` days | not hold-aware policy | `VERIFIED WITH RISKS` |
| Cloud Logging `_Default` | operational logs/traces | `global`; `30` days | Google Cloud Logging | Platform/Security | operational only; not governance truth | cannot satisfy domain hold by itself | `BLOCKING FOR GOVERNANCE EVIDENCE` |
| Cloud Logging `_Required` | Google-managed audit logs | `global`; locked `400` days | Google Cloud Logging | Platform/Security/Google | platform audit only | not domain evidence hold | `GLOBAL - ACCEPTANCE REQUIRED` |
| Cloud Monitoring policies/metrics | operational alert metadata | Google Cloud Monitoring; location not proven as EEA | alerts and notification channel | Platform/Security | operational retention; not governance evidence | not hold store | `UNRESOLVED` |
| Artifact Registry `openstaff-repo` | deployment artifacts; not user governance evidence by default | `europe-west1` | Cloud Build/Cloud Run | Platform/Delivery | image lifecycle policy not reviewed | not hold store | `VERIFIED NON-GOVERNANCE` |
| Cloud Build bucket `openstaff-platform_cloudbuild` | build source/log artifacts; may contain deployment metadata | `US` | Cloud Build | Delivery/Platform | not governance evidence; may contain metadata | not hold store | `NON-EEA/GLOBAL RISK` |
| Secret Manager current secrets | secrets; may include provider credentials and DB URL | automatic replication | Cloud Run/Secret Manager | Security/Platform | secret versions governed by rotation runbook, not evidence retention | key/secret hold not defined | `RESIDENCY UNRESOLVED` |
| Firebase Authentication/Admin | account identity validation processor | Google/Firebase location not verified in this pass | browser/API/Firebase | Auth/Security | Firebase account/auth logs outside current evidence model | subject/export/erasure integration not closed | `SUBPROCESSOR REVIEW REQUIRED` |
| Firebase web config/storage bucket reference | client auth/storage configuration | `openstaff-platform.firebasestorage.app` location not verified | browser/Firebase | Web/Auth | not canonical governance evidence | not hold store | `UNRESOLVED` |
| Stripe webhook processing | billing event processor | external processor location not verified | Stripe -> API | Billing/Finance | billing retention separate; webhook failures monitored | legal hold process not closed | `SUBPROCESSOR REVIEW REQUIRED` |
| Gemini/Google AI | RELU/AI processor | endpoint/data residency not verified | API -> Google AI | RELU/AI Owner | AI prompts/results not Response/Participation evidence | processing restrictions required | `SUBPROCESSOR REVIEW REQUIRED` |
| SMTP/email provider | transactional email processor | SMTP provider/location not verified | API -> SMTP | Notification/Comms | delivery logs not canonical governance evidence | hold/export process not closed | `SUBPROCESSOR REVIEW REQUIRED` |
| Google Maps/Places | location autocomplete client processor | Google service; residency not verified | browser -> Google | Web/Location | not governance evidence; may process user queries | privacy notice required | `SUBPROCESSOR REVIEW REQUIRED` |
| analytics destinations | no dedicated product analytics destination verified in this pass | none proven | n/a | Product/Platform | not applicable until configured | not applicable | `NO CURRENT APPROVED DESTINATION` |
| support/manual exports | possible human support processing | no formal inventory | operator-controlled | Support/Privacy | export retention undefined | hold/export handling undefined | `BLOCKED` |

### Residency Verdict

Residency inventory is materially improved but incomplete.

Verified EEA/in-region foundations:

- Cloud Run production services in `europe-west1`
- Cloud SQL primary in `europe-west1`
- production GCS bucket in `EUROPE-WEST1`
- Artifact Registry in `europe-west1`

Blocking or conditional items:

- Cloud Logging is `global`
- Cloud Build bucket is `US`
- Secret Manager uses automatic replication
- Cloud Monitoring location/subprocessor handling is not proven
- Firebase, Stripe, Gemini, SMTP/email, Google Maps/Places, support exports, and any future analytics require subprocessor, location, transfer-basis, and notice review
- future governance evidence store does not exist and must be EEA-bound

## H. WP G10E-E Privacy/Legal Approval Readiness Review

| Review item | Decision | Conditions/blockers |
|---|---|---|
| exact retention schedule | `APPROVED WITH CONDITIONS` | formal Privacy/Legal sign-off still required |
| retention triggers and expiry gates | `APPROVED WITH CONDITIONS` | implementation proof absent |
| legal-hold named role authorities | `APPROVED WITH CONDITIONS` | natural-person assignment and runbook coverage required |
| legal-hold workflows | `APPROVED WITH CONDITIONS` | no runtime hold implementation |
| emergency preservation | `APPROVED WITH CONDITIONS` | 72-hour ratification rule requires operating procedure |
| pseudonymization key lifecycle | `APPROVED WITH CONDITIONS` | physical KMS/key design absent |
| key destruction gates | `APPROVED WITH CONDITIONS` | proof mechanism absent |
| primary EEA storage rule | `APPROVED WITH CONDITIONS` | future evidence store must prove EEA residency |
| current production DB/runtime/bucket residency | `PASS WITH RISKS` | verified for major components; logs/secrets/subprocessors remain open |
| non-EEA transfer prohibition by default | `APPROVED` | transfer register and safeguards required for exceptions |
| Cloud Logging global buckets | `BLOCKED FOR GOVERNANCE EVIDENCE` | may remain operational logs only; cannot be canonical evidence |
| Cloud Build US bucket | `BLOCKED FOR EVIDENCE-BEARING CONTENT` | must not contain governance evidence or personal evidence exports |
| Secret Manager automatic replication | `BLOCKED FOR PSEUDONYMIZATION KEYS UNTIL REVIEWED` | future pseudonymization key storage must be residency-reviewed |
| subprocessor inventory | `BLOCKED` | Firebase, Stripe, Google AI/Gemini, SMTP, Maps/Places, support/export paths require DPA/TIA/location review |
| Privacy notices/legal bases | `BLOCKED` | not approved here |
| subject-right operational procedure | `BLOCKED` | not approved here |

## I. WP G10E-F Blocker B3 Closure Verdict

### B3 Classification

Blocker B3 is `PARTIALLY CLOSED; REMAINS BLOCKING`.

Closed for planning:

- exact proposed durations are documented
- legal-hold role authorities are named
- legal-hold workflows are defined
- pseudonymization key lifecycle governance is defined
- major production EEA foundations are verified
- evidence-bearing locations are classified

Still blocking:

- formal Privacy/Legal approval is not recorded
- exact durations are not legally approved
- privacy notices, lawful bases, and subject-right procedures are not approved
- subprocessor register and transfer-impact assessment are incomplete
- Cloud Logging global buckets and Cloud Build US bucket need explicit operational acceptance and evidence exclusion rules
- Secret Manager automatic replication is not approved for future pseudonymization keys
- future governance evidence store is not implemented or residency-proven
- no protected-write runtime proof exists

### Authorization Preservation

| Area | Verdict |
|---|---|
| protected writes | `NOT AUTHORIZED` |
| executable authority resolution | `NOT AUTHORIZED` |
| Response implementation | `NOT AUTHORIZED` |
| Participation implementation | `NOT AUTHORIZED` |
| schema/API implementation | `NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |

Partial closure is not implementation readiness.

Partial closure is not implementation authorization.

Partial closure is not G.11 authorization.

## J. External Policy Basis

This contract is an internal planning artifact, not legal advice.

It uses official EU guidance as high-level alignment:

- GDPR rights include access, rectification, erasure, restriction, portability, objection, and transparency obligations.
- Erasure can have exceptions where data must be kept for legal obligations, public-interest reasons, or legal-claim purposes.
- EEA-to-non-EEA personal-data transfers require an approved transfer mechanism and safeguards.

Qualified Privacy/Legal approval remains mandatory before these policy schedules can govern protected writes.

Official references:

- European Commission, information for individuals: `https://commission.europa.eu/law/law-topic/data-protection/reform/rights-citizens/my-rights_en`
- European Commission, erasure exceptions: `https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/dealing-citizens/do-we-always-have-delete-personal-data-if-person-asks_en`
- European Commission, international transfers: `https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/rules-international-data-transfers_en`
- European Commission, Standard Contractual Clauses: `https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en`

## K. Risks

| Risk | Severity | Control frozen in G.10E | Remaining exposure |
|---|---|---|---|
| proposed durations treated as legal approval | critical | explicit conditional status | formal sign-off absent |
| evidence accidentally stored in Cloud Logging only | critical | logs classified non-authoritative | current logs are global |
| governance evidence exported to Cloud Build bucket | high | US bucket classified non-governance | build/source logs need hygiene |
| automatic Secret Manager replication used for pseudonymization keys | high | future key store requires residency review | no KMS design |
| subprocessor transfer without approved mechanism | critical | transfer default prohibited | register/TIA absent |
| legal hold lacks person-level coverage | high | role authorities named | rota/contact procedure absent |
| retention schedule too long or too short for a jurisdiction | high | legal approval required | jurisdiction review absent |
| backup restore reintroduces restricted data | high | restore review required | technical runbook absent |
| current cascade audit foundation is mistaken for canonical evidence | critical | foundation-only classification | schema still unchanged |
| partial B3 closure used to start G.11 | critical | authorization preservation matrix | owner discipline required |

## L. Recommendations

1. Obtain formal Privacy/Legal approval for Section D durations, notices, legal bases, and exception matrix.
2. Create a signed subprocessor and transfer register before protected writes.
3. Keep canonical governance evidence out of Cloud Logging, Cloud Build buckets, and operational traces.
4. Require future governance evidence storage to prove EEA residency and no-cascade preservation.
5. Use regionally reviewed KMS/key custody for pseudonymization keys rather than Secret Manager automatic replication by default.
6. Assign natural persons and backups to every legal-hold role before runtime use.
7. Add a future pre-G.11 evidence package requirement: Cloud SQL, GCS, Logging, Secret Manager/KMS, Cloud Build, Firebase, Stripe, Gemini, SMTP, Maps/Places, and support/export residency proof.
8. Keep G.11 blocked until B3 and the remaining G.10A blockers are separately closed and owner-authorized.

## M. Validation

### Scope Validation

| Constraint | Result |
|---|---|
| routes/APIs/controllers/services/DTOs | NONE |
| schemas/Prisma/database/migrations | NONE |
| permissions/runtime logic | NONE |
| UI/deployment artifacts | NONE |
| protected-write planning converted to implementation | NONE |
| executable authority resolution | NOT AUTHORIZED |
| Response implementation | NOT AUTHORIZED |
| Participation implementation | NOT AUTHORIZED |
| G.11 implementation | BLOCKED - NOT AUTHORIZED |

### Architecture Invariants

| Invariant | Result |
|---|---|
| Feed remains Discovery | CONFIRMED |
| Dashboard remains Operational Orientation | CONFIRMED |
| Workspace remains Execution | CONFIRMED |
| RELU remains Contextual Intelligence | CONFIRMED |
| Taxonomy remains Infrastructure | CONFIRMED |
| Response remains non-authority and domain-owned | CONFIRMED |
| Participation remains non-representation and domain-owned | CONFIRMED |
| Combined Mode remains aggregation only | CONFIRMED |
| partial B3 closure does not authorize implementation | CONFIRMED |

### Success Criteria

| Criterion | Result |
|---|---|
| exact retention durations documented | PASS WITH RISKS |
| named legal-hold authorities documented | PASS WITH RISKS |
| pseudonymization key lifecycle documented | PASS WITH RISKS |
| complete residency inventory documented | PASS WITH RISKS |
| evidence-bearing stores classified | PASS |
| backup locations classified | PASS WITH RISKS |
| log sinks classified | PASS |
| subprocessors classified | PASS WITH RISKS |
| Privacy/Legal approval readiness classified | PASS |
| blocker B3 explicitly classified | PASS - PARTIALLY CLOSED/BLOCKING |
| partial closure is not authorization | PASS |
| executable authority resolution remains unauthorized | PASS |
| Response remains unauthorized | PASS |
| Participation remains unauthorized | PASS |
| G.11 remains blocked | PASS |

Build, lint, tests, Prisma validation, browser automation, migrations, API proof, and deployment were not run because this phase is planning-only and prohibits implementation.

## N. Final Verdict

Verdict: `PASS WITH RISKS`.

G.10E documents exact proposed retention durations, legal-hold role authorities, pseudonymization key lifecycle governance, and a materially improved residency inventory.

Blocker B3 remains `PARTIALLY CLOSED; BLOCKING`.

The main reason is simple and important: policy detail is now much better, but formal Privacy/Legal approval, subprocessor/transfer closure, global log acceptance, key-store residency, and future evidence-store proof are not complete.

Protected writes remain `NOT AUTHORIZED`.

Executable authority resolution remains `NOT AUTHORIZED`.

Response remains `NOT AUTHORIZED`.

Participation remains `NOT AUTHORIZED`.

EXEC-78G.11 remains `BLOCKED - NOT AUTHORIZED`.
