$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent $PSScriptRoot
Set-Location $Repo

Write-Host "Gerando pacote portátil base..." -ForegroundColor Cyan
& "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Repo "scripts\BUILD_PORTABLE.ps1")
if($LASTEXITCODE -ne 0){ throw "Falha ao gerar pacote portátil base." }

$Candidates = @(
  "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
  "C:\Program Files\Inno Setup 6\ISCC.exe",
  "C:\Program Files (x86)\Inno Setup 5\ISCC.exe",
  "C:\Program Files\Inno Setup 5\ISCC.exe"
)

$Iscc = $Candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if(!$Iscc){
  Write-Host ""
  Write-Host "Inno Setup não encontrado." -ForegroundColor Yellow
  Write-Host "Instale com:" -ForegroundColor Yellow
  Write-Host "winget install --id JRSoftware.InnoSetup -e" -ForegroundColor White
  throw "Instale o Inno Setup e execute novamente npm run build:installer"
}

$Out = Join-Path $Repo "dist\installer"
New-Item -ItemType Directory -Force -Path $Out | Out-Null

Write-Host "Compilando instalador comercial..." -ForegroundColor Cyan
& $Iscc (Join-Path $Repo "installer\ROVIX_CONSTRUMAX.iss")
if($LASTEXITCODE -ne 0){ throw "Falha ao compilar instalador." }

$Setup = Join-Path $Out "ROVIX_CONSTRUMAX_SETUP.exe"
if(!(Test-Path $Setup)){ throw "Instalador não foi encontrado em $Setup" }

$Size=[math]::Round((Get-Item $Setup).Length/1MB,2)
Write-Host ""
Write-Host "INSTALADOR CRIADO COM SUCESSO" -ForegroundColor Green
Write-Host "Arquivo: $Setup"
Write-Host "Tamanho: $Size MB"
