# Windows PowerShell Database Restore Script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$BackupFile
)

if (-not $BackupFile) {
    Write-Host "Usage: .\restore.ps1 <backup-file.sql>" -ForegroundColor Yellow
    Write-Host "Available backups in $ScriptDir:" -ForegroundColor Yellow
    Get-ChildItem -Path $ScriptDir -Filter "*.sql" | Select-Object -ExpandProperty Name
    Exit
}

$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$DbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "Sai@1234" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "tks_tracking" }
$DbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }

$FullPath = Resolve-Path $BackupFile -ErrorAction SilentlyContinue
if (-not $FullPath) {
    $FullPath = Join-Path $ScriptDir $BackupFile
}

if (-not (Test-Path $FullPath)) {
    Write-Error "Error: Backup file $BackupFile not found."
    Exit
}

Write-Host "=== TKS Database Restore Starting ===" -ForegroundColor Cyan
Write-Host "Restoring $FullPath to $DbName on $DbHost..."

$dockerCheck = docker ps --filter "name=tks-mysql" --format "{{.Names}}"
if ($dockerCheck -eq "tks-mysql") {
    Write-Host "Detected running Docker container: tks-mysql. Restoring via Docker..."
    # Pipe the file content into docker exec
    Get-Content $FullPath | docker exec -i tks-mysql mysql -u"$DbUser" -p"$DbPassword" $DbName
} else {
    Write-Host "Running local restore..."
    cmd.exe /c "mysql --host=$DbHost --user=$DbUser --password=$DbPassword $DbName < `"$FullPath`""
}

if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "Database successfully restored!" -ForegroundColor Green
} else {
    Write-Warning "ERROR: Restore failed!"
}
