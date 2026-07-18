# Copy ONNX Runtime WASM for Transformers.js offline / custom wasmPaths.
# Usage:
#   powershell -File scripts/setup-transformers-assets.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root "web\package.json"))) {
  $Root = (Get-Location).Path
}
$Web = Join-Path $Root "web"
$Out = Join-Path $Web "public\wasm"
$Sources = @(
  (Join-Path $Web "node_modules\onnxruntime-web\dist"),
  (Join-Path $Web "node_modules\@huggingface\transformers\dist")
)

New-Item -ItemType Directory -Force -Path $Out | Out-Null
$copied = 0

foreach ($Dist in $Sources) {
  if (-not (Test-Path $Dist)) { continue }
  Get-ChildItem $Dist -Filter "*.wasm" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item $_.FullName -Destination (Join-Path $Out $_.Name) -Force
    Write-Host "copied $($_.Name) from $Dist"
    $copied++
  }
  Get-ChildItem $Dist -Filter "ort-wasm*.mjs" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item $_.FullName -Destination (Join-Path $Out $_.Name) -Force
    Write-Host "copied $($_.Name)"
    $copied++
  }
}

if ($copied -eq 0) {
  Write-Host "No wasm found. Run: cd web; npm install"
  exit 1
}

Write-Host ""
Write-Host "Done. $copied file(s) to web/public/wasm/"
Write-Host "In LOCAL AI set wasmPaths = /wasm/  (or enable Offline preset)"
Write-Host "Models go in web/public/models/ - see web/public/models/README.md"
