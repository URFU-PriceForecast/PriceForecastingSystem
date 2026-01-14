Price Forecasting System
![.NET](https://img.shields.io/badge/.NET-8.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
Интеллектуальная платформа прогнозирования цен для e-commerce с использованием машинного обучения и data-driven подхода.
🚀 Быстрый старт
Самый простой способ
# Клонировать репозиторийgit clone https://github.com/your-org/PriceForecastingSystem.gitcd PriceForecastingSystem# Запустить систему.\run-server-manual.bat
После запуска откройте: http://localhost:5229
🏗️ Архитектура
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│   Frontend      │    │     API         │    │      ML         ││   (HTML/JS)     │◄──►│   (.NET Core)   │◄──►│   (Python)      ││                 │    │                 │    │                 ││ • Dashboard     │    │ • REST API      │    │ • 5 ML моделей  ││ • Charts        │    │ • Auth          │    │ • EDA анализ    ││ • Real-time     │    │ • Caching       │    │ • Confidence    │└─────────────────┘    └─────────────────┘    └─────────────────┘                              │                              ▼                    ┌─────────────────┐                    │   Database      │                    │  (SQL Server)   │                    │                 │                    │ • Products      │                    │ • Price History │                    │ • Users         │                    └─────────────────┘
🎯 Возможности
🤖 ML-модели прогнозирования
Naive Model - базовый бенчмарк
Moving Average - сглаживание трендов
Linear Extrapolation - простая экстраполяция
ARIMA - статистическая модель временных рядов
Exponential Smoothing - адаптивное сглаживание
📊 Система уверенности
Data Quality (40%) - анализ полноты данных
Model Quality (35%) - оценка точности модели
External Factors (25%) - рыночные факторы
Итоговый score - 0-100% уверенность
💡 Персонализированные рекомендации
Оптимист сценарий - агрессивное ценообразование
Пессимист сценарий - консервативный подход
Hold рекомендации - сохранение текущих цен
🎨 Веб-интерфейс
Dashboard - обзор системы и метрики
Аналитика товаров - детальный анализ
Интерактивные графики - визуализация прогнозов
Real-time обновления - актуальные данные
🛠 Технологии
Backend
.NET 8 - ASP.NET Core API
Entity Framework Core - ORM
SQL Server / LocalDB - база данных
JWT - аутентификация
ML & AI
Python 3.9+ - ML сервисы
Flask - REST API для ML
scikit-learn - ML алгоритмы
statsmodels - статистическое моделирование
pandas/numpy - обработка данных
Frontend
HTML5/CSS3 - современный интерфейс
Vanilla JavaScript - интерактивность
Chart.js - графики и визуализации
DevOps
Docker - контейнеризация
Docker Compose - оркестрация сервисов
Redis - кэширование (опционально)
Prometheus/Grafana - мониторинг (опционально)
📋 Системные требования
Обязательные:
Windows 10/11 или Linux/Mac
.NET 8 SDK - скачать
Python 3.9+ - скачать
Git - скачать
Рекомендуемые:
Docker Desktop - для контейнеризованного запуска
4GB RAM - минимум
10GB свободного места - для зависимостей
🚀 Установка и запуск
Способ 1: Docker Compose (рекомендуется)
# Клонировать репозиторийgit clone https://github.com/your-org/PriceForecastingSystem.gitcd PriceForecastingSystem# Production запускdocker-compose up -d# Проверить статусdocker-compose ps
Доступные сервисы:
Frontend: http://localhost:8080
API: http://localhost:5229
ML Service: http://localhost:5000
Database: localhost:1433
Redis: localhost:6379
Способ 2: Локальный запуск
# Клонировать репозиторийgit clone https://github.com/your-org/PriceForecastingSystem.gitcd PriceForecastingSystem# Запустить всю систему.\start-full-manual.bat
После запуска откройте: http://localhost:5229
Способ 3: Ручной запуск
1. ML сервис
cd ml_finalpip install -r requirements.txtpython ml_service.py
2. API сервер
cd "PriceForecastingSystem\PriceForecasting.API\PriceForecasting.API"dotnet run
3. Frontend
# Открыть в браузереstart PriceForecastingSystem\PriceForecasting.Frontend\index.html
🧪 Тестирование
Автоматическая проверка
# Проверить все сервисы.\check-services.ps1
Тестовые данные
482159736 - iPhone 15 128GB
5938472610 - iPhone 15 256GB
620184735 - Samsung Galaxy S24
815937402 - Xiaomi 13 Lite
9374851260 - AirPods Pro 2
API тестирование
# Проверить APIcurl http://localhost:5229/api/productscurl "http://localhost:5229/api/price/demo/482159736"curl "http://localhost:5229/api/forecast/482159736"
📚 API документация
Основные эндпоинты
# ТоварыGET  /api/products              # Все товарыGET  /api/products/{id}         # Товар по IDGET  /api/categories            # Категории# ЦеныGET  /api/price/demo/{article}  # Цена по артикулу# ПрогнозыGET  /api/forecast/{article}    # ML прогнозGET  /api/recommendations/{article} # Рекомендации# АутентификацияPOST /Auth/login               # ВходPOST /Auth/register            # Регистрация
Полная документация: http://localhost:5229/swagger
🛑 Остановка
# Dockerdocker-compose down# Локальные процессы.\stop-manual.bat
🔧 Устранение неисправностей
"Не удается загрузить файл ... .ps1"
# Откройте PowerShell от имени администратора:Set-ExecutionPolicy RemoteSigned
Порт занят
# Проверитьnetstat -ano | findstr ":5229"# Завершить процессtaskkill /PID 1234 /F
ML сервис недоступен
Система использует mock-данные
Проверьте Python зависимости
Проверьте порт 5000
📊 Метрики качества
ML модели
MAPE < 15% - средняя процентная ошибка
Direction Accuracy > 65% - точность направления
Inference Time < 2 сек - время генерации
Система уверенности
Высокая > 90%
Средняя 70-90%
Низкая < 70%
👥 Команда разработчиков
Андреева А.П. - Project Manager
Маннанов Д.Р. - Backend Developer
Ануфриев Д.Д. - Backend Developer
Шмелёв А.О. - ML Engineer
Насртдинова В.А. - Frontend Developer
Амбарцумян А.В. - Frontend Developer
📈 Бизнес-метрики
Текущее состояние
✅ MVP готов - полная функциональность
✅ 5 ML моделей - автоматический выбор лучшей
✅ Система уверенности - количественная оценка
✅ Персонализированные рекомендации - 2 сценария
ROI расчеты
Увеличение прибыли: до 625,000 руб/месяц
Окупаемость: 1.4 месяца
Улучшение маржи: +5.5%
Снижение рисков: 35%
🎯 Roadmap
Этап 1: Beta-релиз (Q1 2025)
🔄 Улучшение UX/UI
🔄 Расширение ML-моделей
🔄 Интеграция с маркетплейсами
🔄 Система уведомлений
Этап 2: Production (Q2 2025)
🚀 Полная контейнеризация
🚀 Масштабирование инфраструктуры
🚀 Enterprise-функции
🚀 Мобильное приложение
Этап 3: Масштабирование (Q3-Q4 2025)
📈 Международная экспансия
📈 Партнерства с маркетплейсами
📈 Advanced Analytics
📈 AI-powered insights
📄 Лицензия
Этот проект распространяется под лицензией MIT. Подробности в файле LICENSE.
🤝 Вклад в проект
Мы приветствуем вклад в развитие проекта!
Fork проект
Создайте ветку для вашей фичи (git checkout -b feature/AmazingFeature)
Commit изменения (git commit -m 'Add some AmazingFeature')
Push в ветку (git push origin feature/AmazingFeature)
Создайте Pull Request
