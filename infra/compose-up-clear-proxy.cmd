@echo off
REM Clears common proxy env vars for this session, then runs compose.
REM Fixes some "HTTP response to HTTPS client" errors when a bad proxy is set.
setlocal
cd /d "%~dp0\.."

set HTTP_PROXY=
set HTTPS_PROXY=
set NO_PROXY=
set http_proxy=
set https_proxy=
set no_proxy=
set ALL_PROXY=
set all_proxy=

echo Proxy env cleared for this window. Starting compose...
docker compose -f infra\docker-compose.yml up -d
if errorlevel 1 (
  echo Trying Postgres only...
  docker compose -f infra\docker-compose.yml up -d postgres
)
echo.
docker ps --filter "name=phase1" --format "table {{.Names}}\t{{.Status}}"
pause
