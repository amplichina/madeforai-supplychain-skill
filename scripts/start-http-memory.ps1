$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Node = "C:\Users\kouzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

Set-Location $ProjectRoot

$env:DATABASE_URL = "postgresql://madeforai:madeforai@localhost:5432/madeforai"
$env:PORT = "3000"
$env:MCP_TRANSPORT = "http"
$env:MCP_DEV_MEMORY_STORE = "true"

Write-Host "Starting MadeForAI Supply Chain Skill on http://localhost:3000/health"
Write-Host "Local memory mode is enabled. Data will reset when this window closes."
Write-Host "Keep this window open while testing."

& $Node "dist/src/index.js" "--http"
