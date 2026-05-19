# Unified Intelligence Surface

Last updated: `2026-05-19`  
Scope: `EXEC-38`

## Purpose

This document defines the first unified intelligence surface for OpenStaff operators. It is a single orientation-first surface that compresses operational state before specialists drill down into queue, billing, moderation, or incident details.

## Surface Goal

The surface should answer these questions quickly:

1. what matters first
2. what is merely active
3. what is stale
4. what is safe to defer
5. where operators should look next

## Core Surface Structure

The first unified intelligence surface should contain:

1. compressed operator orientation section
2. unified operational state block
3. grouped operational summaries
4. grouped queue summaries
5. grouped rollout summaries
6. grouped incident summaries
7. detailed queue, digest, and correlation cards as drill-down context

## Single Operator Orientation Surface

The orientation section should appear before specialist detail.

It should contain:

1. a short advisory summary
2. a priority stack
3. a freshness summary
4. attention-routing cues

Its job is to reduce the time between page load and safe first action selection.

## Compressed Operational Digest

The compressed digest should group:

1. runtime posture
2. queue posture
3. rollout posture
4. incident posture
5. operator availability posture

It should not try to replace detailed digests further down the page. It exists to compress orientation, not to eliminate drill-down context.

## Priority Stack

The priority stack should order items by review urgency:

1. blockers and readiness errors
2. operator overload indicators
3. support and escalation pressure
4. moderation pressure
5. billing pressure
6. runtime failure bursts

The stack must never imply that urgency equals automatic escalation.

## Queue Aging Stack

The queue stack should compress:

1. moderation pending and oldest age
2. billing open reviews and oldest age
3. support/escalation pressure

The point is to expose where repeated queue scanning is happening, not to invent hidden queue scores.

## Escalation Stack

The escalation stack should compress:

1. support backlog signals
2. operator escalations
3. repeated confusion
4. failed-flow pressure

It should help operators decide whether to review coordination and ownership sooner, but it may not open or route escalations automatically.

## Deployment Stack

The unified intelligence surface should keep deployment and runtime context lightweight:

1. readiness state
2. runtime environment
3. auth mode
4. queue visibility presence
5. timestamp freshness

It should not turn the page into a raw diagnostics dump.

## Rollout Pressure Stack

Rollout pressure should be visible through:

1. adoption-readiness status
2. adoption reasons
3. funnel conversion posture
4. readiness warnings and errors
5. queue and support pressure that could distort rollout interpretation

## Incident Visibility Stack

Incident visibility should compress:

1. auth bursts
2. upload failure pressure
3. webhook failure pressure
4. readiness warnings and errors
5. unresolved incident warnings

This stack remains advisory and explainable. It must not generate incident declarations automatically.

## Explainability Rules

The unified intelligence surface must:

1. cite visible counts, ages, or readiness messages
2. keep threshold logic readable in human language
3. avoid opaque scoring
4. avoid hidden routing logic

## Timestamp Rules

The surface must:

1. show the snapshot time
2. show whether the snapshot is fresh, aging, stale, or unknown
3. apply that same freshness interpretation consistently across compressed sections

## Source-Link Rules

The surface must:

1. keep the underlying readiness metrics visible on the same page
2. preserve detailed queue, digest, and correlation cards as drill-down context
3. avoid summarizing in ways that make the underlying metric harder to find

## Advisory-Only Rules

The surface may:

1. summarize
2. compress
3. correlate
4. prioritize
5. orient
6. route attention

The surface may not:

1. approve
2. reject
3. activate billing
4. escalate automatically
5. declare incidents automatically
6. assign severity automatically
7. change rollout state
8. perform rollback
9. modify production state autonomously

## Final Assessment

The unified intelligence surface is the first operational compression layer for OpenStaff. It is intentionally narrow: it reduces repeated reasoning first, while keeping all meaningful operational authority explicitly human-owned.
