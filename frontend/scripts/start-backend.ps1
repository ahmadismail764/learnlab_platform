# start-backend.ps1 — Start PostgreSQL + Django backend server
# Usage: bun run backend (from frontend/)

$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path "$PSScriptRoot\..\.."
$BACKEND_DIR = Join-Path $ROOT "backend"

$pythonCandidates = @(
    $env:LEARNLAB_PYTHON,
    (Join-Path $ROOT "venv\Scripts\python.exe"),
    (Join-Path $ROOT ".venv\Scripts\python.exe"),
    (Join-Path $BACKEND_DIR "venv\Scripts\python.exe"),
    (Join-Path $BACKEND_DIR ".venv\Scripts\python.exe")
)

$VENV_PYTHON = $null
foreach ($candidate in $pythonCandidates) {
    if ($candidate -and (Test-Path $candidate)) {
        $VENV_PYTHON = $candidate
        break
    }
}

if (-not $VENV_PYTHON) {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        $VENV_PYTHON = $pythonCmd.Source
    }
}

Write-Host ""
Write-Host "  LearnLab Backend Launcher" -ForegroundColor Cyan
Write-Host "  =========================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Check python ---
if (-not $VENV_PYTHON) {
    Write-Host "  [ERROR] Python interpreter not found." -ForegroundColor Red
    Write-Host "  Set LEARNLAB_PYTHON or create a venv at:" -ForegroundColor Yellow
    Write-Host "    $ROOT\venv or $BACKEND_DIR\.venv" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] Python found: $VENV_PYTHON" -ForegroundColor Green

# --- 1b. Check backend dependencies ---
$missingModules = & $VENV_PYTHON -c "import importlib.util as u, sys; mods=['django','corsheaders','django_filters','rest_framework','drf_spectacular','silk','django_extensions','psycopg2']; missing=[m for m in mods if u.find_spec(m) is None]; print('\\n'.join(missing)); sys.exit(1 if missing else 0)"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Missing backend dependencies:" -ForegroundColor Red
    if ($missingModules) {
        $missingModules | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    Write-Host "  Install: $VENV_PYTHON -m pip install -r $BACKEND_DIR\requirements.txt" -ForegroundColor Yellow
    exit 1
}

# --- 2. Check & start PostgreSQL (only when configured) ---
$envPath = Join-Path $BACKEND_DIR ".env"
$dbEngine = $env:DB_ENGINE

if (-not $dbEngine -and (Test-Path $envPath)) {
    $dbEngineLine = Get-Content $envPath | Where-Object { $_ -match '^\s*DB_ENGINE\s*=' } | Select-Object -First 1
    if ($dbEngineLine) {
        $dbEngine = $dbEngineLine -replace '^\s*DB_ENGINE\s*=\s*', ''
        $dbEngine = $dbEngine.Split('#')[0].Trim().Trim('"').Trim("'")
    }
}

$usePostgres = $false
if ($dbEngine -and ($dbEngine -match 'postgres')) {
    $usePostgres = $true
}

if ($usePostgres) {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

    if (-not $pgService) {
        Write-Host "  [ERROR] PostgreSQL service not found. Is PostgreSQL installed?" -ForegroundColor Red
        exit 1
    }

    if ($pgService.Status -ne "Running") {
        Write-Host "  [..] PostgreSQL is stopped - starting..." -ForegroundColor Yellow
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
} else {
    Write-Host "  [..] DB_ENGINE is not PostgreSQL; skipping service check" -ForegroundColor DarkGray
}

# --- 3. Run migrations ---
Set-Location $BACKEND_DIR
Write-Host "  [..] Checking migrations..." -ForegroundColor Yellow
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$checkOutput = & $VENV_PYTHON manage.py migrate --check 2>&1
$checkExit = $LASTEXITCODE
$ErrorActionPreference = $prevErrorAction

if ($checkExit -ne 0) {
    if ($checkOutput) {
        Write-Host "  [..] migrate --check output:" -ForegroundColor DarkGray
        $checkOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    }
    Write-Host "  [..] Applying pending migrations..." -ForegroundColor Yellow
    $migrateOutput = & $VENV_PYTHON manage.py migrate 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Migration failed - server may still work" -ForegroundColor Yellow
        if ($migrateOutput) {
            $migrateOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
        }
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

& $VENV_PYTHON manage.py runserver
