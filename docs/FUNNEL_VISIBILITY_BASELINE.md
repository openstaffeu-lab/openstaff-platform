# Funnel Visibility Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-29`

## Purpose

This baseline turns controlled rollout from a trust-only exercise into a measurable operational funnel without introducing ad-tech or invasive surveillance.

## Principles

1. no third-party ad trackers
2. privacy-respectful by default
3. server-side event logging preferred where available
4. client-side events used only for page-start visibility that the API cannot infer by itself
5. operator-readable counts matter more than user-level profiling

## Implemented Funnel Events

| Funnel point | Event | Capture mode |
|---|---|---|
| landing page visit | `LANDING_PAGE_VISIT` | lightweight public web beacon to `POST /ops/funnel-events` with session dedupe |
| register started | `REGISTER_STARTED` | lightweight public web beacon to `POST /ops/funnel-events` with session dedupe |
| register completed | `REGISTER_COMPLETED` | server-side event emitted by `AuthService.register(...)` |
| onboarding completed | `ONBOARDING_COMPLETED` | server-side event emitted by `OnboardingService` |
| profile completed | `PROFILE_COMPLETED` | server-side event emitted when profile completion crosses the rollout threshold |
| publish started | `PUBLISH_STARTED` | lightweight public web beacon on authenticated publish entry |
| publish submitted | `PUBLISH_SUBMITTED` | server-side event emitted by `PublicPostsService.create(...)` |
| publish approved | `PUBLISH_APPROVED` | server-side event emitted when moderation moves a post to approved/live |
| upgrade requested | `UPGRADE_REQUESTED` | server-side event emitted by `SubscriptionsService.createUpgradeRequest(...)` |
| upgrade approved | `SUBSCRIPTION_UPGRADE_APPROVED` | server-side event emitted by the approval flow already in production |
| login failure | `LOGIN_FAILED` | server-side security telemetry via `AuditService.logSecurityEvent(...)` |
| upload failure | `UPLOAD_FAILED` | server-side event emitted when media/document persistence fails before storage completes |

## Storage Model

The funnel baseline reuses the existing `NotificationEvent` ledger with:

- `channel = SYSTEM`
- `category = ADMIN`
- `skipNotification = true`
- privacy-safe metadata only

This keeps the implementation inside the existing operational event model instead of introducing a separate analytics vendor or a browser fingerprinting layer.

## Operator Visibility

The active `/status` payload now exposes rollout intelligence summaries:

1. last-24-hour funnel counts
2. onboarding counts
3. moderation backlog counts
4. upgrade request counts
5. failed upload counts
6. failed auth burst counts
7. webhook failure counts
8. recent operator actions

The admin production-readiness page now surfaces these values as rollout-health summaries instead of forcing operators to derive them manually from multiple screens.

## Privacy Constraints

1. no ad pixels, cookies, or marketing trackers were added
2. client events are session-deduped and non-blocking
3. metadata is sanitized and strips obvious secret/token fields
4. operational summary views expose counts and recent operator actions, not user secrets or raw credentials

## Current Baseline Verdict

OpenStaff now has a first real rollout funnel baseline suitable for controlled production adoption. It is intentionally small, operationally truthful, and focused on whether people can enter, complete, publish, request upgrades, and fail safely without ambiguity.
