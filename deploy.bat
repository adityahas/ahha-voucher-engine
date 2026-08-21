@echo off
REM Deploy script for Ahha Voucher Engine with Selective Service Deployment
setlocal
set BUILD_ID=dontKillMe
set JENKINS_NODE_COOKIE=dontKillMe

REM Where this script runs (Jenkins workspace)
set SRC_DIR=%~dp0
REM Stable deploy location (survives workspace cleanup)
set DEPLOY_DIR=C:\ahha-deploy
set LOG_DIR=%DEPLOY_DIR%\logs

if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Copy build state & helper scripts
if exist "%SRC_DIR%changed-services.json" copy /y "%SRC_DIR%changed-services.json" "%DEPLOY_DIR%\changed-services.json" >nul
if exist "%SRC_DIR%start-all.ps1" copy /y "%SRC_DIR%start-all.ps1" "%DEPLOY_DIR%\start-all.ps1" >nul

REM Copy fresh build + config into stable deploy dir
if exist "%SRC_DIR%dist" (
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
if exist "%SRC_DIR%scripts" (
  if not exist "%DEPLOY_DIR%\scripts" mkdir "%DEPLOY_DIR%\scripts"
  xcopy /e /i /y /q "%SRC_DIR%scripts" "%DEPLOY_DIR%\scripts" >nul
)

echo Running database seeder...
cd /d "%DEPLOY_DIR%"
node "%DEPLOY_DIR%\dist\apps\admin\src\seeder\main.seeder.js"

echo Restarting targeted services via Scheduled Task (detached from Jenkins)...
schtasks /create /f /tn "AhhaStartApps" /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"C:\ahha-deploy\start-all.ps1\"" /sc once /st 00:00 /ru "" >nul 2>&1
schtasks /run /tn "AhhaStartApps"
schtasks /delete /f /tn "AhhaStartApps" >nul 2>&1

echo Waiting for services to initialize...
powershell -NoProfile -Command "Start-Sleep -Seconds 10"

echo Running HTTP API Seeder...
cd /d "%DEPLOY_DIR%"
node "%DEPLOY_DIR%\scripts\seed-via-api.js"

REM Record current deployed commit hash
cd /d "%SRC_DIR%"
git rev-parse HEAD > "%DEPLOY_DIR%\.last_deployed_commit"

echo Selective deploy complete. Logs in %LOG_DIR%
exit /b 0
