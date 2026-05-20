# User Onboarding Closure

Last updated: `2026-05-20`  
Scope: `EXEC-42`

## Objective

Close the real onboarding friction observed on `openstaff.eu` so COMPANY and PROFESSIONAL users can:

1. create an account with fewer fields up front
2. recover a password safely
3. complete profile data gradually
4. use smart defaults instead of dense manual entry
5. understand what is pending versus public

## Implemented Flow

### Step 1: Account creation

The public register flow now starts with:

1. account type
2. email
3. password

This keeps the first commitment small and delays dense company or profile data until the user is already inside the guided onboarding flow.

### Step 2: Regional defaults

The register flow now requests and displays:

1. inferred country
2. inferred language
3. inferred timezone
4. optional phone
5. fiscal or VAT code for company users

Defaults are explained as inferred values and remain fully editable.

### Step 3: Company autofill and manual override

The company onboarding step now supports:

1. fiscal or VAT lookup
2. normalized company details
3. explicit lookup status
4. provider and verification messaging
5. manual override for every field

### Step 4: Taxonomy and profile enrichment

The profile completion step now surfaces RELU AI suggestions for:

1. ESCO
2. NACE or category alignment
3. Uniclass
4. missing information
5. positioning summary

Suggestions remain advisory and user-editable.

### Step 5: Verification, uploads, and public visibility

The final onboarding surface now makes clear that:

1. uploads and evidence can be attached before verification submission
2. users can review the editable profile draft before publication
3. owners can see their pending profile and listings
4. the public sees only approved content

## UX Rules Closed In EXEC-42

1. fewer fields per screen
2. required versus optional separation
3. no duplicated identity fields across the first register step
4. progress preserved into the onboarding workspace
5. no internal rollout wording in the newly touched public flow

## Remaining Honest Constraints

1. real password-reset delivery is still constrained by `emailDelivery = not_configured`
2. company lookup currently uses a provider abstraction plus deterministic baseline matches, not a fully live external registry integration
3. old `step-*` onboarding routes still exist and should be retired after the new flow is fully proven live
4. RELU AI suggestions are visible in onboarding, but operator and user workflows still rely on manual confirmation before profile publishing or moderation
