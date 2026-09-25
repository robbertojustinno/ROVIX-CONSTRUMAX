$ErrorActionPreference = "SilentlyContinue"
$InstallRoot = $PSScriptRoot
$DataRoot = Join-Path $env:ProgramData "ROVIX\CONSTRUMAX"
$AppPidFile = Join-Path $DataRoot "config\app.pid"
$PgCtl = Join-Path $InstallRoot "runtime\postgresql\bin\pg_ctl.exe"
$PgData = Join-Path $DataRoot "data\postgres"

if(Test-Path $AppPidFile){
  $pidValue=[int](Get-Content $AppPidFile -Raw)
  Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
  Remove-Item $AppPidFile -Force -ErrorAction SilentlyContinue
}
if((Test-Path $PgCtl) -and (Test-Path (Join-Path $PgData "PG_VERSION"))){
  & $PgCtl -D $PgData stop -m fast | Out-Null
}
