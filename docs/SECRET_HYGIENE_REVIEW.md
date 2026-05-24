# OpenStaff Secret Hygiene Review

Date: 2026-05-24  
Execution: `EXEC-63`

## Summary

EXEC-63 rechecked repository hygiene around secrets and runtime artifacts. No active secret files were found committed in the tracked diff reviewed during this execution. Ignored local secret files remain a local operational risk and should stay covered by process and CI scanning.

## Verified local-but-untracked sensitive files

These files exist locally and should remain untracked:

- `firebase-admin-openstaff-platform.json`
- `smtp.txt`
- `apps/admin/api/.env`
- `apps/admin/.env.local`

## Repo hygiene actions completed

- removed `apps/admin/api/prisma/dev.db` from the Git index
- removed tracked sample upload artifacts from `apps/admin/api/uploads/profiles/...`
- kept build artifacts outside version control

## Remaining hygiene guidance

1. keep all operational secrets in Secret Manager or an equivalent vault
2. keep local `.env` and credential files ignored and off shared channels
3. add secret scanning to CI for push and PR workflows
4. rotate credentials immediately if a local secret file is ever exposed or mis-shared

## Recommended CI secret scanning guidance

- scan tracked content on every PR and protected-branch push
- fail on clear credential patterns and known provider key formats
- allow a documented exception workflow for false positives
- keep the scanner read-only and non-destructive
