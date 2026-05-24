# OpenStaff API Test Stabilization

Date: 2026-05-24  
Execution: `EXEC-63`

## Objective

Close the API CI blocker where `npm.cmd test -- --runInBand` was failing in `13/14` suites due to incomplete Nest testing setup.

## What changed

- added a reusable testing helper:
  - `apps/admin/api/src/test/testing-module.factory.ts`
- standardized shared mocks for:
  - `PrismaService`
  - `JwtService`
  - `Reflector`
  - `RuntimeConfigService`
  - `AuditService`
  - `AccessControlService`
- replaced partial test-module setup in the failing controller/service specs
- removed the empty-spec condition by rewriting `src/esco/esco.controller.spec.ts` as a real deterministic suite

## Final result

Command:

```powershell
cd apps/admin/api
npm.cmd test -- --runInBand
```

Outcome:

- suites: `14/14 PASS`
- tests: `26/26 PASS`

## Why this matters

- CI can now rely on deterministic API unit/integration-lite coverage
- the auth/taxonomy/project/profile-related surfaces no longer fail only because core providers are missing in tests
- the test harness is reusable for future controller/service additions

## Follow-up recommendation

- extend the shared test factory as new providers become common
- add targeted smoke coverage for `AppModule` boot and selected guarded routes
- keep tests provider-complete rather than bypassing guards with incomplete module setup
