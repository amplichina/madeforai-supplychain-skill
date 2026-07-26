$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Node = "C:\Users\kouzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

Set-Location $ProjectRoot

$env:DATABASE_URL = "postgresql://madeforai@127.0.0.1:5432/madeforai"
$env:PORT = "3000"
$env:MCP_TRANSPORT = "http"
$env:MCP_DEV_MEMORY_STORE = "false"

Write-Host "Starting MadeForAI with persistent PostgreSQL on http://localhost:3000"
Write-Host "Operator console: http://localhost:3000/operator"
Write-Host "Keep this window open while testing."

& $Node "dist/src/index.js" "--http"
