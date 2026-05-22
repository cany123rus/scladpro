@echo off
setlocal

cd /d "%~dp0.."

if not exist logs mkdir logs

set WAREHOUSE_OFFLINE_HOST=0.0.0.0
set WAREHOUSE_OFFLINE_PORT=8787

echo [%date% %time%] Starting SkladPro warehouse offline server >> logs\warehouse-offline-server.log
npm run offline:server >> logs\warehouse-offline-server.log 2>&1
