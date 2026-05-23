# TAXONOMY_GEO_PERSISTENCE_PROOF

Last updated: 2026-05-23

## EXEC-61 Summary

EXEC-61 closes the profile-side taxonomy and geography persistence gap that remained open after EXEC-60.

## What Changed

- `/countries` now seeds a minimal Romania-first baseline when the production country tables are empty
- legacy `/esco` now backfills from live taxonomy rows when the legacy table is empty
- `/profile` now accepts code/name-based geography and taxonomy payloads in addition to brittle relation IDs
- profile relation sync now safely resolves or upserts legacy relation rows before persistence

## Live Proof

Runtime proof run: `exec60-1779554181293`

Confirmed persisted across relogin:

- `country = Romania`
- `region = Bucuresti-Ilfov`
- `city = Bucharest`
- `languages = [ro, en]`
- ESCO codes `7411.1`, `7412.1`
- NACE codes `43.99`, `41.20`
- Uniclass `Ss_25_30_95`

Dataset health during the same proof:

- `/countries -> 200`, `count = 1`
- legacy `/esco -> 200`, `count = 20`

## Verdict

The live onboarding/profile persistence path is now closure-safe for geography and taxonomy selections even when sparse legacy relation-backed tables are present in production.
