# Real Marketplace Simulation

Date: 2026-05-24  
Proof run: `mmpjop5ry`  
Runtime proof: `docs/proof/exec62/runtime-live.json`

## Result

The live product behaved like a usable marketplace for realistic actor creation, project publishing, moderation, discovery, RELU assistance, media/document readback, anonymous public browsing, and mobile rendering.

Classification: `BETA_READY`

Not production-ready yet because public company discovery is indirect, public ESCO/Uniclass filters are not first-class UI controls, video decode quality is not fully proven, and the web UX fix could not be deployed because Cloud Build source staging returned `storage.objects.get` 403.

## Professional Actors

| Actor | Role | Languages | Proof |
|---|---|---|---|
| Andrei Popescu | Construction manager | ro, en | PHOTO + CV upload, CV extraction `COMPLETED`, RELU assistant `201`, enrich/classify `200` |
| Elena Ionescu | Electrical engineer | ro, en | PHOTO + CV upload, NACE `43.21`, CV extraction `COMPLETED`, RELU non-destructive |
| Mihai Radu | BIM/Revit specialist | ro, en | PHOTO + CV upload, NACE `71.12`, public profile/detail proof |
| Sofia Marin | HVAC technician | ro, en | PHOTO + CV upload, NACE `43.22`, HVAC marketplace matching |
| Radu Constantinescu | Civil engineer | ro, en | PHOTO + CV upload, NACE `42.11`, infrastructure matching |
| Irina Pavel | Project coordinator | ro, en | PHOTO + CV upload, multilingual marketplace content |

## Company Actors

| Company | Shape | Media | Proof |
|---|---|---|---|
| Northgate Construct SRL | General contractor | LOGO, CV, BANNER | capability pool visible; rejected document stayed hidden |
| Danube Engineering Studio SRL | Engineering consultancy | LOGO, CV, BANNER | project owner for retrofit/BIM work |
| Carpathia Facility Services SRL | Facility management company | LOGO, CV, BANNER | project owner for HVAC upgrade |
| ElectroMontaj Partners SRL | Subcontractor pool company | LOGO, CV, BANNER | subcontractor pool visible in public feed |

## Project Posts

| Project | Category | Location | Media | Public proof |
|---|---|---|---|---|
| Bucharest residential structure and envelope coordination | Residential construction | Bucharest | Image | detail `200`, media `200`, document `200` before cleanup |
| Cluj industrial retrofit electrical package | Industrial retrofit | Cluj-Napoca | Image | detail `200`, media `200`, document `200` before cleanup |
| Timis public infrastructure drainage and civil works | Public infrastructure | Timisoara | Image | detail `200`, media `200`, document `200` before cleanup |
| Brasov logistics facility HVAC upgrade | HVAC upgrade | Brasov | Video asset | detail `200`, media `200`, document `200` before cleanup |
| Bucharest BIM coordination for mixed-use fit-out | BIM coordination | Bucharest | Image | detail `200`, media `200`, document `200` before cleanup |

## Cleanup

Temporary public data was removed after browser validation:

- deleted marketplace posts: 17
- hidden users/profiles: 10
- archived identity slugs: 10
- cleanup pass: `true`
- public spot-check after cleanup: sampled project post IDs returned `404`; sampled old profile slugs returned `404`

