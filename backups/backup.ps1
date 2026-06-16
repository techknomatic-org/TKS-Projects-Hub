# Windows PowerShell Database Backup Script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $ScriptDir "tks_backup_$Timestamp.sql"

$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$DbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "Sai@1234" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "tks_tracking" }
$DbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }

Write-Host "=== TKS Database Backup Starting ===" -ForegroundColor Cyan
Write-Host "Backing up $DbName from $DbHost to $BackupFile..."

# Ensure backups directory exists
if (-not (Test-Path $ScriptDir)) {
    New-Item -ItemType Directory -Path $ScriptDir | Out-Null
}

# Check for Docker container
$dockerCheck = docker ps --filter "name=tks-mysql" --format "{{.Names}}"
if ($dockerCheck -eq "tks-mysql") {
    Write-Host "Detected running Docker container: tks-mysql. Backing up via Docker..."
    docker exec -t tks-mysql mysqldump -u"$DbUser" -p"$DbPassword" $DbName > $BackupFile
} else {
    Write-Host "Running local backup..."
    & mysqldump --host=$DbHost --user=$DbUser --password=$DbPassword $DbName > $BackupFile
}

if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "Backup successfully completed: $BackupFile" -ForegroundColor Green
    # Keep last 7 days of backups
    Get-ChildItem -Path $ScriptDir -Filter "tks_backup_*.sql" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
        Remove-Item -Force
    Write-Host "Old backups cleaned up."
} else {
    Write-Warning "ERROR: Backup failed!"
}
