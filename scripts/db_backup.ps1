param(
  [string]$ProjectRoot = "C:\Users\cany1\Documents\source_code",
  [string]$TelegramBotToken = "",  # передавать через -TelegramBotToken или .env; не хардкодить
  [string]$TelegramChatId = "498924112"
)

$ErrorActionPreference = 'Stop'

function Get-EnvValue {
  param([string]$EnvPath, [string]$Key)

  if (-not (Test-Path $EnvPath)) { return $null }
  $line = Get-Content $EnvPath | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -replace "^$Key=", "").Trim()
}

function Invoke-SupabaseSelect {
  param(
    [string]$BaseUrl,
    [string]$ApiKey,
    [string]$Table,
    [int]$Limit = 5000
  )

  $uri = "${BaseUrl}/rest/v1/${Table}?select=*&limit=$Limit"
  $tmp = New-TemporaryFile

  try {
    $statusRaw = & curl.exe -s --max-time 40 -o "$($tmp.FullName)" -w "%{http_code}" "$uri" `
      -H "apikey: $ApiKey" `
      -H "Authorization: Bearer $ApiKey"

    $status = 0
    [void][int]::TryParse(($statusRaw -replace '[^0-9]',''), [ref]$status)
    $body = Get-Content -Path $tmp.FullName -Raw

    if ($status -lt 200 -or $status -ge 300) {
      throw "HTTP ${status}: $body"
    }
  } finally {
    Remove-Item -Path $tmp.FullName -ErrorAction SilentlyContinue
  }

  if (-not $body -or $body.Trim() -eq "") {
    return @()
  }

  $parsed = $body | ConvertFrom-Json
  if ($parsed -is [System.Array]) { return $parsed }
  if ($null -ne $parsed) { return @($parsed) }
  return @()
}

$envPath = Join-Path $ProjectRoot ".env.local"
$supabaseUrl = Get-EnvValue -EnvPath $envPath -Key "VITE_SUPABASE_URL"
$supabaseKey = Get-EnvValue -EnvPath $envPath -Key "VITE_SUPABASE_ANON_KEY"

if (-not $supabaseUrl -or -not $supabaseKey) {
  throw "Не найдены VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY в .env.local"
}

$tables = @(
  "employees",
  "app_settings",
  "suppliers",
  "products",
  "supplies",
  "boxes",
  "supply_items",
  "receptions",
  "tasks",
  "orders",
  "work_rates",
  "work_logs",
  "activity_logs",
  "print_files",
  "supplier_warehouse_costs"
)

$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupRoot = Join-Path $ProjectRoot "backups\db"
$backupDir = Join-Path $backupRoot "supabase_$stamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$summary = @()

foreach ($table in $tables) {
  try {
    $rows = Invoke-SupabaseSelect -BaseUrl $supabaseUrl -ApiKey $supabaseKey -Table $table
    $rowsArr = @($rows)
    $json = $rowsArr | ConvertTo-Json -Depth 20
    $outFile = Join-Path $backupDir "$table.json"
    Set-Content -Path $outFile -Value $json -Encoding UTF8

    $summary += [PSCustomObject]@{
      table = $table
      rows = $rowsArr.Count
      status = "ok"
    }
  } catch {
    $summary += [PSCustomObject]@{
      table = $table
      rows = 0
      status = "error: $($_.Exception.Message)"
    }
  }
}

$summaryFile = Join-Path $backupDir "_summary.json"
$summary | ConvertTo-Json -Depth 5 | Set-Content -Path $summaryFile -Encoding UTF8

$zipPath = "$backupDir.zip"
Compress-Archive -Path (Join-Path $backupDir "*") -DestinationPath $zipPath -Force

# Send backup to Telegram
try {
  if ($TelegramBotToken -and $TelegramChatId) {
    $zipInfo = Get-Item $zipPath
    $zipSizeMb = [Math]::Round($zipInfo.Length / 1MB, 2)

    $okTables = ($summary | Where-Object { $_.status -eq 'ok' }).Count
    $failedTables = ($summary | Where-Object { $_.status -ne 'ok' }).Count
    $totalRows = ($summary | Measure-Object -Property rows -Sum).Sum

    $caption = "SkladPro DB backup: $stamp`nSize: ${zipSizeMb} MB`nTables: $okTables ok / $failedTables error`nRows total: $totalRows"

    $telegramUrl = "https://api.telegram.org/bot$TelegramBotToken/sendDocument"
    $null = & curl.exe -s --max-time 60 -X POST $telegramUrl `
      -F "chat_id=$TelegramChatId" `
      -F "caption=$caption" `
      -F "document=@$zipPath"
  }
} catch {
  Write-Warning "Telegram send failed: $($_.Exception.Message)"
}

Write-Output "BACKUP_OK: $backupDir"
Write-Output "BACKUP_ZIP: $zipPath"
