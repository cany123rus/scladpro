param(
  [string]$TaskName = "SkladPro Warehouse Offline Server"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$StartScript = Join-Path $ProjectRoot "scripts\warehouse-offline-start.cmd"

if (-not (Test-Path $StartScript)) {
  throw "Start script not found: $StartScript"
}

$Node = Get-Command node -ErrorAction SilentlyContinue
if (-not $Node) {
  throw "Node.js is not installed or is not in PATH. Install Node.js LTS first."
}

$Npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $Npm) {
  throw "npm is not installed or is not in PATH. Install Node.js LTS first."
}

$Action = New-ScheduledTaskAction -Execute $StartScript -WorkingDirectory $ProjectRoot
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 365)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description "Starts the local SkladPro offline server for FBO/WB Products on warehouse PC login." -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName

Write-Host "Installed and started task: $TaskName"
Write-Host "Project: $ProjectRoot"
Write-Host "Health URL on this PC: http://localhost:8787/api/warehouse-offline/health"
