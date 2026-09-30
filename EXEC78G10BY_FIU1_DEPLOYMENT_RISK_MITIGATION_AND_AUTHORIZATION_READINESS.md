# EXEC-78G.10BY - FIU-1 Deployment Risk Mitigation & Authorization Readiness

Date: 2026-09-30

Verdict: `EXEC-78G.10BY PASS WITH DEFERRALS`

Authorization-readiness classification: `FIU1_AUTHORIZATION_REQUEST_READY_WITH_MITIGATIONS`

## A. Executive Gate Context

BX verdict: `EXEC-78G.10BX PASS WITH RISKS`.

BX deployment-entry classification: `FIU1_DEPLOY_READY_WITH_RISKS`.

`EXEC-78G.10BY is planning/readiness evidence only.` It does not deploy FIU-1 and does not grant deployment authorization. It defines mitigations and the contents of a later authorization request. No production or staging mutation, Cloud Build execution, Cloud Run change, or deployment command is authorized or performed here.

## B. FIU-1 Deployment Scope

BX identified a backend/API-only change affecting the `openstaff-api` service on Google Cloud Run. The repository deployment artifacts are `apps/admin/api/Dockerfile` and `apps/admin/api/cloudbuild.api.yaml`.

| Scope item | Result |
|---|---|
| Migration required | NO |
| New environment variables required | NO |
| Frontend deployment required | NO |
| Worker deployment required | NO |

This is a surface assessment, not a deployment procedure. FIU-1 uses the existing `AuditService` and `AuditLog` model. No schema or migration change was made.

## C. BX Deployment Risk Register

BX severities are preserved exactly.

| ID | Risk | BX severity |
|---|---|---|
| BY-R1 | Additive AuditLog writes | MEDIUM |
| BY-R2 | Audit-write latency | MEDIUM |
| BY-R3 | AuditService availability | MEDIUM |
| BY-R4 | Best-effort evidence gaps | MEDIUM |
| BY-R5 | AuditLog volume | MEDIUM |
| BY-R6 | DI registration | LOW |
| BY-R7 | Request metadata propagation | LOW |
| BY-R8 | Rollback simplicity | LOW |
| BY-R9 | Database compatibility | LOW |
| BY-R10 | Frontend compatibility | LOW |

## D. Medium-Risk Mitigation Matrix

No canonical production alert thresholds, latency SLOs, error budgets, dashboards, or automated rollback controls were established by BX or the inspected repository evidence. Every threshold below is a proposed deployment decision criterion, not an existing alert or production policy. A later authorization must identify who can observe the relevant signals and how.

### BY-R1 - Additive AuditLog writes

- Risk: Each successful in-scope Project create/update adds an AuditLog row.
- BX severity: MEDIUM.
- Failure mode: AuditLog insertion fails, writes are unexpectedly multiplied, or audit persistence contributes to database pressure.
- Detection signal: Compare in-scope Project write activity with `PROJECT_WRITE_EVIDENCE` AuditLog rows; inspect database errors and Project write outcomes.
- Existing control: `EXISTING_CONTROL` - FIU-1 uses existing `AuditService.log` and existing `AuditLog`; adapter catches audit failures and emits an error containing action and Project ID, not the evidence payload. This is failure containment, not a volume alert.
- Proposed pre-deployment mitigation: Record an observation window of normal Project create/update activity and corresponding AuditLog writes using authorized log/database access. Confirm the operator can inspect both before requesting deployment authorization.
- Proposed runtime observation: During the authorization-approved observation window, compare Project write successes, audit rows by category/action, and database write errors.
- Proposed alert/decision threshold: `PROPOSED_THRESHOLD_FOR_DEPLOYMENT_AUTHORIZATION` - stop and escalate on unexpected write amplification, repeated audit insert errors, or Project write failures associated with database pressure. No numeric threshold is established.
- Operator action: Pause rollout/traffic progression under the approved change procedure; preserve timestamps, request IDs, and affected Project IDs; determine whether failures are isolated to evidence writes or affect business writes.
- Rollback trigger: Sustained unexpected AuditLog write amplification or database errors materially affecting Project create/update.
- Residual risk: Manual correlation may be incomplete; there is no FIU-1 deduplication or exactly-once guarantee.
- Mitigation classification: `PARTIALLY_MITIGATED_WITHOUT_CODE`.
- Invariant: AuditLog evidence is additive and must not become authoritative business state.

