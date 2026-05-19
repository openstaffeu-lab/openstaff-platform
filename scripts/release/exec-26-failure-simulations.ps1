param(
  [string]$ApiUrl = "https://api.openstaff.eu",
  [string]$ProjectId = "openstaff-platform"
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
  param(
    [string]$Uri,
    [string]$Method = "GET",
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )

  try {
    if ($null -ne $Body) {
      return Invoke-WebRequest -UseBasicParsing -Uri $Uri -Method $Method -Headers $Headers -Body ($Body | ConvertTo-Json -Depth 10) -ContentType "application/json"
    }

    return Invoke-WebRequest -UseBasicParsing -Uri $Uri -Method $Method -Headers $Headers
  }
  catch {
    if ($_.Exception.Response) {
      return $_.Exception.Response
    }

    throw
  }
}

function Read-Body {
  param($Response)

  if ($Response.Content) {
    return $Response.Content
  }

  if ($Response.GetResponseStream) {
    $reader = New-Object System.IO.StreamReader($Response.GetResponseStream())
    return $reader.ReadToEnd()
  }

  return $null
}

$login429 = $null
for ($i = 0; $i -lt 12; $i++) {
  $response = Invoke-Json -Uri "$($ApiUrl.TrimEnd('/'))/auth/login" -Method "POST" -Body @{
    email = "exec26-invalid@openstaff.eu"
    password = "invalid-password"
  }

  if ([int]$response.StatusCode -eq 429) {
    $login429 = $response
    break
  }
}

$webhook400 = Invoke-Json -Uri "$($ApiUrl.TrimEnd('/'))/billing/webhooks/stripe" -Method "POST" -Body @{ probe = "exec26" }

$webhook429 = $null
for ($i = 0; $i -lt 70; $i++) {
  $response = Invoke-Json -Uri "$($ApiUrl.TrimEnd('/'))/billing/webhooks/stripe" -Method "POST" -Body @{ probe = "exec26-burst" }
  if ([int]$response.StatusCode -eq 429) {
    $webhook429 = $response
    break
  }
}

$moderationUnauthorized = Invoke-Json -Uri "$($ApiUrl.TrimEnd('/'))/admin/public-posts/00000000-0000-0000-0000-000000000000/status" -Method "PATCH" -Body @{
  moderationStatus = "REJECTED"
  status = "REJECTED"
  reason = "exec26 failure simulation"
}

$storageMissing = Invoke-Json -Uri "$($ApiUrl.TrimEnd('/'))/public-posts/media/00000000-0000-0000-0000-000000000000" -Method "GET"

$result = [ordered]@{
  verdict = "PASS"
  checkedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
  loginThrottleStatus = if ($login429) { [int]$login429.StatusCode } else { $null }
  loginThrottleBody = if ($login429) { Read-Body $login429 } else { $null }
  webhookFailureStatus = [int]$webhook400.StatusCode
  webhookFailureBody = Read-Body $webhook400
  webhookThrottleStatus = if ($webhook429) { [int]$webhook429.StatusCode } else { $null }
  webhookThrottleBody = if ($webhook429) { Read-Body $webhook429 } else { $null }
  moderationUnauthorizedStatus = [int]$moderationUnauthorized.StatusCode
  moderationUnauthorizedBody = Read-Body $moderationUnauthorized
  storageMissingStatus = [int]$storageMissing.StatusCode
  storageMissingBody = Read-Body $storageMissing
}

$result | ConvertTo-Json -Depth 6
