# OpenStaff Cost Baseline

Last updated: `2026-05-18`  
Scope: `EXEC-25`

## Executive Summary

OpenStaff production is currently optimized for controlled rollout rather than for high-throughput scale. The largest always-on cost center is Cloud SQL. Cloud Run stays relatively cost-efficient at idle because `minScale = 0`, while storage, logging, monitoring, and Artifact Registry grow more gradually with usage.

This document defines the qualitative cost baseline and the operational signals that should trigger cost review.

## Expected Idle Cost Shape

Primary idle cost contributors:

1. Cloud SQL instance uptime and storage
2. automated backups and PITR log retention
3. GCS storage footprint
4. Cloud Monitoring, uptime checks, and logs
5. Artifact Registry image retention

Near-idle characteristics:

1. Cloud Run API min scale: implicit `0`
2. Cloud Run web min scale: implicit `0`
3. Cloud Run admin min scale: implicit `0`

Implication:

1. the platform does not carry large fixed app-server cost when traffic is low
2. the database remains the dominant steady-state infrastructure cost

## Scaling Ceilings

Current live Cloud Run ceilings:

1. API `maxScale = 10`
2. web `maxScale = 10`
3. admin `maxScale = 5`

Operational implication:

1. current ceilings are aligned to controlled growth and operator-managed moderation/billing
2. meaningful traffic growth will first surface in latency, concurrency, and Cloud SQL connection pressure rather than in massive Cloud Run sprawl

## Biggest Cost Drivers

### Cloud SQL

Primary expected cost driver because it is always on.

Factors:

1. compute tier
2. allocated disk
3. backups
4. PITR / transaction log retention

### Cloud Storage

Growth drivers:

1. public post media
2. public post documents
3. soft-delete retention behavior

### Monitoring and Logging

Growth drivers:

1. Cloud Run request volume
2. structured application logs
3. uptime checks and alerting
4. security/audit visibility

### Artifact Registry

Growth driver:

1. retained build images and revision history

## Expected Growth Areas

### Cloud SQL Growth Expectations

Expect growth from:

1. users
2. public posts and moderation records
3. billing records
4. notifications, audit, and security telemetry

Risk pattern:

1. storage growth is gradual
2. connection pressure and CPU spikes can appear before disk becomes the main problem

### GCS Growth Expectations

Expect growth from:

1. approved public media
2. approved public documents
3. retained historical assets

Risk pattern:

1. storage linearly grows with user-generated content
2. public asset delivery costs become more noticeable only after real usage scale emerges

## Monitoring Signals for Cost Review

Cost review should be triggered when one or more of the following patterns appear:

1. repeated Cloud SQL CPU alerts
2. repeated Cloud SQL connections alerts
3. Cloud SQL storage growth alerts
4. Cloud Run latency or 5xx spikes caused by scaling pressure
5. GCS object growth materially faster than user growth expectations
6. log volume growth that does not match real traffic growth
7. Artifact Registry image count accumulating without retention review

## Current Monitoring Alignment

Relevant live signals already exist through EXEC-24 and EXEC-25:

1. Cloud SQL CPU alerting
2. Cloud SQL connection alerting
3. Cloud SQL storage alerting
4. Cloud Run 5xx alerting
5. Cloud Run latency alerting
6. shared runtime dashboards
7. uptime checks for key public and operator paths

## Cost Anomaly Threshold Guidance

Use these as operator review triggers rather than as finance-grade budgeting rules:

1. repeated Cloud SQL CPU alerts over multiple intervals should trigger sizing review
2. sustained Cloud SQL connection pressure should trigger connection pooling and growth review
3. storage growth alerts should trigger cleanup and retention review
4. Cloud Run spikes without corresponding user growth should trigger abuse or bot review
5. rapid public asset growth should trigger moderation, lifecycle, and storage policy review

## Operational Notes

1. current commercial flow remains manual, so billing automation volume is not yet a major cost driver
2. monitoring breadth increased in EXEC-24 and EXEC-25, which modestly increases observability cost in exchange for earlier incident detection
3. stale rollback assets should not be pruned blindly just to reduce cost; rollback value still outweighs minor short-term savings at the current scale
