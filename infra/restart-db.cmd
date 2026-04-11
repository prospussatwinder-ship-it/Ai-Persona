@echo off
setlocal
cd /d "%~dp0\.."

echo.
echo === Starting Postgres + Redis (Docker) ===

docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo *** Docker engine is NOT running ***
    echo.
    echo Fix this FIRST ^(your error: dockerDesktopLinuxEngine / cannot find the file^):
    echo   1. Open "Docker Desktop" from the Start menu
    echo   2. Wait 1-2 minutes until the whale icon shows "Engine running"
    echo   3. If it stays stuck: Docker Desktop -^> Troubleshoot -^> Restart
    echo   4. Test in a NEW terminal:  docker info
    echo.
    echo Then run this script again.
    pause
    exit /b 1
)

echo Docker OK. Pulling/starting containers...
echo.

docker compose -f infra\docker-compose.yml up -d
if errorlevel 1 (
    echo.
    echo Full stack failed - trying Postgres only...
    docker compose -f infra\docker-compose.yml up -d postgres
)

if errorlevel 1 (
    echo.
    echo ERROR: docker compose failed. Start Docker Desktop, then run this file again.
    echo If images won't download: check internet / VPN / antivirus HTTPS scanning.
    pause
    exit /b 1
)

echo.
echo Waiting for PostgreSQL...
timeout /t 6 /nobreak >nul

docker exec phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>nul
if errorlevel 1 (
    echo Postgres not ready yet - wait 10s and run manually:
    echo   docker exec -it phase1-postgres psql -U persona -d persona -c "CREATE EXTENSION IF NOT EXISTS vector;"
) else (
    echo pgvector OK.
)

echo.
echo === Containers should be running ===
docker ps --filter "name=phase1" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Next - apply schema and seed data (from repo root):
echo   cd packages\db
echo   npx prisma migrate deploy
echo   cd ..\..
echo   npm run db:seed
echo.
echo Then start API:  npm run dev:api
echo.
pause
