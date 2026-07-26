$ErrorActionPreference = "Stop"

$PgRoot = "C:\Users\kouzi\Documents\Codex\pg16"
$PgBin = Join-Path $PgRoot "pgsql\bin"
$Data = Join-Path $PgRoot "data"
$Log = Join-Path $PgRoot "postgres.log"

if (-not (Test-Path (Join-Path $Data "PG_VERSION"))) {
  throw "PostgreSQL data directory is missing. Expected: $Data"
}

& (Join-Path $PgBin "pg_ctl.exe") -D $Data -l $Log -o "-h 127.0.0.1 -p 5432" start

Write-Host "PostgreSQL started on 127.0.0.1:5432"
Write-Host "Log: $Log"
