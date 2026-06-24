@echo off
echo Demarrage ZKPointe...

REM Backend Laravel
start "ZKPointe-Backend" /min cmd /c "cd /d %~dp0backend && C:\xampp\php\php.exe artisan serve --host=0.0.0.0 --port=8000"

REM Frontend
start "ZKPointe-Frontend" /min cmd /c "node \"%APPDATA%\npm\node_modules\serve\build\main.js\" \"%~dp0frontend\dist\" -p 3000"

REM Sync ZKTeco
start "ZKPointe-Sync" /min cmd /c "cd /d %~dp0zkteco-sync && python sync.py"

timeout /t 4 /nobreak >nul

start "" "http://localhost:3000"
