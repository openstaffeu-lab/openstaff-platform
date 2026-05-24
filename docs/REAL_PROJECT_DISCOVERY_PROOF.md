# Real Project Discovery Proof

Date: 2026-05-24  
Proof run: `mmpjop5ry`

## Discovery Result

Live marketplace discovery worked for the realistic project/professional/pool set before cleanup.

| Check | Result |
|---|---|
| created projects visible in public project feed | `true` |
| created professional posts visible in public professional feed | `true` |
| created subcontractor/company pool posts visible in public pool feed | `true` |
| public internal-label scan | `false` for word-boundary `EXEC`, `test`, `proof` labels |
| public feed response time for discovery batch | 154 ms |

## Filter Proof

| Filter behavior | Count / result |
|---|---|
| `q=HVAC` project search | 1 |
| `q=Bucharest` project search | 2 |
| `q=electrical` project search | 2 |
| category contains `CONSTRUCTION` | 5 |
| geography contains Bucharest | 10 public project results in live feed context |
| NACE `43.21` presence | 5 live feed matches in current data context |
| ESCO data presence | 6 created project/professional records with ESCO data present |
| Uniclass data presence | 6 created project/professional records with Uniclass data present |
| multilingual profile presence | 6 professionals with ro/en |

## Public Routes Covered

Browser proof covered:

- `/`
- `/professionals`
- `/professionals/:id`
- `/jobs`
- `/jobs?category=CONSTRUCTION&region=Bucharest&nace=41.20`
- `/jobs/:id`
- `/profiles/:slug`
- `/pools`

## Gaps

- Public ESCO and Uniclass data exists on records, but there are no first-class public ESCO/Uniclass filter controls yet.
- There is no dedicated public company listing page. Company discovery currently happens through projects and subcontractor pool listings.

