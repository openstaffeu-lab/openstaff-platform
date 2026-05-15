$ErrorActionPreference = "Stop"

$ApiPath = Join-Path $PSScriptRoot "..\..\apps\admin\api"
$ApiPath = [System.IO.Path]::GetFullPath($ApiPath)

Write-Host "Running production-safe Prisma migration pre-check..." -ForegroundColor Cyan
Push-Location $ApiPath
try {
  npx.cmd prisma validate
  if ($LASTEXITCODE -ne 0) { throw "prisma validate failed" }

  npx.cmd prisma generate
  if ($LASTEXITCODE -ne 0) { throw "prisma generate failed" }

  npx.cmd prisma migrate status
  if ($LASTEXITCODE -ne 0) { throw "prisma migrate status failed" }

  Write-Host "`nProduction migration check passed." -ForegroundColor Green
  Write-Host "Next manual step for release window: npx.cmd prisma migrate deploy" -ForegroundColor Yellow
}
finally {
  Pop-Location
}
