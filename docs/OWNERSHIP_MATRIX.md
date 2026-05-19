# OpenStaff Ownership Matrix

Last updated: `2026-05-19`  
Scope: `EXEC-27`

## Purpose

This matrix defines who owns which production responsibility so incidents, releases, moderation work, and lifecycle decisions do not depend on guesswork.

## Functional Ownership

| Area | Primary owner | Supporting owner | Escalation owner |
|---|---|---|---|
| application code changes | engineering | Technical Ops | release approver |
| production deploy execution | Technical Ops | engineering | incident commander during incidents |
| rollback execution | Technical Ops | change owner | incident commander for `SEV-1` or `SEV-2` |
| schema migrations | migration owner | Technical Ops | release approver |
| moderation queue | moderation owner | support / operations | incident commander if public exposure risk exists |
| billing review and manual approval | billing owner | support / operations | Technical Ops if runtime or webhook behavior is involved |
| security events and auth posture | security owner | Technical Ops | incident commander |
| dashboards, alerts, uptime checks | Technical Ops | engineering | incident commander if degraded during incident response |
| backups and restore readiness | Technical Ops | engineering | incident commander for recovery scenarios |
| runbooks and governance docs | engineering | Technical Ops | release approver |

## Responsibility Rules

### Engineering

1. owns application correctness
2. owns new config keys and code-level deprecation decisions
3. owns technical debt tracking and architecture baseline updates

### Technical Ops

1. owns deploy mechanics, runtime config wiring, and rollback execution
2. owns Cloud Monitoring, Cloud Logging review, backup visibility, and recovery tooling
3. owns the live service and infrastructure perspective during release execution

### Moderation

1. owns approve/reject decisions for public content and related assets
2. owns queue triage and escalation for moderation backlog or exposure risk

### Billing

1. owns manual upgrade review, invoice handling, and operator-side payment visibility
2. owns the business decision path while billing remains `manual_only`

### Security

1. owns high-risk secret review and security event triage
2. owns escalation input for auth, IAM, and security posture regressions

## Escalation Ownership

1. incident commander owns cross-functional coordination during active incidents
2. release approver owns go/no-go decisions for planned changes
3. Technical Ops owns the emergency rollback mechanism
4. change owner owns post-incident or post-hotfix follow-up work
