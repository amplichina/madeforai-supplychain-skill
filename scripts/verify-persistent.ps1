$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Node = "C:\Users\kouzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$NpmCli = "C:\Users\kouzi\Documents\Codex\2026-04-21-files-mentioned-by-the-user-lite\tools\node-v22.11.0-win-x64\node_modules\npm\bin\npm-cli.js"
$PgRoot = "C:\Users\kouzi\Documents\Codex\pg16"
$PgBin = Join-Path $PgRoot "pgsql\bin"
$Data = Join-Path $PgRoot "data"
$Log = Join-Path $PgRoot "postgres.log"

Set-Location $ProjectRoot

Write-Host "MadeForAI persistent verification starting..."

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command
  )

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE"
  }
}

$existingPostgres = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $existingPostgres) {
  & (Join-Path $PgBin "pg_ctl.exe") -D $Data -l $Log -o "-h 127.0.0.1 -p 5432" start
  Start-Sleep -Seconds 2
}

$env:PGHOST = "127.0.0.1"
$env:PGPORT = "5432"
$env:PGUSER = "madeforai"
$exists = & (Join-Path $PgBin "psql.exe") -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'madeforai'"
if (($exists | Out-String).Trim() -ne "1") {
  & (Join-Path $PgBin "createdb.exe") -h 127.0.0.1 -p 5432 -U madeforai madeforai
}

$env:DATABASE_URL = "postgresql://madeforai@127.0.0.1:5432/madeforai"
$env:MCP_DEV_MEMORY_STORE = "false"
$env:PORT = "3000"
$env:MCP_TRANSPORT = "http"
$env:PATH = "C:\Users\kouzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;" + $env:PATH

Invoke-Checked { & $Node $NpmCli run build }
Invoke-Checked { & $Node $NpmCli test }
Invoke-Checked { & $Node $NpmCli run lint }

$existingHttp = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($existingHttp) {
  foreach ($conn in $existingHttp) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 1
}

$server = Start-Process -FilePath $Node `
  -ArgumentList @("dist/src/index.js", "--http") `
  -WorkingDirectory $ProjectRoot `
  -PassThru `
  -WindowStyle Hidden

Start-Sleep -Seconds 2

try {
  Invoke-Checked { & $Node $NpmCli run smoke:http }

  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1

  $server = Start-Process -FilePath $Node `
    -ArgumentList @("dist/src/index.js", "--http") `
    -WorkingDirectory $ProjectRoot `
    -PassThru `
    -WindowStyle Hidden

  Start-Sleep -Seconds 2
  $health = Invoke-RestMethod -Uri "http://localhost:3000/health"
  if ($health.ok -ne $true) {
    throw "Health check failed after server restart."
  }

  Write-Host "MadeForAI persistent verification passed."
  Write-Host "HTTP server PID: $($server.Id)"
  Write-Host "Operator console: http://localhost:3000/operator"
} catch {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  throw
}
