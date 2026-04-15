@echo off
setlocal
cd /d "%~dp0\apps\ai"

if not exist ".venv\Scripts\python.exe" (
  echo [AI] Creating virtualenv...
  python -m venv .venv
)

echo [AI] Upgrading pip...
call ".venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 (
  echo [AI] Failed to upgrade pip.
  exit /b 1
)

echo [AI] Installing requirements...
call ".venv\Scripts\python.exe" -m pip install -r requirements.txt -r requirements-dev.txt
if errorlevel 1 (
  echo [AI] Dependency install failed.
  exit /b 1
)

if not exist ".env" (
  echo [AI] Creating .env from .env.example...
  copy /y ".env.example" ".env" >nul
)

echo [AI] Starting worker on http://127.0.0.1:8001
call ".venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8001
