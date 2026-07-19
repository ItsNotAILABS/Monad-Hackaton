# THESIS polyglot smoke — Julia + Node + Python bridge
# Usage: powershell -File scripts/run_polyglot.ps1

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "=== THESIS Polyglot ===" -ForegroundColor Cyan
Write-Host "Root: $Root"

# Julia
$jl = Join-Path $Root "polyglot\julia\ThesisIntel.jl"
if (Get-Command julia -ErrorAction SilentlyContinue) {
  Write-Host "`n[Julia] pulse" -ForegroundColor Yellow
  julia --startup-file=no --compile=min -O0 $jl pulse "{}"
  Write-Host "`n[Julia] gas" -ForegroundColor Yellow
  julia --startup-file=no --compile=min -O0 $jl gas '{"estimated_gas":80000}'
  Write-Host "`n[Julia] monte_carlo" -ForegroundColor Yellow
  julia --startup-file=no --compile=min -O0 $jl monte_carlo '{"equity":10000,"n":1500}'
} else {
  Write-Host "Julia not on PATH" -ForegroundColor Red
}

# Node
$nodeBridge = Join-Path $Root "polyglot\node\thesis-bridge.mjs"
if (Get-Command node -ErrorAction SilentlyContinue) {
  Write-Host "`n[Node] pulse" -ForegroundColor Yellow
  node $nodeBridge pulse
  Write-Host "`n[Node] wasm-native" -ForegroundColor Yellow
  node $nodeBridge wasm-native
  Write-Host "`n[Node] agent-rank" -ForegroundColor Yellow
  node $nodeBridge agent-rank "{}"
} else {
  Write-Host "Node not on PATH" -ForegroundColor Red
}

# Python bridge
Write-Host "`n[Python] polyglot mesh" -ForegroundColor Yellow
$env:PYTHONPATH = Join-Path $Root "engine"
python -c "from thesis_forge.polyglot import polyglot_mesh, polyglot_catalog; import json; print(json.dumps(polyglot_catalog(), indent=2)); m=polyglot_mesh({'equity':10000}); print('mesh_ok', m.get('ok'), 'winner', m.get('synthesis',{}).get('winner_agent'))"

Write-Host "`nDone." -ForegroundColor Green
