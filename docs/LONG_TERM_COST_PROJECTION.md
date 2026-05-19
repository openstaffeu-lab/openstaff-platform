# Long-Term Cost Projection

Last updated: `2026-05-19`  
Scope: `EXEC-31`

## Purpose

This projection extends the current cost baseline into the next stage of controlled growth.

## Projected Growth Costs

Expect cost growth from:

1. Cloud SQL compute and connections
2. Cloud SQL storage and backup retention
3. GCS asset growth
4. Cloud Monitoring and logging volume
5. operator time for moderation, support, and billing

## Operational Scaling Costs

As controlled rollout grows:

1. human review cost rises before infrastructure cost becomes dominant in many workflows
2. support and moderation can become the first real scaling expense even before Cloud Run costs change materially

## Moderation Scaling Costs

Moderation cost grows with:

1. more submissions
2. more edge-case explanation work
3. more queue review time

## Storage Growth Expectations

Storage grows through:

1. approved media
2. approved documents
3. retained historical assets
4. soft-delete retention

## Alerting and Noise Growth

Operational noise cost grows with:

1. more traffic
2. more auth failures and abuse noise
3. more dashboards and alerts needing review

## Support Burden Growth

Support cost grows when:

1. onboarding friction remains unresolved
2. moderation wording stays confusing
3. billing clarifications remain repetitive

## Manual Billing Cost Ceiling

Manual billing remains sustainable only while:

1. acknowledgement stays timely
2. invoice follow-up remains understandable
3. operator review does not crowd out moderation and support work

## Projection Guidance

At the current stage, the biggest long-term cost risk is mixed:

1. Cloud SQL remains the main infrastructure baseline cost
2. operator time is the main hidden scaling cost

## Final Assessment

OpenStaff now has a long-term cost projection that makes human operational cost visible alongside infrastructure growth. This is necessary because manual billing, moderation, and support may become the real ceiling before raw infrastructure spend does.
