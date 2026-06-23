# ZKPointe - Installation des services Windows
# Executer en tant qu'Administrateur

$pythonPath  = "C:\Users\safiy\AppData\Local\Python\bin\python.exe"
$projectRoot = "C:\Users\safiy\OneDrive\Documents\Pointage_Sys"
$syncDir     = "$projectRoot\zkteco-sync"
$backendDir  = "$projectRoot\backend"

Write-Host "=== Installation ZKPointe Services ===" -ForegroundColor Cyan

# --- Creer dossier logs ---
New-Item -ItemType Directory -Force "$syncDir\logs" | Out-Null

# --- Service 1 : ZKTeco Sync (Python) ---
Write-Host "`n[1/2] Installation du service ZKTeco Sync..." -ForegroundColor Yellow

$action  = New-ScheduledTaskAction -Execute $pythonPath -Argument "sync.py" -WorkingDirectory $syncDir
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
    -RestartCount 99 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask `
    -TaskName "ZKPointe-Sync" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "ZKPointe - Synchronisation pointeuse ZKTeco" `
    -Force | Out-Null

Write-Host "   OK - Service Sync installe" -ForegroundColor Green

# --- Service 2 : Laravel Backend ---
Write-Host "`n[2/2] Installation du service Laravel Backend..." -ForegroundColor Yellow

$phpPath = (Get-Command php -ErrorAction SilentlyContinue)?.Source
if (-not $phpPath) {
    # Chercher php dans les emplacements courants
    $candidates = @("C:\php\php.exe","C:\xampp\php\php.exe","C:\laragon\bin\php\php-8.3.x64\php.exe")
    foreach ($c in $candidates) {
        if (Test-Path $c) { $phpPath = $c; break }
    }
}

if ($phpPath) {
    $action2 = New-ScheduledTaskAction -Execute $phpPath -Argument "artisan serve --host=0.0.0.0 --port=8000" -WorkingDirectory $backendDir
    $trigger2 = New-ScheduledTaskTrigger -AtStartup

    Register-ScheduledTask `
        -TaskName "ZKPointe-Backend" `
        -Action $action2 `
        -Trigger $trigger2 `
        -Settings $settings `
        -Principal $principal `
        -Description "ZKPointe - Serveur Laravel backend" `
        -Force | Out-Null

    Write-Host "   OK - Service Backend installe (php: $phpPath)" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION: PHP non trouve. Backend non installe." -ForegroundColor Red
    Write-Host "   Relance le script apres avoir installe PHP." -ForegroundColor Red
}

# --- Demarrer maintenant ---
Write-Host "`nDemarrage des services..." -ForegroundColor Yellow
Start-ScheduledTask -TaskName "ZKPointe-Sync"
if ($phpPath) { Start-ScheduledTask -TaskName "ZKPointe-Backend" }

Write-Host "`n=== Installation terminee ===" -ForegroundColor Cyan
Write-Host "Les services demarrent automatiquement a chaque demarrage Windows." -ForegroundColor Green
Write-Host ""
Write-Host "Pour verifier l'etat :"
Write-Host "  Get-ScheduledTask -TaskName 'ZKPointe-*' | Select TaskName,State"
