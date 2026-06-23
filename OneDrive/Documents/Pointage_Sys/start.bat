@echo off
echo Demarrage ZKPointe...

start "Backend" /min cmd /c "cd /d C:\Users\safiy\OneDrive\Documents\Pointage_Sys\backend && php artisan serve --host=0.0.0.0 --port=8000"

start "Frontend" /min cmd /c "\"C:\Program Files\nodejs\node.exe\" \"C:\Users\safiy\AppData\Roaming\npm\node_modules\serve\build\main.js\" \"C:\Users\safiy\OneDrive\Documents\Pointage_Sys\frontend\dist\" -p 3000"

timeout /t 4 /nobreak >nul

start "" "http://localhost:3000"
