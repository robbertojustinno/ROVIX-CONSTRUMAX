#define MyAppName "ROVIX CONSTRUMAX"
#define MyAppVersion "1.2.2"
#define MyAppPublisher "ROVIX Automation"
#define MyAppExeName "INICIAR_CONSTRUMAX_INSTALADO.ps1"

[Setup]
AppId={{FCE0AB7E-6C2A-4A71-9F52-7E7D760F0C31}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\ROVIX\CONSTRUMAX
DefaultGroupName=ROVIX CONSTRUMAX
DisableProgramGroupPage=yes
PrivilegesRequired=admin
OutputDir=..\dist\installer
OutputBaseFilename=ROVIX_CONSTRUMAX_SETUP
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayName=ROVIX CONSTRUMAX
SetupLogging=yes

[Dirs]
Name: "{commonappdata}\ROVIX\CONSTRUMAX"; Permissions: users-modify
Name: "{commonappdata}\ROVIX\CONSTRUMAX\data"; Permissions: users-modify
Name: "{commonappdata}\ROVIX\CONSTRUMAX\config"; Permissions: users-modify
Name: "{commonappdata}\ROVIX\CONSTRUMAX\logs"; Permissions: users-modify

[Files]
Source: "..\dist\ROVIX_CONSTRUMAX_PORTABLE\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\dist\ROVIX_CONSTRUMAX_PORTABLE\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "INICIAR_CONSTRUMAX_INSTALADO.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "PARAR_CONSTRUMAX_INSTALADO.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autodesktop}\ROVIX CONSTRUMAX"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\INICIAR_CONSTRUMAX_INSTALADO.ps1"""; WorkingDir: "{app}"
Name: "{autoprograms}\ROVIX CONSTRUMAX\ROVIX CONSTRUMAX"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\INICIAR_CONSTRUMAX_INSTALADO.ps1"""; WorkingDir: "{app}"
Name: "{autoprograms}\ROVIX CONSTRUMAX\Encerrar ROVIX CONSTRUMAX"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\PARAR_CONSTRUMAX_INSTALADO.ps1"""; WorkingDir: "{app}"

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\INICIAR_CONSTRUMAX_INSTALADO.ps1"""; Description: "Abrir ROVIX CONSTRUMAX"; Flags: postinstall nowait skipifsilent

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\PARAR_CONSTRUMAX_INSTALADO.ps1"""; Flags: runhidden

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
function InitializeUninstall(): Boolean;
begin
  Result := MsgBox(
    'O desinstalador removerá o programa, mas preservará os dados do cliente em C:\ProgramData\ROVIX\CONSTRUMAX.' + #13#10 + #13#10 +
    'Deseja continuar?',
    mbConfirmation, MB_YESNO) = IDYES;
end;
