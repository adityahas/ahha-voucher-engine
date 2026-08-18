@echo off
REM Deploy script for Ahha Voucher Engine
REM Copies the freshly-built dist to a stable location and starts apps detached
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

echo Stopping existing app instances...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*dist\apps*main.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*frontend-servers.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "Start-Sleep -Seconds 3"

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

echo Starting admin on 9002...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\admin\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\admin.log' -RedirectStandardError '%LOG_DIR%\admin.err.log' -WindowStyle Hidden"

echo Starting loyalty-admin on 9003...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\loyalty-admin\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\loyalty-admin.log' -RedirectStandardError '%LOG_DIR%\loyalty-admin.err.log' -WindowStyle Hidden"

echo Starting user-admin on 9004...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\user-admin\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\user-admin.log' -RedirectStandardError '%LOG_DIR%\user-admin.err.log' -WindowStyle Hidden"

echo Starting loyalty-consumer on 9005...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\loyalty-consumer\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\loyalty-consumer.log' -RedirectStandardError '%LOG_DIR%\loyalty-consumer.err.log' -WindowStyle Hidden"

echo Starting user-consumer on 9006...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\user-consumer\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\user-consumer.log' -RedirectStandardError '%LOG_DIR%\user-consumer.err.log' -WindowStyle Hidden"

echo Starting product-admin on 9007...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\product-admin\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\product-admin.log' -RedirectStandardError '%LOG_DIR%\product-admin.err.log' -WindowStyle Hidden"

echo Starting product-consumer on 9008...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\product-consumer\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\product-consumer.log' -RedirectStandardError '%LOG_DIR%\product-consumer.err.log' -WindowStyle Hidden"

echo Starting redistro on 9009...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'dist\apps\redistro\src\main.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\redistro.log' -RedirectStandardError '%LOG_DIR%\redistro.err.log' -WindowStyle Hidden"

echo Starting frontend servers (cms 5173, consumer 5174)...
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'frontend-servers.js' -WorkingDirectory '%DEPLOY_DIR%' -RedirectStandardOutput '%LOG_DIR%\frontend.log' -RedirectStandardError '%LOG_DIR%\frontend.err.log' -WindowStyle Hidden"

echo Deploy complete. Logs in %LOG_DIR%
exit /b 0
