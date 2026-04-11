# Recreate Phase 1 Postgres (pgvector) + Redis after Docker cleanup.
#
# From repo root:
#   powershell -ExecutionPolicy Bypass -File infra\recover-local-db.ps1
# Postgres only (if Redis image pull times out):
#   powershell -ExecutionPolicy Bypass -File infra\recover-local-db.ps1 -PostgresOnly
#
# Requires: Docker Desktop running, and working image pulls (or use -PostgresOnly).

[CmdletBinding()]
param(
  [switch]$PostgresOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Compose reads image overrides from --env-file (repo .env then infra/.env).
$envFileArgs = @()
if (Test-Path "$Root\.env") {
  $envFileArgs += "--env-file", "$Root\.env"
}
if (Test-Path "$Root\infra\.env") {
  $envFileArgs += "--env-file", "$Root\infra\.env"
}

function Test-PostgresContainer {
  $id = docker ps -aq -f "name=phase1-postgres"
  return [bool]$id
}

Write-Host "==> Starting containers (infra/docker-compose.yml)..." -ForegroundColor Cyan

if ($PostgresOnly) {
  docker compose @envFileArgs -f infra/docker-compose.yml up -d postgres
} else {
  docker compose @envFileArgs -f infra/docker-compose.yml up -d
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Full stack failed (often TLS timeout pulling redis:7-alpine)." -ForegroundColor Yellow
    Write-Host "Starting Postgres only so you can migrate + seed. Add Redis when pulls work." -ForegroundColor Yellow
    Write-Host ""
    docker compose @envFileArgs -f infra/docker-compose.yml up -d postgres
  }
}

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "docker compose failed — images could not be downloaded (network/TLS)." -ForegroundColor Red
  Write-Host "Typical fixes:" -ForegroundColor Yellow
  Write-Host "  - Phone hotspot / different network; disable VPN" -ForegroundColor White
  Write-Host "  - Docker Desktop -> Settings -> Proxies (corporate proxy / HTTPS inspection)" -ForegroundColor White
  Write-Host "  - Pause antivirus HTTPS scanning for a test" -ForegroundColor White
  Write-Host "  - Test: docker pull pgvector/pgvector:pg16" -ForegroundColor White
  Write-Host ""
  Write-Host "Offline / air-gapped: on another machine with Docker:" -ForegroundColor Yellow
  Write-Host "  docker pull pgvector/pgvector:pg16" -ForegroundColor Gray
  Write-Host "  docker save pgvector/pgvector:pg16 -o pgvector-pg16.tar" -ForegroundColor Gray
  Write-Host "Copy pgvector-pg16.tar here, then: docker load -i pgvector-pg16.tar" -ForegroundColor White
  Write-Host "Optional Redis tar + load: docker pull redis:7-alpine && docker save ..." -ForegroundColor Gray
  Write-Host ""
  Write-Host "Or use hosted Postgres (Neon/Supabase with pgvector) and set packages/db .env DATABASE_URL — no container needed." -ForegroundColor White
  exit 1
}

if (-not (Test-PostgresContainer)) {
  Write-Host "No container named phase1-postgres. Check: docker compose -f infra/docker-compose.yml ps" -ForegroundColor Red
  exit 1
}

Write-Host "==> Waiting for Postgres to accept connections..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 45; $i++) {
  docker exec phase1-postgres pg_isready -U persona -d persona 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}
if (-not $ready) {
  Write-Host "Postgres did not become ready. Try: docker logs phase1-postgres" -ForegroundColor Red
  exit 1
}

Write-Host "==> Enabling pgvector extension..." -ForegroundColor Cyan
docker exec phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;"

$redisUp = docker ps -q -f "name=phase1-redis"
Write-Host ""
Write-Host "Postgres is up: localhost:5433 (user persona / db persona)" -ForegroundColor Green
if ($redisUp) {
  Write-Host "Redis is up:     localhost:6380" -ForegroundColor Green
} else {
  Write-Host "Redis is NOT running. When Docker Hub works: docker compose -f infra/docker-compose.yml up -d redis" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  cd packages\db" -ForegroundColor White
Write-Host "  (copy .env.example to .env if needed)" -ForegroundColor White
Write-Host "  npm run db:migrate:deploy" -ForegroundColor White
Write-Host "  npm run db:seed" -ForegroundColor White
Write-Host "Then restart: npm run dev:api" -ForegroundColor White
