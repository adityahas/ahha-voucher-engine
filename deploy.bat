@echo off
REM Deploy script for Ahha Voucher Engine (runs detached from Jenkins)
REM Uses the script's own directory so it deploys the freshly-built code from the Jenkins workspace
setlocal
set DEPLOY_DIR=%~dp0
set LOG_DIR=%DEPLOY_DIR%logs

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

if exist "D:\Projects\NodeJs\ahha-voucher-engine\.env" copy /y "D:\Projects\NodeJs\ahha-voucher-engine\.env" "%DEPLOY_DIR%.env" >nul

echo Stopping existing app instances...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*dist\apps*main.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "Start-Sleep -Seconds 3"

echo Starting admin on 9002...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\admin\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\admin.log' -RedirectStandardError '%LOG_DIR%\admin.err.log' -WindowStyle Hidden"

echo Starting loyalty-admin on 9003...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\loyalty-admin\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\loyalty-admin.log' -RedirectStandardError '%LOG_DIR%\loyalty-admin.err.log' -WindowStyle Hidden"

echo Starting loyalty-consumer on 9005...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\loyalty-consumer\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\loyalty-consumer.log' -RedirectStandardError '%LOG_DIR%\loyalty-consumer.err.log' -WindowStyle Hidden"

echo Starting user on 9004...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\user\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\user.log' -RedirectStandardError '%LOG_DIR%\user.err.log' -WindowStyle Hidden"

echo Deploy complete. Logs in %LOG_DIR%
exit /b 0
