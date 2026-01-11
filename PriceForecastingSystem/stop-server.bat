@echo off
echo 🛑 Остановка сервера PriceForecastingSystem...
echo.

echo 🔍 Проверка политики выполнения PowerShell...
powershell -Command "Get-ExecutionPolicy" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ PowerShell политика выполнения ограничивает запуск скриптов
    echo Попытка запуска с обходом политики...
    goto :run_with_bypass
)

:run_normal
echo ✅ Запуск скрипта остановки...
powershell -ExecutionPolicy RemoteSigned -File "%~dp0stop-server.ps1"
goto :end

:run_with_bypass
echo 🔄 Запуск с обходом политики выполнения...
powershell -ExecutionPolicy Bypass -File "%~dp0stop-server.ps1"
goto :end

:end
echo.
echo ✅ Сервер остановлен
pause
