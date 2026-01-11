@echo off
echo 🚀 Запуск сервера PriceForecastingSystem...
echo.

echo 🔍 Проверка политики выполнения PowerShell...
powershell -Command "Get-ExecutionPolicy" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ PowerShell политика выполнения ограничивает запуск скриптов
    echo Попытка запуска с обходом политики...
    goto :run_with_bypass
)

:run_normal
echo ✅ Запуск скрипта...
powershell -ExecutionPolicy RemoteSigned -File "%~dp0start-server.ps1"
goto :end

:run_with_bypass
echo 🔄 Запуск с обходом политики выполнения...
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
goto :end

:end
echo.
echo 🎯 Если скрипт не запустился, попробуйте:
echo    1. Запустить PowerShell от имени администратора
echo    2. Выполнить: Set-ExecutionPolicy RemoteSigned
echo    3. Запустить скрипт заново
pause
