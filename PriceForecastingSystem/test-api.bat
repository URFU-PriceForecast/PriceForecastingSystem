@echo off
echo Testing PriceForecasting API...
echo.

echo Checking if server is running on port 5229...
netstat -ano | findstr ":5229" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Server is not running on port 5229
    pause
    exit /b 1
)

echo [OK] Server is listening on port 5229
echo.

echo Testing API endpoints...
echo.

echo 1. Testing root endpoint:
curl -s http://localhost:5229/ | findstr "PriceForecasting" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Root endpoint accessible
) else (
    echo [WARNING] Root endpoint not accessible or not returning expected content
)

echo.
echo 2. Testing Swagger:
curl -s -I http://localhost:5229/swagger/index.html | findstr "200 OK" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Swagger UI accessible at http://localhost:5229/swagger/index.html
) else (
    echo [WARNING] Swagger UI not accessible
)

echo.
echo 3. Testing Products API:
curl -s -H "Accept: application/json" http://localhost:5229/api/Products > temp_response.json 2>&1
if exist temp_response.json (
    type temp_response.json | findstr "id" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Products API working
        echo Response contains products data
    ) else (
        echo [WARNING] Products API response:
        type temp_response.json
    )
    del temp_response.json
) else (
    echo [ERROR] Could not get response from Products API
)

echo.
echo Test completed.
pause
