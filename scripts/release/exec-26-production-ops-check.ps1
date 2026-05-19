param(
  [string]$ProjectId = "openstaff-platform",
  [string]$ApiUrl = "https://api.openstaff.eu",
  [string]$WebUrl = "https://openstaff.eu",
  [string]$AdminUrl = "https://backoffice.openstaff.eu",
  [string]$SqlInstance = "openstaff-db"
)

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

function Get-Json {
  param([string]$Uri)
  return Invoke-RestMethod -Uri $Uri -Method Get
}

$health = Get-Json "$($ApiUrl.TrimEnd('/'))/health"
$status = Get-Json "$($ApiUrl.TrimEnd('/'))/status"

Assert-True ($health.status -eq "ok") "API health check did not return status=ok."
Assert-True ($status.status -eq "ok") "API status endpoint did not return status=ok."
Assert-True ($status.db -eq "healthy") "API status endpoint did not report db=healthy."

$webResponse = Invoke-WebRequest -UseBasicParsing -Uri $WebUrl
$loginResponse = Invoke-WebRequest -UseBasicParsing -Uri "$($WebUrl.TrimEnd('/'))/login"
$adminShellResponse = Invoke-WebRequest -UseBasicParsing -Uri $AdminUrl

Assert-True ($webResponse.StatusCode -eq 200) "Homepage check failed."
Assert-True ($loginResponse.StatusCode -eq 200) "Login page check failed."
Assert-True ($adminShellResponse.StatusCode -eq 200) "Admin shell check failed."

$policiesJson = gcloud monitoring policies list --project=$ProjectId --format=json | Out-String
$dashboardsJson = gcloud monitoring dashboards list --project=$ProjectId --format=json | Out-String
$uptimeJson = gcloud monitoring uptime list-configs --project=$ProjectId --format=json | Out-String
$backupsJson = gcloud sql backups list --project=$ProjectId --instance=$SqlInstance --limit=5 --format=json | Out-String

$policies = @()
$dashboards = @()
$uptimeChecks = @()
$backups = @()

if (-not [string]::IsNullOrWhiteSpace($policiesJson)) { $policies = $policiesJson | ConvertFrom-Json }
if (-not [string]::IsNullOrWhiteSpace($dashboardsJson)) { $dashboards = $dashboardsJson | ConvertFrom-Json }
if (-not [string]::IsNullOrWhiteSpace($uptimeJson)) { $uptimeChecks = $uptimeJson | ConvertFrom-Json }
if (-not [string]::IsNullOrWhiteSpace($backupsJson)) { $backups = $backupsJson | ConvertFrom-Json }

Assert-True (($policies | Measure-Object).Count -ge 10) "Expected at least 10 monitoring policies."
Assert-True (($dashboards | Measure-Object).Count -ge 2) "Expected at least 2 dashboards."
Assert-True (($uptimeChecks | Measure-Object).Count -ge 7) "Expected at least 7 uptime checks."
Assert-True (($backups | Measure-Object).Count -ge 1) "Expected at least one Cloud SQL backup entry."

$result = [ordered]@{
  verdict = "PASS"
  checkedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
  healthStatus = $health.status
  runtimeEnvironment = $health.environment
  readinessStatus = $status.status
  databaseStatus = $status.db
  homepageStatus = $webResponse.StatusCode
  loginStatus = $loginResponse.StatusCode
  adminShellStatus = $adminShellResponse.StatusCode
  monitoringPolicies = ($policies | Measure-Object).Count
  dashboards = ($dashboards | Measure-Object).Count
  uptimeChecks = ($uptimeChecks | Measure-Object).Count
  recentBackups = ($backups | Measure-Object).Count
}

$result | ConvertTo-Json -Depth 5
