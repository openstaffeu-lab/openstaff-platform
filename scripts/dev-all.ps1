$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $root ".logs"

if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$npm = "C:\Program Files\nodejs\npm.cmd"
$firebaseLog = Join-Path $logsDir "emulators.log"
$apiEnvPath = Join-Path $root "apps\admin\api\.env"

function Get-EnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  if (-not (Test-Path $Path)) {
    return $null
  }

  $prefix = "$Key="
  $line = Get-Content $Path | Where-Object { $_.StartsWith($prefix) } | Select-Object -First 1

  if (-not $line) {
    return $null
  }

  $rawValue = $line.Substring($prefix.Length).Trim()
  return $rawValue.Trim('"')
}

function Start-BackgroundCmd {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Title,
    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory,
    [Parameter(Mandatory = $true)]
    [string]$CommandLine
  )

  Start-Process cmd.exe `
    -ArgumentList @("/d", "/c", $CommandLine) `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden

  Write-Output "Started $Title"
}

# Check PostgreSQL on localhost:5432, try starting a Windows service if one exists.
$pgReady = $false
$maxWait = 15
$waited = 0
while (-not $pgReady -and $waited -lt $maxWait) {
  try {
    $conn = New-Object System.Net.Sockets.TcpClient
    $conn.Connect("localhost", 5432)
    $pgReady = $true
    $conn.Close()
  } catch {
    if ($waited -eq 0) {
      $svc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue |
        Where-Object { $_.Status -ne 'Running' } |
        Select-Object -First 1
      if ($svc) {
        Start-Service $svc.Name -ErrorAction SilentlyContinue
      }
    }

    Start-Sleep -Seconds 2
    $waited += 2
  }
}

if (-not $pgReady) {
  Write-Host "PostgreSQL nu raspunde pe :5432" -ForegroundColor Yellow
  Write-Host "Verifica serviciul Windows PostgreSQL sau DATABASE_URL cloud" -ForegroundColor Yellow
  Write-Host "Continua oricum cu restul serviciilor..." -ForegroundColor Gray
}

$databaseUrl = Get-EnvValue -Path $apiEnvPath -Key "DATABASE_URL"
if (-not $databaseUrl) {
  Write-Warning "apps/admin/api/.env does not define DATABASE_URL. Prisma migrations and PostgreSQL-backed API features may fail."
} elseif ($databaseUrl -notmatch '^postgres(ql)?:\/\/') {
  Write-Warning "apps/admin/api/.env DATABASE_URL is not a PostgreSQL connection string. Current value is incompatible with prisma/schema.prisma."
}

$firebaseCommand = Get-Command firebase -ErrorAction SilentlyContinue
if ($firebaseCommand) {
  $firebaseCmdLine = "`"$($firebaseCommand.Source)`" emulators:start --project demo-openstaff > `"$firebaseLog`" 2>&1"
  Start-BackgroundCmd `
    -Title "openstaff-emulators" `
    -WorkingDirectory $root `
    -CommandLine $firebaseCmdLine

  Write-Output "  log: $firebaseLog"
} else {
  Write-Output "Firebase CLI not found. Continuing without emulators."
}

$apiLog = Join-Path $logsDir "api.log"
$adminLog = Join-Path $logsDir "admin.log"
$publicLog = Join-Path $logsDir "public.log"

$apiCmdLine = "set PORT=8080&& `"$npm`" run start:dev > `"$apiLog`" 2>&1"
$adminCmdLine = "set NEXT_PUBLIC_API_URL=http://localhost:8080&& set NEXT_PUBLIC_USE_EMULATORS=true&& `"$npm`" run dev -- --hostname 127.0.0.1 --port 3001 > `"$adminLog`" 2>&1"
$publicCmdLine = "set NEXT_PUBLIC_API_URL=http://localhost:8080&& set NEXT_PUBLIC_USE_EMULATORS=true&& `"$npm`" run dev -- --hostname 127.0.0.1 --port 3000 > `"$publicLog`" 2>&1"

Start-BackgroundCmd -Title "openstaff-api" -WorkingDirectory (Join-Path $root "apps\admin\api") -CommandLine $apiCmdLine
Write-Output "  log: $apiLog"

Start-BackgroundCmd -Title "openstaff-admin" -WorkingDirectory (Join-Path $root "apps\admin") -CommandLine $adminCmdLine
Write-Output "  log: $adminLog"

Start-BackgroundCmd -Title "openstaff-public" -WorkingDirectory (Join-Path $root "apps\admin\web") -CommandLine $publicCmdLine
Write-Output "  log: $publicLog"

Write-Output ""
Write-Output "OpenStaff local stack targets:"
Write-Output "  Public app : http://localhost:3000"
Write-Output "  Admin app  : http://localhost:3001"
Write-Output "  API        : http://localhost:8080"
Write-Output "  Auth emu   : http://localhost:9099"
Write-Output "  DB emu     : http://localhost:8090"
Write-Output "  Storage emu: http://localhost:9199"
Write-Output "  Emulator UI: http://localhost:4000"
Write-Output ""
Write-Output "Tail logs with:"
Write-Output "  Get-Content .logs\\public.log -Wait"
Write-Output "  Get-Content .logs\\admin.log -Wait"
Write-Output "  Get-Content .logs\\api.log -Wait"
Write-Output "  Get-Content .logs\\emulators.log -Wait"
