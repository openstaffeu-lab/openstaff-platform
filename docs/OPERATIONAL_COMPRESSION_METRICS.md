# Operational Compression Metrics

Last updated: `2026-05-19`  
Scope: `EXEC-38`

## Purpose

These metrics define how OpenStaff should measure whether the operational compression layer is actually reducing repeated reasoning and context switching.

## Core Metrics

### 1. Time-To-Orientation

Definition:

The elapsed time between opening the operator orientation surface and identifying the first safe review target.

Expectation:

This should fall as the compressed orientation layer becomes clearer.

### 2. Context-Switch Count

Definition:

The number of separate sections, dashboards, or specialist surfaces an operator needs to consult before understanding the current operational picture.

Expectation:

EXEC-38 should reduce intra-page context switching first, then cross-surface context switching later.

### 3. Repeated Investigation Count

Definition:

The number of times the same queue, incident, or rollout story has to be rebuilt from scratch during one operator session.

Expectation:

The compressed layer should reduce repeated reconstruction of moderation, billing, escalation, and rollout state.

### 4. Repeated Queue Review Count

Definition:

How often operators revisit queue counts and oldest-age state simply because the first pass did not make review order obvious.

Expectation:

Grouped queue summaries and the priority stack should reduce this.

### 5. Dashboard Navigation Count

Definition:

How many distinct navigations occur between readiness, billing, moderation, incident, or supporting surfaces before operators can explain the current state coherently.

Expectation:

The readiness page should handle more of the first-pass orientation load itself.

### 6. Escalation Reconstruction Effort

Definition:

The effort required to explain:

1. why escalation review is being considered
2. which queue or signal triggered attention
3. whether overload, confusion, or failure pressure is involved

Expectation:

The compression layer should reduce repeated escalation-story rebuilding.

### 7. Operator Interruption Frequency

Definition:

How often operators abandon one review path because the current surface did not make urgency or freshness clear enough.

Expectation:

Visible freshness and grouped summaries should reduce avoidable interruption churn.

## Interpretation Rules

These metrics must be interpreted carefully:

1. fewer clicks does not automatically mean safer operations
2. faster orientation is only good if source visibility stays intact
3. compression that hides nuance is failure, not success
4. neutral quiet-state wording should reduce scanning cost without hiding risk

## Non-Goals

These metrics are not trying to measure:

1. automatic decision quality
2. autonomous queue handling
3. automatic escalation efficiency
4. machine authority

They measure operator leverage, not operator replacement.

## Final Assessment

Operational compression is only successful if operators can orient faster, switch context less, and rebuild fewer repeated narratives while still seeing the underlying truth clearly.
