# One-shot local setup: Docker DB (optional), Prisma migrate + seed, then print dev commands.
# Run from repo root: powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Test-Docker {
  try {
    docker info 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}

Write-Host "=== Persona Platform — local start ===" -ForegroundColor Cyan

if (Test-Docker) {
  Write-Host "`n[1/3] Docker detected — starting Postgres + Redis (infra/docker-compose.yml)..." -ForegroundColor Yellow
  $envFileArgs = @()
  if (Test-Path "$Root\.env") { $envFileArgs += "--env-file", "$Root\.env" }
  if (Test-Path "$Root\infra\.env") { $envFileArgs += "--env-file", "$Root\infra\.env" }
  docker compose @envFileArgs -f infra/docker-compose.yml up -d
  if ($LASTEXITCODE -ne 0) {
    docker compose @envFileArgs -f infra/docker-compose.yml up -d postgres 2>$null
  }
  if ($LASTEXITCODE -eq 0) {
    Start-Sleep -Seconds 3
    docker exec phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>$null
    Write-Host "       Postgres should be on localhost:5433" -ForegroundColor Green
  } else {
    Write-Host "       Docker compose failed — fix pulls/network or use hosted Postgres (update packages/db/.env)." -ForegroundColor Red
  }
} else {
  Write-Host "`n[1/3] Docker not running — skip compose. Ensure Postgres is up and DATABASE_URL in packages/db/.env is correct." -ForegroundColor Yellow
}

Write-Host "`n[2/3] Prisma migrate + seed..." -ForegroundColor Yellow
Set-Location "$Root\packages\db"
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "       Created packages/db/.env from .env.example" -ForegroundColor Gray
}
npx prisma migrate deploy 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "       migrate deploy failed — trying db push (dev only)..." -ForegroundColor Yellow
  npx prisma db push 2>&1
}
Set-Location $Root
npm run db:seed 2>&1

Write-Host "`n[3/3] Start apps (two terminals):" -ForegroundColor Green
Write-Host "  Terminal A:  npm run dev:api" -ForegroundColor White
Write-Host "  Terminal B:  npm run dev:web   (optional: apps/ai FastAPI on 8001)" -ForegroundColor White
Write-Host "  Web: http://localhost:3002  API: http://localhost:3001/v1/health`n" -ForegroundColor Cyan
