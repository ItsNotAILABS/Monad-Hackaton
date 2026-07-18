# Launch full THESIS workstation: API + Vite web
# Usage: powershell -File scripts/run_all.ps1

$Root = Split-Path -Parent $PSScriptRoot
$Engine = Join-Path $Root "engine"
$Web = Join-Path $Root "web"

Write-Host "THESIS full stack" -ForegroundColor Cyan
Write-Host "Starting API :8043 and Web :5173 ..."

$api = Start-Process -PassThru -WindowStyle Normal powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$Engine'; `$env:PYTHONPATH='.'; python -m uvicorn thesis_forge.api:app --host 127.0.0.1 --port 8043 --reload"
)

Start-Sleep -Seconds 2

$web = Start-Process -PassThru -WindowStyle Normal powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$Web'; npm run dev"
)

Write-Host "API PID $($api.Id)  Web PID $($web.Id)"
Write-Host "Open http://127.0.0.1:5173  — use sticky RUN SYSTEM + POLYGLOT tab"
Write-Host "API docs http://127.0.0.1:8043/docs"
