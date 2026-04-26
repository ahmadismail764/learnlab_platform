# start-backend.ps1 — Start PostgreSQL + Django backend server
# Usage: bun run backend (from frontend/)

$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path "$PSScriptRoot\..\.."
$VENV_PYTHON = Join-Path $ROOT "venv\Scripts\python.exe"
$BACKEND_DIR = Join-Path $ROOT "backend"

Write-Host ""
Write-Host "  LearnLab Backend Launcher" -ForegroundColor Cyan
Write-Host "  =========================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Check venv ---
if (-not (Test-Path $VENV_PYTHON)) {
    Write-Host "  [ERROR] Virtual environment not found at: $ROOT\venv" -ForegroundColor Red
    Write-Host "  Run: python -m venv $ROOT\venv" -ForegroundColor Yellow
    Write-Host "  Then: $ROOT\venv\Scripts\pip.exe install -r $BACKEND_DIR\requirements.txt" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] Virtual environment found" -ForegroundColor Green

# --- 2. Check & start PostgreSQL ---
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if (-not $pgService) {
    Write-Host "  [ERROR] PostgreSQL service not found. Is PostgreSQL installed?" -ForegroundColor Red
    exit 1
}

if ($pgService.Status -ne "Running") {
    Write-Host "  [..] PostgreSQL is stopped — starting..." -ForegroundColor Yellow
    try {
        Start-Service -Name $pgService.Name -ErrorAction Stop
        Write-Host "  [OK] PostgreSQL started" -ForegroundColor Green
    } catch {
        Write-Host "  [..] Need admin privileges to start PostgreSQL..." -ForegroundColor Yellow
        Start-Process powershell -Verb RunAs -ArgumentList "-Command Start-Service -Name '$($pgService.Name)'" -Wait
        Start-Sleep -Seconds 2
        $pgService = Get-Service -Name "postgresql*"
        if ($pgService.Status -eq "Running") {
            Write-Host "  [OK] PostgreSQL started (admin)" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] Could not start PostgreSQL" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "  [OK] PostgreSQL is running" -ForegroundColor Green
}

# --- 3. Run migrations ---
Write-Host "  [..] Checking migrations..." -ForegroundColor Yellow
& $VENV_PYTHON (Join-Path $BACKEND_DIR "manage.py") migrate --check 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [..] Applying pending migrations..." -ForegroundColor Yellow
    & $VENV_PYTHON (Join-Path $BACKEND_DIR "manage.py") migrate 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Migration failed — server may still work" -ForegroundColor Yellow
    } else {
        Write-Host "  [OK] Migrations applied" -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] All migrations up to date" -ForegroundColor Green
}

# --- 4. Start Django server ---
Write-Host ""
Write-Host "  Starting Django server on http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

Set-Location $BACKEND_DIR
& $VENV_PYTHON manage.py runserver