### BY-R2 - Audit-write latency

- Risk: The service awaits the best-effort evidence attempt before returning from the successful Project operation.
- BX severity: MEDIUM.
- Failure mode: Audit persistence increases Project create/update response time or contributes to request timeouts.
- Detection signal: Compare Project create/update latency and API error behavior before and after rollout under comparable traffic; inspect relevant server/database errors.
- Existing control: `EXISTING_CONTROL` - the adapter catches AuditService persistence errors so an audit exception does not propagate as a Project-write failure. No latency SLO or latency alert is established in repository evidence.
- Proposed pre-deployment mitigation: Capture an available pre-deployment latency baseline for Project create and update, document the measurement source and workload window, and include it in the later authorization package. If no trustworthy baseline is available, record that limitation and require an explicit operator decision before authorization.
- Proposed runtime observation: Compare the same operations and measurement method during the approved observation window; distinguish business-write time from total request time where existing telemetry allows.
- Proposed alert/decision threshold: `PROPOSED_THRESHOLD_FOR_DEPLOYMENT_AUTHORIZATION` - stop on a material, sustained Project-write latency regression or new sustained FIU-1-associated 5xx/timeouts. No numeric SLO is claimed.
- Operator action: Stop further traffic progression, capture request IDs and server/database errors, and compare with the baseline before deciding rollback.
- Rollback trigger: Material sustained latency regression or new sustained Project-write 5xx/timeouts attributable to the FIU-1 revision.
- Residual risk: Without existing request-level latency telemetry, attribution and comparison may be coarse.
- Mitigation classification: `PARTIALLY_MITIGATED_WITHOUT_CODE`.

### BY-R3 - AuditService availability

- Risk: Evidence persistence depends on AuditService and the existing database path.
- BX severity: MEDIUM.
- Failure mode: AuditService or AuditLog persistence is unavailable, causing evidence loss; a wider database failure may also affect Project writes.
- Detection signal: The adapter's server-side error on failed logging, database errors, Project create/update outcomes, and presence/absence of expected evidence rows.
- Existing control: `EXISTING_CONTROL` - `BEST_EFFORT_WITH_ERROR_VISIBILITY`; the adapter catches failures and logs the operation and Project ID. BX validation passed the audit-failure unit test. Production log access/retention and operator query access were not established by repository evidence.
- Proposed pre-deployment mitigation: In the authorization package, identify the operator and verify read access to the runtime error logs and the existing AuditLog records needed for the observation. Do not perform fault injection; it is not authorized.
- Proposed runtime observation: Review AuditService error messages and database error signals alongside Project write outcomes and expected evidence rows.
- Proposed alert/decision threshold: `PROPOSED_THRESHOLD_FOR_DEPLOYMENT_AUTHORIZATION` - any repeated AuditService failures, or inability to observe failures during the approved window, stops rollout pending investigation. This is a proposed decision rule, not an existing configured alert.
- Operator action: Preserve error timestamps/request identifiers and affected Project IDs; determine whether business writes continued; escalate through the operational owner/runbook identified by the authorization package.
- Rollback trigger: Repeated evidence failures without reliable visibility, or any associated degradation to Project business writes.
- Residual risk: Best-effort handling intentionally permits evidence loss; production observability access remains an unverified operational dependency until confirmed.
- Mitigation classification: `UNVERIFIED_OPERATIONAL_DEPENDENCY`.

### BY-R4 - Best-effort evidence gaps

