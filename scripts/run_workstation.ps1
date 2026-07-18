# THESIS workstation launcher (Windows)
# Terminal A: API  ·  Terminal B: Web (or run both with -Both)
param(
  [switch]$Both,
  [int]$ApiPort = 8043,
  [int]$WebPort = 5173
)

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "THESIS workstation root: $Root" -ForegroundColor Cyan

function Start-Api {
  Set-Location "$Root\engine"
  python -m pip install -e ".[dev]" -q
  Write-Host "API http://127.0.0.1:$ApiPort" -ForegroundColor Green
  python -m uvicorn thesis_forge.api:app --reload --port $ApiPort
}

function Start-Web {
  Set-Location "$Root\web"
  if (-not (Test-Path node_modules)) { npm install --no-fund --no-audit }
  $env:VITE_API_URL = "http://127.0.0.1:$ApiPort"
  Write-Host "WEB http://127.0.0.1:$WebPort (or Vite port)" -ForegroundColor Green
  npm run dev -- --port $WebPort
}

if ($Both) {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\engine'; python -m uvicorn thesis_forge.api:app --reload --port $ApiPort"
  Start-Sleep -Seconds 2
  Start-Web
} else {
  Write-Host "Starting API only. Use -Both for API+Web, or run web separately." -ForegroundColor Yellow
  Start-Api
}
