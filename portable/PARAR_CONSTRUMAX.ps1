$ErrorActionPreference = "SilentlyContinue"

$Root = $PSScriptRoot
$AppPidFile = Join-Path $Root "config\app.pid"
$PgCtl = Join-Path $Root "runtime\postgresql\bin\pg_ctl.exe"
$PgData = Join-Path $Root "data\postgres"

if(Test-Path $AppPidFile){
  $pidValue = [int](Get-Content $AppPidFile -Raw)
  Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
  Remove-Item $AppPidFile -Force -ErrorAction SilentlyContinue
}

if((Test-Path $PgCtl) -and (Test-Path (Join-Path $PgData "PG_VERSION"))){
  & $PgCtl -D $PgData stop -m fast | Out-Null
}

Write-Host "ROVIX CONSTRUMAX encerrado." -ForegroundColor Green
Start-Sleep -Seconds 2
