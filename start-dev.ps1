# Start the full B.Tech eKart stack (backend + web) for local testing.
#
# Usage (from the repo root):
#   powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
#
# This opens TWO visible terminal windows:
#   1) Django API   -> http://127.0.0.1:8000
#   2) React web    -> http://localhost:5173
#
# It explicitly sets DEBUG=True so a stray process-level DEBUG env var
# (e.g. DEBUG=release) cannot turn on production HTTPS redirects locally.

$ErrorActionPreference = "Stop"

$Root     = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend  = Join-Path $Root "backend"
$Web      = Join-Path $Root "web"
$PyExe    = Join-Path $Backend ".venv\Scripts\python.exe"

Write-Host ""
Write-Host "  B.Tech eKart - dev stack" -ForegroundColor Cyan
Write-Host "  ========================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $PyExe)) {
  Write-Host "  [x] Python venv not found at: $PyExe" -ForegroundColor Red
  Write-Host "      Run:  cd backend; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path (Join-Path $Web "node_modules"))) {
  Write-Host "  [x] web/node_modules missing." -ForegroundColor Red
  Write-Host "      Run:  cd web; npm install" -ForegroundColor Yellow
  exit 1
}

# --- free the ports if something is already listening ---
foreach ($port in 8000, 5173) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    Write-Host "  [i] Port $port in use (pid $($conn.OwningProcess)) - stopping it" -ForegroundColor DarkYellow
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }
}

# --- 1) Backend (Django) in its own window ---
Write-Host "  [>] Starting Django API on http://127.0.0.1:8000 ..." -ForegroundColor Green
$backendCmd = "`$env:DEBUG='True'; `$env:PYTHONUNBUFFERED='1'; Set-Location '$Backend'; & '$PyExe' manage.py migrate --noinput; Write-Host ''; Write-Host 'Django API  ->  http://127.0.0.1:8000' -ForegroundColor Cyan; Write-Host 'Swagger     ->  http://127.0.0.1:8000/api/docs/' -ForegroundColor Cyan; Write-Host 'Django admin->  http://127.0.0.1:8000/admin/' -ForegroundColor Cyan; Write-Host ''; & '$PyExe' manage.py runserver 127.0.0.1:8000"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $backendCmd

# --- wait for the API to answer before starting web ---
$apiUp = $false
for ($i = 1; $i -le 40; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest "http://127.0.0.1:8000/api/health/" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $apiUp = $true; break }
  } catch { }
}
if ($apiUp) {
  Write-Host "  [ok] API is up (health = 200)" -ForegroundColor Green
} else {
  Write-Host "  [!] API did not answer within 40s - check the backend window for errors" -ForegroundColor Yellow
}

# --- 2) Web (Vite) in its own window ---
Write-Host "  [>] Starting React web on http://localhost:5173 ..." -ForegroundColor Green
$webCmd = "Set-Location '$Web'; Write-Host ''; Write-Host 'Website     ->  http://localhost:5173' -ForegroundColor Cyan; Write-Host ''; npm run dev"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $webCmd

Start-Sleep -Seconds 12

Write-Host ""
Write-Host "  =================== READY ===================" -ForegroundColor Cyan
Write-Host "   Website      :  http://localhost:5173" -ForegroundColor White
Write-Host "   Admin panel  :  http://localhost:5173/admin" -ForegroundColor White
Write-Host "   API          :  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "   Swagger docs :  http://127.0.0.1:8000/api/docs/" -ForegroundColor White
Write-Host "   Django admin :  http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host ""
Write-Host "   Student login:  student@btechekart.com / Student@123" -ForegroundColor Yellow
Write-Host "   Admin login  :  admin@btechekart.com   / Admin@123" -ForegroundColor Yellow
Write-Host "  =============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Close the two terminal windows to stop the servers." -ForegroundColor DarkGray
Write-Host ""
