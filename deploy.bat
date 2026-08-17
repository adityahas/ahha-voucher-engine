@echo off
REM Deploy script for Ahha Voucher Engine (runs detached from Jenkins)
setlocal
set DEPLOY_DIR=D:\Projects\NodeJs\ahha-voucher-engine
set LOG_DIR=%DEPLOY_DIR%\logs

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo Stopping existing app instances...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*dist\apps*main.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
timeout /t 3 /nobreak >nul

echo Starting admin on 9002...
start "ahha-admin" /min cmd /c "cd /d %DEPLOY_DIR% && node dist\apps\admin\src\main.js >> %LOG_DIR%\admin.log 2>&1"

echo Starting loyalty-admin on 9003...
start "ahha-loyalty-admin" /min cmd /c "cd /d %DEPLOY_DIR% && node dist\apps\loyalty-admin\src\main.js >> %LOG_DIR%\loyalty-admin.log 2>&1"

echo Starting loyalty-consumer on 9005...
start "ahha-loyalty-consumer" /min cmd /c "cd /d %DEPLOY_DIR% && node dist\apps\loyalty-consumer\src\main.js >> %LOG_DIR%\loyalty-consumer.log 2>&1"

echo Starting user on 9004...
start "ahha-user" /min cmd /c "cd /d %DEPLOY_DIR% && node dist\apps\user\src\main.js >> %LOG_DIR%\user.log 2>&1"

echo Deploy complete. Logs in %LOG_DIR%
exit /b 0
