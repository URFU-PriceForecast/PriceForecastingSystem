@echo off
echo Checking PriceForecasting server status...
echo.

echo 1. Checking running processes:
tasklist /FI "IMAGENAME eq dotnet.exe" /FO TABLE
echo.

echo 2. Checking port 5229:
netstat -ano | findstr ":5229"
echo.

echo 3. Testing API connectivity:
curl -s -I http://localhost:5229/ | findstr "HTTP/"
echo.

echo 4. Checking if docs are accessible:
if exist "docs\index.html" (
    echo [OK] Docs folder exists
) else (
    echo [ERROR] Docs folder not found
)

echo.
echo Check completed.
pause
