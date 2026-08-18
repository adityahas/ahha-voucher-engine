@echo off
REM Deploy script for Ahha Voucher Engine
REM Copies the freshly-built dist to a stable location and starts apps detached via scheduled task
setlocal

REM Where this script runs (Jenkins workspace)
set SRC_DIR=%~dp0
REM Stable deploy location (survives workspace cleanup)
set DEPLOY_DIR=C:\ahha-deploy
set LOG_DIR=%DEPLOY_DIR%\logs

if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Copy fresh build + config into stable deploy dir
if exist "%SRC_DIR%dist" (
  if exist "%DEPLOY_DIR%\dist" rmdir /s /q "%DEPLOY_DIR%\dist"
  xcopy /e /i /y /q "%SRC_DIR%dist" "%DEPLOY_DIR%\dist" >nul
)
if not exist "%DEPLOY_DIR%\.env" if exist "%SRC_DIR%.env" copy /y "%SRC_DIR%.env" "%DEPLOY_DIR%\.env" >nul
if not exist "%DEPLOY_DIR%\node_modules" if exist "%SRC_DIR%node_modules" xcopy /e /i /y /q "%SRC_DIR%node_modules" "%DEPLOY_DIR%\node_modules" >nul
if exist "D:\Projects\NodeJs\ahha-voucher-engine\.env" copy /y "D:\Projects\NodeJs\ahha-voucher-engine\.env" "%DEPLOY_DIR%\.env" >nul

REM Copy frontend dists into stable deploy dir
if exist "%SRC_DIR%apps\frontend-cms\dist" (
  if exist "%DEPLOY_DIR%\frontend-cms-dist" rmdir /s /q "%DEPLOY_DIR%\frontend-cms-dist"
  xcopy /e /i /y /q "%SRC_DIR%apps\frontend-cms\dist" "%DEPLOY_DIR%\frontend-cms-dist" >nul
)
if exist "%SRC_DIR%apps\frontend-consumer\dist" (
  if exist "%DEPLOY_DIR%\frontend-consumer-dist" rmdir /s /q "%DEPLOY_DIR%\frontend-consumer-dist"
  xcopy /e /i /y /q "%SRC_DIR%apps\frontend-consumer\dist" "%DEPLOY_DIR%\frontend-consumer-dist" >nul
)
if exist "%SRC_DIR%frontend-servers.js" copy /y "%SRC_DIR%frontend-servers.js" "%DEPLOY_DIR%\frontend-servers.js" >nul

echo Stopping existing app instances...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*dist\apps*main.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*frontend-servers.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "Start-Sleep -Seconds 3"

echo Starting apps via scheduled task (detached from Jenkins)...
schtasks /create /f /tn "AhhaStartApps" /tr "\"C:\ahha-deploy\start-apps.bat\"" /sc once /st 00:00 /ru "" >nul 2>&1
schtasks /run /tn "AhhaStartApps"
schtasks /delete /f /tn "AhhaStartApps" >nul 2>&1

echo Deploy complete. Apps starting in background. Logs in %LOG_DIR%
exit /b 0