- Risk: A successful Project write can remain successful when evidence persistence fails.
- BX severity: MEDIUM.
- Failure mode: Project create/update succeeds but its corresponding audit evidence is missing or incomplete.
- Detection signal: Correlate successful Project operations with `PROJECT_CREATED`/`PROJECT_UPDATED` evidence using available request IDs, timestamps, Project IDs, and action metadata; review adapter error logs.
- Existing control: `EXISTING_CONTROL` - explicit best-effort error handling and safe evidence construction are covered by targeted tests. FIU-1 does not promise durable exactly-once evidence or automatic reconciliation.
- Proposed pre-deployment mitigation: State this accepted limitation in the authorization request; specify the manual evidence review method, responsible operator, and observation window. Confirm expected evidence semantics against the FIU-1 action/category and allowlisted snapshots.
- Proposed runtime observation: Sample and correlate successful Project writes and resulting AuditLog rows; investigate every visible adapter failure and any unexplained mismatch.
- Proposed alert/decision threshold: `PROPOSED_THRESHOLD_FOR_DEPLOYMENT_AUTHORIZATION` - any unexplained evidence gap or repeated evidence loss pauses rollout for an explicit risk decision; isolated, visible audit failures may remain accepted only if the authorizer explicitly accepts the best-effort limitation and Project business writes remain healthy.
- Operator action: Preserve evidence of the gap and related request/Project identifiers; determine business-write outcome; escalate for acceptance, rollback, or a separate remediation decision. Do not represent missing evidence as a failed Project write.
- Rollback trigger: Repeated or unexplained evidence loss beyond the explicitly accepted observation criteria, or loss of visibility needed to bound gaps.
- Residual risk: Manual reconciliation is not complete or guaranteed. Reliable automatic reconciliation would require a new durable reconciliation capability and is `DEFERRED_REQUIRES_CODE`; it is not implemented by FIU-1 and is not treated as a prerequisite for this best-effort scope.
- Mitigation classification: `PARTIALLY_MITIGATED_WITHOUT_CODE`.

### BY-R5 - AuditLog volume

- Risk: Additive FIU-1 rows increase AuditLog storage and write volume.
- BX severity: MEDIUM.
- Failure mode: Unexpected growth consumes database capacity or affects database performance.
- Detection signal: Compare AuditLog row growth and database/storage pressure before and after rollout using authorized existing database/platform data.
- Existing control: `EXISTING_CONTROL` - AuditLog is an existing database model with indexes, including category/date and Project/date. No FIU-1-specific volume alert or retention policy was established by inspected evidence.
- Proposed pre-deployment mitigation: Record an available baseline for AuditLog growth and database capacity/pressure; identify the authorized operator and confirm access to the relevant data before approval.
- Proposed runtime observation: During the approved window, review AuditLog growth, database errors, and available storage/capacity signals against the baseline.
- Proposed alert/decision threshold: `PROPOSED_THRESHOLD_FOR_DEPLOYMENT_AUTHORIZATION` - stop on unexpected AuditLog growth or database/storage pressure inconsistent with observed Project write volume. No numeric threshold or configured alert is claimed. Automated volume alerts are `DEFERRED_REQUIRES_CONFIG` if the authorization owner requires them; none are added by BY.
- Operator action: Pause rollout, capture volume and pressure observations, assess whether FIU-1 write rates explain growth, and escalate to the database/service owner.
- Rollback trigger: Sustained anomalous growth or database/storage pressure that threatens normal service operation.
- Residual risk: Manual volume review is less timely than an automated alert; available production metrics and operator access must be confirmed.
- Mitigation classification: `UNVERIFIED_OPERATIONAL_DEPENDENCY`.

## E. Low-Risk Confirmation

| Risk | Why BX rated LOW | Existing validation/evidence | Residual deployment verification |
|---|---|---|---|
| DI registration | The adapter is a provider in `ProjectsModule`, with the existing AuditModule/AuditService dependency. | API build and targeted adapter/service/controller tests passed; DI configuration is within the FIU-1 commit. | Confirm the deployed revision starts successfully and Project routes are healthy. |
| Request metadata propagation | Controller passes the existing request context to the service and adapter; AuditService extracts request ID, IP, and user agent. | Targeted tests cover request-context forwarding and request correlation; existing extraction code was inspected. | Confirm expected request metadata is present in approved post-deployment evidence samples without exposing sensitive data. |
| Rollback simplicity | No schema/migration rollback is needed; application behavior is isolated to the API. | BX verified API-only scope and no schema/migration change. | Identify previous known-good revision/image and prove the authorized traffic rollback method before deployment. |
| Database compatibility | FIU-1 uses the existing AuditLog model/columns. | Prisma schema contains existing AuditLog fields used by AuditService; no migration was added. | Confirm target environment's deployed schema matches the existing API contract as part of release validation. |
| Frontend compatibility | No frontend source or external response contract changed. | Exact FIU-1 commit is API implementation/test only; response mapping remains unchanged. | Verify API health and normal Project route responses; no frontend rollout is required for FIU-1. |

