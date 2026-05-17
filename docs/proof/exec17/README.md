# EXEC-17 Performance Proof

Captured on: `2026-05-17`

Tooling:
- `npx.cmd --yes lighthouse`
- Chrome binary: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Artifacts:
- `lighthouse-home.json`
- `lighthouse-jobs.json`
- `lighthouse-publish.json`

Notes:
- Lighthouse returned a Windows temp-directory cleanup `EPERM` after each run, but the JSON reports were written successfully and were used as the operator-side proof trail.
- No application rebuild or redeploy was required for this phase; the active production revisions remained:
  - API: `openstaff-api-00007-4bj`
  - Public web: `openstaff-web-00009-q46`
  - Admin: `openstaff-admin-00010-t76`

## Summary

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `https://openstaff.eu/` | 94 | 77 | 100 | 100 | 1017 ms | 2931 ms | 104 ms | 0.000 | 1304 ms |
| `https://openstaff.eu/jobs` | 78 | 92 | 100 | 100 | 978 ms | 1878 ms | 102 ms | 0.524 | 1369 ms |
| `https://openstaff.eu/publish` | 90 | 89 | 100 | 100 | 1004 ms | 2128 ms | 378 ms | 0.000 | 1388 ms |

## Non-blocking follow-up recommendations

1. Investigate layout stability on `/jobs`; `CLS = 0.524` is the largest user-facing performance risk in this baseline.
2. Review scripting and hydration cost on `/publish`; `TBT = 378 ms` is acceptable for smoke but the most improvable interaction metric here.
3. Run a focused accessibility sweep on the homepage to lift the current score of `77`.
