$ErrorActionPreference = "Stop"

$PgRoot = "C:\Users\kouzi\Documents\Codex\pg16"
$PgBin = Join-Path $PgRoot "pgsql\bin"
$env:PGHOST = "127.0.0.1"
$env:PGPORT = "5432"
$env:PGUSER = "madeforai"

$exists = & (Join-Path $PgBin "psql.exe") -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'madeforai'"
$existsText = ($exists | Out-String).Trim()

if ($existsText -ne "1") {
  & (Join-Path $PgBin "createdb.exe") -h 127.0.0.1 -p 5432 -U madeforai madeforai
  Write-Host "Created database: madeforai"
} else {
  Write-Host "Database already exists: madeforai"
}
