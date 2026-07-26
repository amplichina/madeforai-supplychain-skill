$ErrorActionPreference = "Stop"

$PgRoot = "C:\Users\kouzi\Documents\Codex\pg16"
$PgBin = Join-Path $PgRoot "pgsql\bin"
$Data = Join-Path $PgRoot "data"

& (Join-Path $PgBin "pg_ctl.exe") -D $Data stop

Write-Host "PostgreSQL stopped"
