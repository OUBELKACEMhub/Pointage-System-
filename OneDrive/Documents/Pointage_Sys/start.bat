@echo off
echo Demarrage ZKPointe...

REM Backend Laravel
start "ZKPointe-Backend" cmd /c "cd /d %~dp0backend && C:\xampp\php\php.exe artisan serve --host=0.0.0.0 --port=8000 & pause"

REM Frontend
start "ZKPointe-Frontend" cmd /c "node \"%APPDATA%\npm\node_modules\serve\build\main.js\" \"%~dp0frontend\dist\" -p 3000 & pause"

REM Sync ZKTeco
start "ZKPointe-Sync" cmd /c "cd /d %~dp0zkteco-sync && python sync.py & pause"

timeout /t 5 /nobreak >nul

start "" "http://localhost:3000"
