# Price Forecasting System

[![.NET](https://img.shields.io/badge/.NET-8.0-blue.svg)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

**Интеллектуальная платформа прогнозирования цен для e-commerce**

## 🚀 Быстрый старт

### Самый простой способ
# Клонировать репозиторий
git clone https://github.com/your-org/PriceForecastingSystem.git
cd PriceForecastingSystem

# Запустить систему
.\run-server-manual.bat



Frontend (HTML/JS) ◄──► API (.NET Core) ◄──► ML (Python)
       │                    │                    │
   Dashboard           REST API          5 ML моделей
   Charts              Auth              EDA анализ
   Real-time           Caching           Confidence
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                      Database (SQL Server)
                      • Products
                      • Price History  
                      • Users






                      Возможности
🤖 ML-модели прогнозирования
Naive Model - базовый бенчмарк
Moving Average - сглаживание трендов
Linear Extrapolation - простая экстраполяция
ARIMA - статистическая модель временных рядов
Exponential Smoothing - адаптивное сглаживание



Система уверенности
Data Quality (40%) - анализ полноты данных
Model Quality (35%) - оценка точности модели
External Factors (25%) - рыночные факторы
Итоговый score - 0-100% уверенность


Персонализированные рекомендации
Оптимист сценарий - агрессивное ценообразование
Пессимист сценарий - консервативный подход
Hold рекомендации - сохранение текущих цен




Технологии
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
Frontend
HTML5/CSS3 - современный интерфейс
Vanilla JavaScript - интерактивность
Chart.js - графики и визуализации
DevOps
Docker - контейнеризация
Docker Compose - оркестрация
Redis - кэширование (опционально)



Установка и запуск
Способ 1: Docker Compose (рекомендуется)


# Клонировать репозиторий
git clone https://github.com/your-org/PriceForecastingSystem.git
cd PriceForecastingSystem

# Production запуск
docker-compose up -d

# Проверить статус
docker-compose ps




Доступные сервисы:
Frontend: http://localhost:8080
API: http://localhost:5229
ML Service: http://localhost:5000
Database: localhost:1433




# Клонировать репозиторий
git clone https://github.com/your-org/PriceForecastingSystem.git
cd PriceForecastingSystem

# Запустить всю систему
.\start-full-manual.bat



После запуска откройте: http://localhost:5229
Способ 3: Ручной запуск



ML сервис
cd ml_final
pip install -r requirements.txt
python ml_service.py



API сервер
cd "PriceForecastingSystem\PriceForecasting.API\PriceForecasting.API"
dotnet run


API документация
Основные эндпоинты

# Товары
GET  /api/products              # Все товары
GET  /api/products/{id}         # Товар по ID
GET  /api/categories            # Категории

# Цены
GET  /api/price/demo/{article}  # Цена по артикулу

# Прогнозы
GET  /api/forecast/{article}    # ML прогноз
GET  /api/recommendations/{article} # Рекомендации

# Аутентификация
POST /Auth/login               # Вход
POST /Auth/register            # Регистрация



Команда разработчиков
Андреева А.П. - Project Manager
Маннанов Д.Р. - Backend Developer
Ануфриев Д.Д. - Backend Developer
Насртдинова В.А. - Frontend Developer
Амбарцумян А.В. - Frontend Developer





