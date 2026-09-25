$ErrorActionPreference = "Stop"

$InstallRoot = $PSScriptRoot
$DataRoot = Join-Path $env:ProgramData "ROVIX\CONSTRUMAX"
$PgHome = Join-Path $InstallRoot "runtime\postgresql"
$NodeExe = Join-Path $InstallRoot "runtime\node\node.exe"
$PgData = Join-Path $DataRoot "data\postgres"
$ConfigDir = Join-Path $DataRoot "config"
$LogsDir = Join-Path $DataRoot "logs"
$AppDir = Join-Path $InstallRoot "app"
$ConfigFile = Join-Path $ConfigDir "runtime.json"
$FirstAccess = Join-Path $ConfigDir "PRIMEIRO_ACESSO.txt"
$AppPidFile = Join-Path $ConfigDir "app.pid"

New-Item -ItemType Directory -Force -Path $DataRoot,$ConfigDir,$LogsDir,(Join-Path $DataRoot "data") | Out-Null

function New-Hex([int]$Bytes) {
  $b = New-Object byte[] $Bytes
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($b) } finally { $rng.Dispose() }
  return ([System.BitConverter]::ToString($b)).Replace("-","").ToLowerInvariant()
}

function Test-PortFree([int]$Port) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$Port)
    $listener.Start()
    $listener.Stop()
    return $true
  } catch { return $false }
}

function Pick-Port([int]$Start,[int]$End) {
  for($p=$Start;$p -le $End;$p++){ if(Test-PortFree $p){ return $p } }
  throw "Nenhuma porta livre encontrada entre $Start e $End."
}

if (!(Test-Path $NodeExe)) { throw "Runtime Node não encontrado em $NodeExe" }
if (!(Test-Path (Join-Path $PgHome "bin\initdb.exe"))) { throw "Runtime PostgreSQL não encontrado em $PgHome" }

$firstRun = !(Test-Path $ConfigFile)
if($firstRun){
  $cfg = [ordered]@{
    dbPort = Pick-Port 55432 55460
    appPort = Pick-Port 3131 3160
    dbPassword = New-Hex 24
    jwtSecret = New-Hex 48
    adminPassword = "Rvx-" + (New-Hex 8)
  }
  $cfg | ConvertTo-Json | Set-Content -Encoding UTF8 $ConfigFile
} else {
  $cfg = Get-Content $ConfigFile -Raw | ConvertFrom-Json
}

$env:PGPASSWORD = [string]$cfg.dbPassword
$env:DATABASE_URL = "postgresql://postgres:$($cfg.dbPassword)@127.0.0.1:$($cfg.dbPort)/rovix_construmax"
$env:JWT_SECRET = [string]$cfg.jwtSecret
$env:ROVIX_INITIAL_ADMIN_PASSWORD = [string]$cfg.adminPassword
$env:NODE_ENV = "production"
$env:PORT = [string]$cfg.appPort
$env:HOSTNAME = "127.0.0.1"

$InitDb = Join-Path $PgHome "bin\initdb.exe"
$PgCtl = Join-Path $PgHome "bin\pg_ctl.exe"
$PgReady = Join-Path $PgHome "bin\pg_isready.exe"
$Createdb = Join-Path $PgHome "bin\createdb.exe"
$Psql = Join-Path $PgHome "bin\psql.exe"

if(!(Test-Path (Join-Path $PgData "PG_VERSION"))){
  New-Item -ItemType Directory -Force -Path $PgData | Out-Null
  $pwFile = Join-Path $ConfigDir "pgpw.tmp"
  Set-Content -NoNewline -Encoding ASCII $pwFile ([string]$cfg.dbPassword)
  & $InitDb -D $PgData -U postgres --encoding=UTF8 --auth-host=scram-sha-256 --auth-local=trust --pwfile=$pwFile
  if($LASTEXITCODE -ne 0){ throw "Falha ao inicializar PostgreSQL." }
  Remove-Item $pwFile -Force -ErrorAction SilentlyContinue
  $extraConfig = @"

listen_addresses = '127.0.0.1'
port = $($cfg.dbPort)
"@
  Add-Content (Join-Path $PgData "postgresql.conf") $extraConfig
}

& $PgCtl -D $PgData status *> $null
if($LASTEXITCODE -ne 0){
  $pgLog = Join-Path $LogsDir "postgres.log"
  & $PgCtl -D $PgData -l $pgLog -o "-p $($cfg.dbPort)" start
  if($LASTEXITCODE -ne 0){ throw "Falha ao iniciar PostgreSQL. Veja $pgLog" }
}

$ready=$false
for($i=0;$i -lt 40;$i++){
  & $PgReady -h 127.0.0.1 -p $cfg.dbPort -U postgres *> $null
  if($LASTEXITCODE -eq 0){ $ready=$true; break }
  Start-Sleep -Milliseconds 500
}
if(!$ready){ throw "PostgreSQL não respondeu a tempo." }

$dbExists = & $Psql -h 127.0.0.1 -p $cfg.dbPort -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='rovix_construmax';"
if(($dbExists | Out-String).Trim() -ne "1"){
  & $Createdb -h 127.0.0.1 -p $cfg.dbPort -U postgres rovix_construmax
  if($LASTEXITCODE -ne 0){ throw "Falha ao criar banco rovix_construmax." }
}

Push-Location $AppDir
try {
  & $NodeExe "bootstrap.cjs"
  if($LASTEXITCODE -ne 0){ throw "Falha no bootstrap do banco." }
} finally { Pop-Location }

if($firstRun -or !(Test-Path $FirstAccess)){
  $firstText = @"
ROVIX CONSTRUMAX - PRIMEIRO ACESSO

Endereço: http://127.0.0.1:$($cfg.appPort)
Usuário: admin@rovix.local
Senha: $($cfg.adminPassword)

Guarde este arquivo em local seguro.
"@
  Set-Content -Encoding UTF8 $FirstAccess $firstText
}

$appRunning=$false
if(Test-Path $AppPidFile){
  $existingPid=[int](Get-Content $AppPidFile -Raw)
  if(Get-Process -Id $existingPid -ErrorAction SilentlyContinue){ $appRunning=$true }
}

if(!$appRunning){
  $appLog=Join-Path $LogsDir "app.log"
  $appErr=Join-Path $LogsDir "app-error.log"
  $proc=Start-Process -FilePath $NodeExe -ArgumentList "server.js" -WorkingDirectory $AppDir -WindowStyle Hidden -RedirectStandardOutput $appLog -RedirectStandardError $appErr -PassThru
  Set-Content -Encoding ASCII $AppPidFile $proc.Id
}

$url="http://127.0.0.1:$($cfg.appPort)"
$online=$false
for($i=0;$i -lt 60;$i++){
  try {
    $r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
    if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ $online=$true; break }
  } catch {}
  Start-Sleep -Milliseconds 500
}
if(!$online){ throw "O sistema não respondeu. Verifique $LogsDir\app-error.log" }

if($firstRun){ Start-Process notepad.exe $FirstAccess }
Start-Process $url
