# OpenStaff Architecture Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-27`

## Purpose

This document defines the current system boundaries so engineering, operations, and governance work from the same model of what owns what.

## System Topology

Production currently operates as:

1. public web on Cloud Run service `openstaff-web`
2. admin/backoffice on Cloud Run service `openstaff-admin`
3. API on Cloud Run service `openstaff-api`
4. PostgreSQL on Cloud SQL instance `openstaff-db`
5. object storage in `gs://openstaff-platform-production`
6. alerting, dashboards, and uptime checks in Cloud Monitoring

## Service Responsibilities

| Surface | Primary responsibility | Must not own |
|---|---|---|
| `apps/admin/web` | public discovery, onboarding, publishing, worker/client experiences | privileged moderation, direct database access, secret-backed decisions |
| `apps/admin` | operator and admin workflows, billing review, moderation, security visibility, readiness views | public marketing UX, direct database access, production secret storage |
| `apps/admin/api` | auth, business rules, moderation, billing, storage orchestration, readiness, audit/security telemetry | public presentation concerns, client-side state, build-time web config |
| Cloud SQL | durable relational state | file delivery, request auth, secret management |
| GCS bucket | approved file storage and delivery | source of truth for billing/auth/business rules |
| Cloud Monitoring | uptime, alerting, dashboards | primary transaction state |

## Boundary Rules

### Public, Admin, and API Separation

1. public and admin apps are frontend clients
2. both frontends depend on API contracts, not database access
3. the API is the only service allowed to enforce business rules
4. production secrets belong in Secret Manager and are consumed by the API runtime only

### Runtime Ownership

1. public web owns public presentation and non-privileged user journeys
2. admin owns privileged operator interfaces
3. API owns workflows, persistence rules, and security enforcement
4. Cloud SQL owns canonical relational data
5. GCS owns binary object persistence for uploads and approved delivery

## Domain Boundaries

### Auth Boundary

1. frontend apps use Firebase client auth and application session APIs
2. API verifies application JWTs for primary runtime access
3. Firebase exchange remains an explicit boundary, not a replacement for API authorization
4. legacy actor-based Firebase guard remains debt, not the target architecture

### Billing Boundary

1. API owns billing profiles, invoices, payments, webhook verification, and admin billing queues
2. admin owns operator review and manual approval actions
3. public web may request upgrades, but it does not directly activate paid plans
4. Stripe is currently a webhook/reconciliation boundary, not a self-serve checkout boundary

### Moderation Boundary

1. public web may submit posts and assets
2. API owns moderation state transitions
3. admin owns approve/reject decisions
4. public delivery depends on approved state only

### Storage Boundary

1. API validates upload eligibility and moderation linkage
2. GCS stores the underlying blobs
3. public access is allowed only for approved assets and approved posts
4. storage cleanup must not remove evidence still needed for moderation, billing, or audit review

### Monitoring Boundary

1. Cloud Monitoring is the source of truth for uptime checks, dashboards, and alert policies
2. Cloud Logging is the source of truth for request-path visibility during incident triage
3. `/status` is an operator summary, not a replacement for infrastructure telemetry

## Architecture Risks Still Open

1. the legacy `Actor/Job` path still overlaps with the official `User/Profile/Project/PublicPost` model
2. some public detail routes still expose fallback behavior when live data is unavailable
3. business operations remain intentionally manual in billing and external notifications

## Architecture Change Rules

Any architecture change must state:

1. which boundary is changing
2. who becomes the new owner
3. what source of truth is being promoted or retired
4. what rollback path still exists