## F. Rollback Plan

No rollback was performed or authorized by BY.

### Operational rollback

For a later separately authorized Cloud Run release, the deployment owner should:

1. Identify and record the previous known-good `openstaff-api` Cloud Run revision and image before changing traffic.
2. Use the approved Cloud Run revision traffic-control procedure to stop or redirect traffic away from the FIU-1 revision and restore the previous known-good revision. This is a proposed operational action; no rollback automation or environment-specific command was verified here.
3. Verify API health using the repository runbook's health/status checks.
4. Verify Project read and create/update continuity using an explicitly approved, safe smoke strategy.
5. Verify database health and review relevant AuditService errors/evidence observations.
6. Confirm no schema rollback is required; FIU-1 made no schema change and required no migration.

### Source rollback

If a source rollback is later required, create a new revert commit for FIU-1, validate it, and push through normal governance before a separately authorized redeployment. Do not amend prior commits, rewrite history, reset, or force-push. Do not automatically delete AuditLog rows created while FIU-1 was active; they are additive historical records.

## G. Later Deployment Authorization Package

A separate deployment authorization request must include, at minimum:

- exact source commit/revision and committed-source build isolation;
- exact target environment and GCP project;
- exact Cloud Run service (`openstaff-api`) and region;
- previous known-good revision/image and the approved rollback method;
- pre-deployment validation results, including baseline source/window and known limitations;
- post-deployment API health checks;
- Project read smoke and an explicitly approved safe create/update smoke strategy;
- AuditLog evidence inspection and correlation strategy;
- permission regression strategy for existing owner/admin behavior;
- observation window, responsible operator, and authorization record required by applicable repository governance;
- confirmation of operator access to runtime logs and AuditLog/database observations;
- explicit acceptance criteria for proposed stop/rollback thresholds and residual best-effort evidence risk.

This section defines request contents, not an authorization or deployment procedure.

## H. Authorization-Readiness Classification

`FIU1_AUTHORIZATION_REQUEST_READY_WITH_MITIGATIONS`

All five MEDIUM risks have actionable, non-code operator controls sufficient to formulate a separate controlled deployment authorization request. Runtime log/database access and the responsible operator are unverified operational dependencies and must be confirmed in that authorization package before approval. Automated volume alerting is deferred pending configuration if required; durable automatic evidence reconciliation is deferred pending code and is not part of FIU-1's accepted best-effort contract.

This readiness classification does not mean deployment is authorized.

## I. Governance Non-Effect

`EXEC-78G.10BY is planning/readiness evidence only.`

It does not deploy FIU-1; authorize deployment; activate governance authority; change candidate readiness; authorize B4 or G.11; reconstruct BN; create Response, Participation, acting entity, or governance authority; or create a compliance determination engine.

| Governance item | Preserved state |
|---|---|
| Candidate | `NOT_READY` |
| B4 | `BLOCKED - NOT AUTHORIZED` |
| G.11 | `BLOCKED - NOT AUTHORIZED` |
| BN | `NEVER_MATERIALIZED` |
| Deployment performed | NO |
| Deployment authorized | NO |

## J. BY Verdict

`EXEC-78G.10BY PASS WITH DEFERRALS`

The risk package is sufficiently defined to formulate a later authorization request. Production observability access must be confirmed at that gate; automatic volume alerting may require configuration, and durable automatic evidence reconciliation would require a separate code change. No deployment authorization or operational effect is implied.
