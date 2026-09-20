param(
  [string]$PostgresHome = "C:\Program Files\PostgreSQL\18"
)

$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent $PSScriptRoot
Set-Location $Repo

$NodeSource = (Get-Command node.exe -ErrorAction Stop).Source
if(!(Test-Path $NodeSource)){ throw "Node.js não encontrado." }
if(!(Test-Path (Join-Path $PostgresHome "bin\initdb.exe"))){ throw "PostgreSQL não encontrado em $PostgresHome" }

Write-Host "Construindo ROVIX CONSTRUMAX standalone..." -ForegroundColor Cyan
& npm run build
if($LASTEXITCODE -ne 0){ throw "Falha no build Next.js." }

$Standalone = Join-Path $Repo ".next\standalone"
if(!(Test-Path (Join-Path $Standalone "server.js"))){ throw "Saída standalone não encontrada." }

$DistBase = Join-Path $Repo "dist"
$Dist = Join-Path $DistBase "ROVIX_CONSTRUMAX_PORTABLE"
$Zip = Join-Path $DistBase "ROVIX_CONSTRUMAX_PORTABLE.zip"

if(Test-Path $Dist){ Remove-Item $Dist -Recurse -Force }
if(Test-Path $Zip){ Remove-Item $Zip -Force }

$AppDir = Join-Path $Dist "app"
$NodeDir = Join-Path $Dist "runtime\node"
$PgDir = Join-Path $Dist "runtime\postgresql"
New-Item -ItemType Directory -Force -Path $AppDir,$NodeDir,$PgDir,(Join-Path $Dist "data"),(Join-Path $Dist "logs"),(Join-Path $Dist "config") | Out-Null

Get-ChildItem -Force $Standalone | Copy-Item -Destination $AppDir -Recurse -Force

$StaticSource = Join-Path $Repo ".next\static"
if(Test-Path $StaticSource){
  $StaticDest = Join-Path $AppDir ".next\static"
  New-Item -ItemType Directory -Force -Path $StaticDest | Out-Null
  Copy-Item (Join-Path $StaticSource "*") $StaticDest -Recurse -Force
}

$PublicSource = Join-Path $Repo "public"
if(Test-Path $PublicSource){
  Copy-Item $PublicSource (Join-Path $AppDir "public") -Recurse -Force
}

New-Item -ItemType Directory -Force -Path (Join-Path $AppDir "db\migrations") | Out-Null
Copy-Item (Join-Path $Repo "db\migrations\*.sql") (Join-Path $AppDir "db\migrations") -Force
Copy-Item (Join-Path $Repo "portable\bootstrap.cjs") (Join-Path $AppDir "bootstrap.cjs") -Force

Copy-Item $NodeSource (Join-Path $NodeDir "node.exe") -Force

foreach($folder in @("bin","lib","share")){
  $src = Join-Path $PostgresHome $folder
  if(!(Test-Path $src)){ throw "Pasta necessária do PostgreSQL não encontrada: $src" }
  Copy-Item $src (Join-Path $PgDir $folder) -Recurse -Force
}

foreach($file in @("COPYRIGHT","LICENSE","README")){
  $src = Join-Path $PostgresHome $file
  if(Test-Path $src){ Copy-Item $src $PgDir -Force }
}

foreach($file in @("INICIAR_CONSTRUMAX.bat","INICIAR_CONSTRUMAX.ps1","PARAR_CONSTRUMAX.bat","PARAR_CONSTRUMAX.ps1","LEIA-ME.txt")){
  $src = Join-Path $Repo ("portable\"+$file)
  if(Test-Path $src){ Copy-Item $src $Dist -Force }
}

$notice = @"
ROVIX CONSTRUMAX PORTABLE

Este pacote inclui runtimes redistribuíveis de Node.js e PostgreSQL.
O software ROVIX CONSTRUMAX permanece sujeito à licença do projeto.
Node.js e PostgreSQL mantêm suas respectivas licenças e avisos de copyright.

O pacote não depende de FinOpenPOS nem de outro ERP/POS.
"@
Set-Content -Encoding UTF8 (Join-Path $Dist "THIRD_PARTY_NOTICE.txt") $notice

Write-Host "Compactando pacote. Isso pode levar alguns minutos..." -ForegroundColor Cyan
Compress-Archive -Path $Dist -DestinationPath $Zip -CompressionLevel Optimal

$size = [math]::Round((Get-Item $Zip).Length / 1MB,2)
Write-Host ""
Write-Host "PACOTE CRIADO COM SUCESSO" -ForegroundColor Green
Write-Host "Arquivo: $Zip"
Write-Host "Tamanho: $size MB"
Write-Host ""
Write-Host "No cliente: descompactar e executar INICIAR_CONSTRUMAX.bat"
