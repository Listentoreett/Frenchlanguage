$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (Get-Command py -ErrorAction SilentlyContinue) {
  Write-Host "Serving with Python at http://127.0.0.1:5173/app/pronunciation-coach/"
  py -3 -m http.server 5173 --bind 127.0.0.1
  exit $LASTEXITCODE
}

if (Get-Command python -ErrorAction SilentlyContinue) {
  Write-Host "Serving with Python at http://127.0.0.1:5173/app/pronunciation-coach/"
  python -m http.server 5173 --bind 127.0.0.1
  exit $LASTEXITCODE
}

if (Get-Command node -ErrorAction SilentlyContinue) {
  node .\scripts\server.mjs
  exit $LASTEXITCODE
}

Write-Error "Install Python 3 or Node.js, or open app/pronunciation-coach/index.html directly."
