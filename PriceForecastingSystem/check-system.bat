@echo off
echo 🔍 Проверка системы PriceForecastingSystem
echo.

echo 🔍 Шаг 1: Проверка API сервера...
echo.

curl -s http://localhost:5229/api/products >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ API сервер не запущен на http://localhost:5229
    echo.
    echo 💡 Запустите сервер командой:
    echo    .\run-server-manual.bat
    echo.
    goto :api_error
)

echo ✅ API сервер работает
echo.

echo 🔍 Шаг 2: Проверка основных эндпоинтов...
echo.

curl -s "http://localhost:5229/api/price/demo/482159736" | findstr "price" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Эндпоинт цен не работает
) else (
    echo ✅ Цены товаров работают
)

curl -s "http://localhost:5229/api/recommendations/482159736?period=30&scenario=optimist" | findstr "PriceAction" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ML рекомендации не работают
) else (
    echo ✅ ML рекомендации работают
)

curl -s http://localhost:5229/api/categories | findstr "name" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Категории не работают
) else (
    echo ✅ Категории работают
)

echo.
echo 🎯 Шаг 3: Инструкции по использованию
echo.

echo ✅ Система готова! Используйте один из способов:
echo.
echo 1️⃣ Удобная стартовая страница:
echo    Откройте docs\START.html в браузере
echo.
echo 2️⃣ Локальный веб-сервер:
echo    .\serve-docs.bat
echo    Затем откройте http://localhost:8000
echo.
echo 3️⃣ Прямое открытие:
echo    docs\index.html
echo.
echo 4️⃣ Swagger для тестирования API:
echo    http://localhost:5229/swagger
echo.

goto :end

:api_error
echo ❌ Сначала запустите API сервер
echo.
echo Команда для запуска:
echo   .\run-server-manual.bat
echo.

:end
echo Нажмите любую клавишу для выхода...
pause >nul
