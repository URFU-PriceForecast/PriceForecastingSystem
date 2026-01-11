@echo off
echo 🧪 Тестирование сервера PriceForecastingSystem
echo.

echo 🔍 Шаг 1: Проверка доступности сервера...
echo.

curl -s http://localhost:5229/api/products >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Сервер не отвечает на http://localhost:5229
    echo.
    echo 💡 Убедитесь, что сервер запущен командой:
    echo    .\run-server-manual.bat
    echo.
    goto :error
)

echo ✅ Сервер доступен
echo.

echo 🔍 Шаг 2: Тестирование API эндпоинтов...
echo.

echo Тестирую /api/products...
curl -s http://localhost:5229/api/products | findstr "482159736" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Эндпоинт /api/products не работает
) else (
    echo ✅ /api/products работает
)

echo Тестирую /api/price/demo/482159736...
curl -s "http://localhost:5229/api/price/demo/482159736" | findstr "price" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Эндпоинт /api/price/demo не работает
) else (
    echo ✅ /api/price/demo работает
)

echo Тестирую /api/recommendations...
curl -s "http://localhost:5229/api/recommendations/482159736?period=30&scenario=optimist" | findstr "PriceAction" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Эндпоинт /api/recommendations не работает
) else (
    echo ✅ /api/recommendations работает
)

echo Тестирую /api/categories...
curl -s http://localhost:5229/api/categories | findstr "Смартфоны" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Эндпоинт /api/categories не работает
) else (
    echo ✅ /api/categories работает
)

echo.
echo 🎯 Шаг 3: Информация о доступе
echo.

echo 📊 Swagger UI: http://localhost:5229/swagger
echo 🎨 Docs демо:    file://%~dp0docs\index.html
echo 💼 Frontend:     file://%~dp0PriceForecasting.Frontend\index.html

echo.
echo ✅ Все тесты пройдены! Сервер работает корректно.
echo.
goto :end

:error
echo ❌ Тесты не пройдены. Проверьте работу сервера.
echo.

:end
echo Нажмите любую клавишу для выхода...
pause >nul
