# Admin Assistance UX Review

Last updated: `2026-05-19`  
Scope: `EXEC-35`

## Purpose

This review defines how operational assistance should appear in admin surfaces without implying authority transfer.

## Assistance Surfaces

Operational assistance may appear as:

1. summaries
2. hints
3. aging indicators
4. escalation suggestions
5. operational warnings
6. correlation summaries

## Safe Presentation Rules

Assistance UI should:

1. separate summary from action controls visually
2. label recommendations as advisory
3. preserve the underlying source state for operator verification
4. show unresolved uncertainty instead of hiding it

## Non-Authoritative Wording Rules

Preferred wording:

1. `likely`
2. `suggested`
3. `candidate`
4. `review recommended`
5. `operator attention required`

Avoid wording that implies autonomy:

1. `approved`
2. `resolved`
3. `severity set`
4. `rollback chosen`
5. `escalated automatically`

## Operator Acknowledgment Expectations

When assistance is shown, the UI should make it clear that operators still:

1. acknowledge the recommendation
2. confirm or reject the summary mentally or explicitly
3. decide whether to escalate
4. decide whether to review rollback

## Visibility Hierarchy

The UI should show:

1. operational state and incidents first
2. queue pressure second
3. assistance summaries and hints next
4. deeper correlation or evidence last

## Final Assessment

EXEC-35 defines admin assistance as an orientation layer, not a silent control layer. Good assistance reduces search and re-reading while making operator responsibility more visible, not less visible.
