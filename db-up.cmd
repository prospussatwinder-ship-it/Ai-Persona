@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo ========================================
echo  Persona Platform - Docker DB + Prisma
echo ========================================
echo.

docker info >nul 2>&1
if errorlevel 1 ( 
    echo [ERROR] Docker is not running. Open Docker Desktop and wait for "Engine running".
    pause
    exit /b 1
)

echo [1/5] Starting containers...
docker compose -f infra\docker-compose.yml up -d
if errorlevel 1 (
    echo [1b] Full stack failed - trying Postgres only...
    docker compose -f infra\docker-compose.yml up -d postgres
)
if errorlevel 1 (
    echo [ERROR] docker compose failed. Fix internet/VPN/antivirus, or use: docker load -i your-image.tar
    pause
    exit /b 1
)

echo [2/5] Waiting for Postgres...
timeout /t 8 /nobreak >nul

echo [3/5] CREATE EXTENSION vector...
docker exec phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;"
if errorlevel 1 (
    echo [WARN] pgvector step failed - Postgres may still be starting. Wait 15s and run:
    echo   docker exec -it phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;"
)

echo [4/5] Prisma migrate...
if not exist "packages\db\.env" copy "packages\db\.env.example" "packages\db\.env"
cd packages\db
call npx prisma migrate deploy
if errorlevel 1 (
    echo migrate deploy failed - trying db push for local dev...
    call npx prisma db push
)
cd ..\..

echo [5/5] Seed database...
call npm run db:seed

echo.
echo ========================================
echo  Done. Containers:
docker ps --filter "name=phase1" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo  Start API:  npm run dev:api
echo  Start Web: npm run dev:web
echo ========================================
pause
