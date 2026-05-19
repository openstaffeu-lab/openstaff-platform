$ErrorActionPreference = "Stop"

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Require-File {
  param([string]$Path)
  Assert-True (Test-Path $Path) "Missing required file: $Path"
}

function Require-Key {
  param(
    [string]$Path,
    [string]$Key
  )

  $content = Get-Content $Path -Raw
  Assert-True ($content -match "(?m)^$([regex]::Escape($Key))=") "Missing required key '$Key' in $Path"
}

$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
Push-Location $RepoRoot

try {
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  Assert-True ($branch -eq "feature/work-in-progress") "Expected branch feature/work-in-progress, got '$branch'"

  $status = git status --short
  Assert-True ([string]::IsNullOrWhiteSpace($status)) "Working tree is not clean."

  $latestCommit = (git rev-parse --short HEAD).Trim()
  Assert-True (-not [string]::IsNullOrWhiteSpace($latestCommit)) "Could not resolve latest commit."

  $requiredFiles = @(
    ".gcloudignore",
    "apps/admin/api/Dockerfile",
    "apps/admin/web/Dockerfile",
    "apps/admin/Dockerfile",
    "apps/admin/api/cloudbuild.api.yaml",
    "apps/admin/web/cloudbuild.web.yaml",
    "apps/admin/cloudbuild.admin.yaml",
    "apps/admin/api/.env.example",
    "apps/admin/web/.env.example",
    "apps/admin/.env.example",
    "docs/DEPLOYMENT_RUNBOOK.md",
    "docs/INCIDENT_RESPONSE_RUNBOOK.md",
    "docs/RELEASE_GOVERNANCE.md",
    "docs/RUNTIME_CONFIGURATION_GOVERNANCE.md",
    "docs/SLO_BASELINE.md",
    "docs/TECHNICAL_DEBT_REGISTER.md",
    "docs/ARCHITECTURE_BASELINE.md",
    "docs/DEPENDENCY_GOVERNANCE.md",
    "docs/RELEASE_LIFECYCLE_POLICY.md",
    "docs/DATA_LIFECYCLE_POLICY.md",
    "docs/OWNERSHIP_MATRIX.md",
    "docs/FIRST_USER_EXPERIENCE_AUDIT.md",
    "docs/UX_TRUST_REVIEW.md",
    "docs/OPERATOR_SUPPORT_PLAYBOOK.md",
    "docs/SCALE_READINESS_BASELINE.md",
    "docs/PRODUCT_ANALYTICS_BASELINE.md",
    "docs/OPERATIONAL_METRICS_BASELINE.md",
    "docs/FUNNEL_VISIBILITY_BASELINE.md",
    "docs/OPERATIONAL_FEEDBACK_LOOP.md",
    "docs/SUPPORTABILITY_REVIEW.md",
    "docs/ERROR_INTELLIGENCE_BASELINE.md",
    "docs/ROLLOUT_REPORTING_BASELINE.md",
    "docs/COHORT_REVIEW_FRAMEWORK.md",
    "docs/PRODUCT_ITERATION_DECISION_RULES.md",
    "docs/FEEDBACK_TRIAGE_WORKFLOW.md",
    "docs/ADOPTION_READINESS_SCORECARD.md",
    "docs/templates/COHORT_DECISION_REPORT.md",
    "docs/OPERATIONAL_SUSTAINABILITY_REVIEW.md",
    "docs/BUSINESS_CONTINUITY_BASELINE.md",
    "docs/KNOWLEDGE_CONTINUITY_POLICY.md",
    "docs/MAINTENANCE_WINDOW_POLICY.md",
    "docs/PRODUCTION_DRIFT_POLICY.md",
    "docs/LONG_TERM_COST_PROJECTION.md",
    "docs/OPERATIONAL_CAPACITY_LIMITS.md",
    "scripts/gcp/secret-manager-setup.ps1",
    "scripts/gcp/prisma-production-migration-check.ps1",
    "scripts/release/exec-13-release-check.ps1",
    "scripts/release/exec-26-production-ops-check.ps1",
    "scripts/release/exec-26-failure-simulations.ps1"
  )

  foreach ($file in $requiredFiles) {
    Require-File $file
  }

  $apiEnvKeys = @(
    "NODE_ENV",
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGIN",
    "PUBLIC_WEB_URL",
    "ADMIN_WEB_URL",
    "ENABLE_DEV_AUTH_BYPASS",
    "DEMO_MODE",
    "ENABLE_DEMO_PUBLIC_FEED",
    "ENABLE_DEMO_MESSAGING",
    "ENABLE_AI_FALLBACK",
    "ENABLE_BILLING_PLACEHOLDERS"
  )
  foreach ($key in $apiEnvKeys) {
    Require-Key "apps/admin/api/.env.example" $key
  }

  $webEnvKeys = @("NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_WEB_URL", "NEXT_PUBLIC_DEMO_MODE")
  foreach ($key in $webEnvKeys) {
    Require-Key "apps/admin/web/.env.example" $key
  }

  $adminEnvKeys = @("NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_ADMIN_URL", "NEXT_PUBLIC_DEMO_MODE")
  foreach ($key in $adminEnvKeys) {
    Require-Key "apps/admin/.env.example" $key
  }

  $trackedEnvFiles = git ls-files | Select-String -Pattern '(^|/)\.env($|\.local$|\.production$)' | ForEach-Object { $_.ToString() }
  Assert-True (($trackedEnvFiles | Where-Object { $_ -notmatch '\.env\.example$' }).Count -eq 0) "Tracked real .env files detected."

  $bakFiles = Get-ChildItem -Recurse -File -Include *.bak,*.old,*.orig
  Assert-True ($bakFiles.Count -eq 0) "Backup files detected in repository."

  $trackedFiles = git ls-files
  $secretHits = @()
  foreach ($file in $trackedFiles) {
    if ($file -match '(^|/)(package-lock\.json|STATUS\.md)$') { continue }
    if ($file -match '^docs/proof/') { continue }
    if (-not (Test-Path $file)) { continue }
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if ($null -eq $content) { continue }
    if ($content -match '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----') { $secretHits += $file; continue }
    if ($content -match 'AIza[0-9A-Za-z\-_]{20,}') {
      if ($file -match '^apps/admin(/web)?/cloudbuild\.(admin|web)\.yaml$' -and $content -match 'NEXT_PUBLIC_FIREBASE_API_KEY') {
        continue
      }
      $secretHits += $file
      continue
    }
    if ($content -match 'ya29\.[0-9A-Za-z\-_]+') { $secretHits += $file; continue }
    if ($content -match 'postgres(ql)?:\/\/[^:\s]+:[^@\s]+@') {
      if ($file -notmatch '\.env\.example$' -and $content -notmatch 'USER:PASS|OPENSTAFF_DB_USER:OPENSTAFF_DB_PASSWORD|invalid:invalid') {
        $secretHits += $file
        continue
      }
    }
  }
  Assert-True ($secretHits.Count -eq 0) ("Possible secret patterns detected in tracked files: " + ($secretHits -join ", "))

  Push-Location "apps/admin/api"
  try {
    npx.cmd prisma validate
    if ($LASTEXITCODE -ne 0) { throw "API prisma validate failed" }
    npx.cmd prisma generate
    if ($LASTEXITCODE -ne 0) { throw "API prisma generate failed" }
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "API build failed" }
  }
  finally {
    Pop-Location
  }

  Push-Location "apps/admin/web"
  try {
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed" }
  }
  finally {
    Pop-Location
  }

  Push-Location "apps/admin"
  try {
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "Admin build failed" }
  }
  finally {
    Pop-Location
  }

  if ($env:OPENSTAFF_API_RELEASE_URL) {
    $apiResponse = Invoke-WebRequest -UseBasicParsing -Uri "$($env:OPENSTAFF_API_RELEASE_URL.TrimEnd('/'))/health"
    Assert-True ($apiResponse.StatusCode -eq 200) "API release URL health check failed."
  }

  if ($env:OPENSTAFF_WEB_RELEASE_URL) {
    $webResponse = Invoke-WebRequest -UseBasicParsing -Uri $env:OPENSTAFF_WEB_RELEASE_URL
    Assert-True ($webResponse.StatusCode -eq 200) "Web release URL check failed."
  }

  if ($env:OPENSTAFF_ADMIN_RELEASE_URL) {
    $adminResponse = Invoke-WebRequest -UseBasicParsing -Uri $env:OPENSTAFF_ADMIN_RELEASE_URL
    Assert-True ($adminResponse.StatusCode -eq 200) "Admin release URL check failed."
  }

  Write-Host "{`"verdict`":`"PASS`",`"branch`":`"$branch`",`"commit`":`"$latestCommit`"}" -ForegroundColor Green
}
finally {
  Pop-Location
}
