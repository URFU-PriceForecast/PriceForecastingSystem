@echo off
echo 🌐 Запуск локального веб-сервера для docs
echo.

echo 🔍 Проверка Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python не найден. Установите Python или используйте браузер напрямую.
    echo.
    echo 💡 Альтернатива: откройте файл в браузере напрямую
    echo    file://%~dp0docs\index.html
    echo.
    pause
    exit /b 1
)

echo ✅ Python найден
echo.
echo 🚀 Запуск сервера на http://localhost:8000
echo (Остановите сервер комбинацией Ctrl+C)
echo.

cd "%~dp0docs"
python -m http.server 8000

pause
