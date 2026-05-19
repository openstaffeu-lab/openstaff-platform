# Attention Routing Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-38`

## Purpose

This baseline defines how the operational compression layer may route attention without routing authority.

## Urgent Vs Important

### Urgent

Urgent means the operator should review it before normal queue work continues.

Examples:

1. readiness errors
2. hard blockers
3. clear auth or upload failure bursts
4. queue pressure combined with owner ambiguity
5. stale summary combined with active warnings

### Important

Important means the issue should be reviewed soon, but it does not justify panic language or immediate interruption by itself.

Examples:

1. rising support pressure
2. moderate queue aging
3. repeated confusion
4. billing review backlog
5. adoption-readiness reasons without runtime degradation

## Operator-Routing Heuristics

Attention routing may:

1. send blockers and errors to the top of the page
2. move queue items with oldest-age pressure ahead of fresher items
3. group billing, moderation, and support pressure into one compressed story
4. move freshness warnings into the orientation layer
5. point operators toward the next source to inspect

Attention routing may not:

1. assign ownership automatically
2. page or escalate automatically
3. close queues automatically
4. pause rollout automatically

## Queue Escalation Heuristics

The first attention-routing layer may show that escalation review is warranted when:

1. support backlog signals rise
2. repeated confusion persists
3. failed flows rise
4. moderation or billing aging crosses the visible advisory thresholds

It must still say that escalation requires operator confirmation.

## Overload Indicators

Overload indicators may use:

1. support backlog signals
2. operator escalation count
3. repeated confusion
4. moderation backlog and age
5. billing backlog and age

They may not infer hidden staffing state or invisible service capacity.

## Stale Review Indicators

The surface must show stale review indicators when:

1. the `/status` snapshot is aging
2. the `/status` snapshot is stale
3. timestamp ownership is unclear
4. source metrics are present but too old to guide active escalation safely

## Degraded-Mode Visibility

The compression layer may show:

1. not indicated
2. review degraded-mode posture

It may not declare degraded mode automatically.

## Interruption Minimization Rules

Attention routing should reduce interruption cost by:

1. grouping related signals
2. keeping quiet-state wording neutral
3. avoiding repeated warning text across multiple surface levels
4. highlighting freshness once before detail sections
5. routing toward one next check instead of many parallel suggestions

## Authority Boundary

No automatic escalation is allowed.

Routing attention is acceptable. Escalating authority is not.

## Final Assessment

Attention routing is safe when it helps operators choose where to look next without silently changing who decides what happens next.
