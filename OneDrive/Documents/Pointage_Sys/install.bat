@echo off
title ZKPointe - Installation
echo ========================================
echo    ZKPointe - Installation automatique
echo ========================================
echo.

set PROJECT_DIR=%~dp0
set BACKEND_DIR=%PROJECT_DIR%backend
set FRONTEND_DIR=%PROJECT_DIR%frontend
set SYNC_DIR=%PROJECT_DIR%zkteco-sync

REM ── Verifier XAMPP MySQL ──────────────────────────────────────────
echo [1/5] Verification MySQL (XAMPP)...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ERREUR: MySQL XAMPP n'est pas demarre.
    echo Lance XAMPP et demarre MySQL, puis relance ce script.
    pause
    exit /b 1
)
echo OK - MySQL tourne.

REM ── Creer la base de donnees ──────────────────────────────────────
echo.
echo [2/5] Creation de la base de donnees...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS zkpointe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo OK - Base de donnees zkpointe creee.

REM ── Configurer .env backend ───────────────────────────────────────
echo.
echo [3/5] Configuration backend...
cd /d "%BACKEND_DIR%"
if not exist ".env" (
    copy ".env.example" ".env" >nul
)
REM Creer les dossiers necessaires
if not exist "bootstrap\cache" mkdir bootstrap\cache
if not exist "storage\logs" mkdir storage\logs
if not exist "storage\framework\cache" mkdir storage\framework\cache
if not exist "storage\framework\sessions" mkdir storage\framework\sessions
if not exist "storage\framework\views" mkdir storage\framework\views
"C:\xampp\php\php.exe" artisan key:generate --force
"C:\xampp\php\php.exe" artisan migrate --force
"C:\xampp\php\php.exe" artisan db:seed --force
echo OK - Backend configure.

REM ── Installer frontend ────────────────────────────────────────────
echo.
echo [4/5] Installation frontend...
cd /d "%FRONTEND_DIR%"
call npm install --silent
call npm run build
echo OK - Frontend compile.

REM ── Installer Python ─────────────────────────────────────────────
echo.
echo [5/5] Installation dependances Python...
cd /d "%SYNC_DIR%"
python -m pip install -r requirements.txt --quiet 2>nul || py -m pip install -r requirements.txt --quiet 2>nul || echo ATTENTION: pip non disponible, installe manuellement: python -m pip install -r requirements.txt
echo OK - Python configure.

REM ── Termine ───────────────────────────────────────────────────────
echo.
echo ========================================
echo    Installation terminee !
echo    Lance start.bat pour demarrer l'app
echo ========================================
echo.
pause
