@echo off
echo 🚀 Ручной запуск сервера PriceForecastingSystem
echo.

echo 🔍 Шаг 1: Поиск и завершение старых процессов сервера...
echo.

tasklist /FI "IMAGENAME eq PriceForecasting.API.exe" 2>NUL | find /I /N "PriceForecasting.API.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ⚠️ Найдены процессы сервера. Завершаю...
    for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq PriceForecasting.API.exe" ^| findstr PriceForecasting.API.exe') do (
        echo Завершаю процесс PID: %%i
        taskkill /PID %%i /F >NUL 2>&1
    )
    timeout /t 3 /nobreak >nul
) else (
    echo ✅ Процессы сервера не найдены
)

echo.
echo 🔍 Шаг 2: Проверка порта 5229...
echo.

netstat -ano | findstr ":5229" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ⚠️ Порт 5229 занят. Получение PID процесса...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5229" ^| findstr LISTENING') do (
        echo Завершаю процесс PID: %%i
        taskkill /PID %%i /F >NUL 2>&1
    )
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Порт 5229 свободен
)

echo.
echo 🚀 Шаг 3: Переход в директорию API...
echo.

cd "%~dp0PriceForecasting.API\PriceForecasting.API"
if errorlevel 1 (
    echo ❌ Ошибка: Не удалось перейти в директорию API
    pause
    exit /b 1
)

echo ✅ Перешли в: %CD%
echo.
echo 🚀 Шаг 4: Запуск сервера...
echo.

dotnet run

echo.
echo 🎯 Сервер остановлен
pause
