# OpenStaff SLO Baseline

Last updated: `2026-05-18`  
Scope: `EXEC-26`

## Purpose

This document defines the first operational SLO baseline for OpenStaff. These are governance targets for a controlled-growth platform, not contractual enterprise SLAs.

## Current Maturity Statement

OpenStaff is operating with:

1. active monitoring
2. active alerting
3. active dashboards
4. synthetic monitoring
5. validated PITR and restore rehearsal
6. documented incident, release, security, disaster, and rotation runbooks

The platform is suitable for controlled production operations, but it still has explicit manual business-process limitations and does not yet operate as a staffed 24/7 high-availability service.

## SLO Targets

### API Uptime

Target:

1. `99.5%` monthly availability

Measurement basis:

1. API health and status probes
2. Cloud Run availability

### Auth Availability

Target:

1. `99.5%` monthly successful availability for core login and protected-route access

Measurement basis:

1. synthetic login reachability
2. controlled auth smoke
3. auth failure alerts and operator review

### Moderation/Admin Availability

Target:

1. `99.0%` monthly availability for core admin moderation access

Measurement basis:

1. admin readiness synthetic path
2. `SUPERADMIN` smoke proof during changes
3. moderation failure alerts

### Asset Delivery

Target:

1. `99.0%` monthly availability for approved public asset delivery

Measurement basis:

1. public asset synthetic check
2. storage delivery alerts

### Billing Webhook Processing

Target:

1. `99.0%` monthly successful guarded ingestion and operator-visible failure handling

Measurement basis:

1. webhook reachability
2. signature verification path
3. billing webhook failure alerts and admin queue visibility

### Public Website Availability

Target:

1. `99.5%` monthly homepage and login availability

Measurement basis:

1. homepage synthetic check
2. login synthetic check

## Exclusions

The initial SLO baseline excludes:

1. scheduled maintenance or controlled release windows
2. incidents caused by upstream providers outside reasonable operator control, until mitigation is possible
3. manual commercial processing latency, because billing remains `manual_only`
4. non-production environments

## Accepted Limitations

1. `billingPayments = manual_only`
2. `publicUpgradeFlow = request_upgrade`
3. `operatorReviewRequired = true`
4. `emailDelivery = not_configured`
5. `smsDelivery = not_required`
6. Cloud Run ingress remains `all`
7. public `run.app` URLs remain reachable

## Operational Use

This SLO baseline is intended to:

1. guide incident severity discussions
2. guide release governance
3. make current maturity visible
4. show when the platform needs stronger architecture or staffing before larger growth
