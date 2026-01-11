# PRICER Platform - Техническая документация

## 🏗️ Архитектура системы

### Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    PRICER Platform                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Frontend   │ │    API      │ │     ML      │          │
│  │ (HTML/JS)   │◄┼►│  (.NET)    │◄┼►│ (Python)   │          │
│  │             │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Database   │ │   Cache     │ │ Monitoring  │          │
│  │ (SQL Server)│ │   (Redis)   │ │ (Prometheus)│          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Компоненты системы

#### 1. Frontend Layer
- **Технологии**: HTML5, CSS3, Vanilla JavaScript
- **Библиотеки**: Chart.js, Font Awesome
- **Функционал**:
  - Дашборд с метриками
  - Интерактивные графики
  - Управление товарами
  - Real-time уведомления

#### 2. API Layer (.NET Core)
- **Framework**: ASP.NET Core 8.0
- **Архитектура**: Clean Architecture
- **Компоненты**:
  - Controllers (REST API)
  - Services (бизнес-логика)
  - Data Access (EF Core)
  - DTOs (data transfer objects)

#### 3. ML Layer (Python)
- **Framework**: Flask (для API)
- **ML Libraries**: scikit-learn, statsmodels, pandas
- **Модели**: ARIMA, Linear Regression, Exponential Smoothing
- **Функционал**: Прогнозирование, уверенность, рекомендации

#### 4. Data Layer
- **Database**: SQL Server 2022 / LocalDB
- **ORM**: Entity Framework Core
- **Migrations**: Code-first подход
- **Seed Data**: Тестовые данные

## 📊 Модели данных

### Основные сущности

#### Product (Товар)
```csharp
public class Product
{
    public int id { get; set; }
    public string article { get; set; } = default!;
    public string name { get; set; } = default!;
    public string? description { get; set; }
    public int category_id { get; set; }
    public string? brand { get; set; }
    public string image_url { get; set; } = default!;
}
```

#### PriceHistory (История цен)
```csharp
public class PriceHistory
{
    public int id { get; set; }
    public int product_id { get; set; }
    public decimal price { get; set; }
    public DateTime created_at { get; set; }
}
```

#### Category (Категория)
```csharp
public class Category
{
    public int id { get; set; }
    public string name { get; set; } = default!;
    public int? parent_id { get; set; }
}
```

## 🔌 API Спецификация

### REST Endpoints

#### Products API
```
GET    /api/products              - Получить все товары
GET    /api/products/{id}         - Получить товар по ID
GET    /api/products/by-category/{categoryId} - Товары по категории
POST   /api/products/datacheck    - Проверить товар по артикулу
```

#### Price API
```
GET    /api/price/demo/{article}   - Цена товара (демо)
GET    /api/price/product/{productId} - История цен товара
```

#### Forecast API
```
GET    /api/forecast/{article}     - Прогноз цен
POST   /api/forecast/detailed     - Детальный прогноз
```

#### Recommendations API
```
GET    /api/recommendations/{article} - Рекомендации
POST   /api/recommendations/analyze  - Анализ товара
```

### Response Formats

#### Price Response
```json
{
  "price": 53027.51,
  "date": "2025-11-30",
  "product": {
    "Id": 1,
    "Article": "482159736",
    "Name": "Смартфон iPhone 15 128GB",
    "Description": "Флагманский смартфон Apple",
    "CategoryId": 1,
    "Brand": "Apple",
    "ImageUrl": "/images/iphone15.jpg",
    "CurrentPrice": 53027.51,
    "LastPriceUpdate": "2025-11-30T00:00:00"
  }
}
```

#### Forecast Response
```json
{
  "forecast": {
    "predictions": [55938.55, 56138.14, ...],
    "dates": ["2026-01-12T00:00:00", ...],
    "trend": "up",
    "period_days": 7
  },
  "metrics": {
    "inference_time": 0.0005,
    "model_name": "Linear Extrapolation"
  },
  "confidence": {
    "value": 0.889,
    "level": "средняя уверенность",
    "components": {
      "data_quality": 0.997,
      "model_quality": 0.867,
      "external_factors": 0.75
    }
  },
  "recommendation": {
    "price_action": "hold",
    "percentage": 0,
    "timeframe": "7-14 дней",
    "confidence": 0.889,
    "reasoning": "Прогноз на 30 дней показывает рост на 8.9%...",
    "scenario": "optimist"
  }
}
```

## 🤖 ML Архитектура

### Доступные модели

#### 1. Naive Model
- **Алгоритм**: Завтра = Сегодня
- **Сложность**: O(1)
- **Точность**: Базовый уровень
- **Использование**: Бенчмарк, малые данные

#### 2. Moving Average
- **Алгоритм**: Скользящее среднее
- **Параметры**: window_size (по умолчанию 7)
- **Сложность**: O(n)
- **Использование**: Стабильные тренды

#### 3. Linear Extrapolation
- **Алгоритм**: Линейная регрессия
- **Параметры**: Автоматический подбор
- **Сложность**: O(n)
- **Использование**: Линейные тренды

#### 4. ARIMA
- **Алгоритм**: AutoRegressive Integrated Moving Average
- **Параметры**: (1,1,1) по умолчанию
- **Сложность**: O(n log n)
- **Использование**: Сезонные данные

#### 5. Exponential Smoothing
- **Алгоритм**: Экспоненциальное сглаживание Хольта-Винтерса
- **Параметры**: Автоматический подбор
- **Сложность**: O(n)
- **Использование**: Нестабильные данные

### Система выбора модели

#### Автоматический режим
```python
# Сравнение всех моделей на исторических данных
comparison = ModelComparison()
results = comparison.compare_models(prices, dates, test_days=30)
best_model = results["best_model"]
```

#### Критерии выбора
1. **Точность (40%)**: MAPE - Mean Absolute Percentage Error
2. **Надежность (30%)**: Direction Accuracy
3. **Производительность (20%)**: Inference Time
4. **Качество (10%)**: Forecast Quality Score

### Метрики оценки

#### Основные метрики
- **MAPE**: Mean Absolute Percentage Error (< 15% - хорошо)
- **Direction Accuracy**: Точность предсказания направления (> 65% - хорошо)
- **Inference Time**: Время генерации прогноза (< 2 сек - хорошо)

#### Система уверенности
```
Confidence = 0.40 × Data_Quality + 0.35 × Model_Quality + 0.25 × External_Factors
```

## 🎨 Frontend Архитектура

### Структура файлов
```
frontend/
├── index.html          # Главная страница
├── details.html        # Детальная аналитика
├── css/
│   ├── styless.css     # Основные стили
│   └── details.css     # Стили деталей
└── js/
    ├── cards.js        # Управление карточками
    ├── chartplaceholder.js # Графики
    └── dashboard.js    # Дашборд
```

### Компоненты

#### Dashboard Component
- **Stats Cards**: Метрики системы
- **Product Cards**: Управление товарами
- **Market Insights**: Рыночные инсайты
- **Notifications**: Уведомления

#### Product Management
- **Add Product Modal**: Добавление товаров
- **Product Cards**: Отображение товаров
- **Real-time Updates**: Автообновление данных

#### Analytics Visualization
- **Price Charts**: Графики цен
- **Forecast Charts**: Прогнозы
- **EDA Charts**: Исследовательский анализ

## 🐳 Docker Deployment

### Production Setup
```yaml
version: '3.8'
services:
  pricer-api:
    build: .
    ports:
      - "5229:5229"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    depends_on:
      - pricer-db

  pricer-db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=StrongP@ssw0rd123!

  pricer-frontend:
    build: ./PriceForecasting.Frontend
    ports:
      - "8080:80"
```

### Development Setup
```yaml
# docker-compose.override.yml
services:
  pricer-api:
    volumes:
      - ./src:/app
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
```

## 📊 Мониторинг и логирование

### Health Checks
```csharp
// API Health Check
app.MapHealthChecks("/health");

// Database Health Check
app.MapHealthChecks("/health/db");
```

### Метрики
- **Application Metrics**: Response time, error rate
- **Business Metrics**: ROI, user engagement
- **ML Metrics**: Model accuracy, inference time

### Логирование
```csharp
// Structured logging
logger.LogInformation("Forecast generated",
    new {
        Article = article,
        Model = modelName,
        Accuracy = accuracy,
        Duration = duration
    });
```

## 🔒 Безопасность

### API Security
- **CORS**: Настроен для фронтенда
- **Input Validation**: Все входные данные валидируются
- **SQL Injection**: EF Core parameterized queries
- **XSS Protection**: Frontend sanitization

### Data Protection
- **Encryption**: Sensitive data encrypted
- **Access Control**: Role-based permissions
- **Audit Logging**: Все действия логируются

## ⚡ Производительность

### Оптимизации
- **Database Indexing**: Оптимизированные индексы
- **Caching**: Redis для частых запросов
- **Async Operations**: Все I/O операции асинхронные
- **Connection Pooling**: Переиспользование соединений

### Benchmarks
- **API Response Time**: < 200ms (95th percentile)
- **ML Inference Time**: < 50ms per request
- **Database Query Time**: < 100ms
- **Frontend Load Time**: < 2s

## 🧪 Тестирование

### Unit Tests
```csharp
[Fact]
public async Task GetPriceDemo_ReturnsCorrectPrice()
{
    // Arrange
    var article = "482159736";

    // Act
    var result = await _controller.GetPriceDemo(article);

    // Assert
    Assert.IsType<OkObjectResult>(result);
}
```

### Integration Tests
```csharp
[Fact]
public async Task ForecastPipeline_WorksEndToEnd()
{
    // Test full forecast pipeline
    // ML service → API → Frontend
}
```

### Load Testing
- **Concurrent Users**: 100 simultaneous users
- **Response Time**: < 500ms under load
- **Error Rate**: < 1%

## 📈 Масштабирование

### Horizontal Scaling
- **API Layer**: Multiple instances behind load balancer
- **ML Layer**: Model serving with Kubernetes
- **Database**: Read replicas for analytics

### Database Optimization
- **Partitioning**: По времени для исторических данных
- **Archiving**: Автоматическое архивирование старых данных
- **Indexing**: Composite indexes для частых запросов

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: PRICER CI/CD
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - name: Build
        run: dotnet build
      - name: Test
        run: dotnet test
      - name: Docker Build
        run: docker-compose build
```

## 📚 API Versioning

### Version Strategy
```
GET /api/v1/products
GET /api/v1/forecast/{article}
POST /api/v1/recommendations/analyze
```

### Breaking Changes
- Major version bump (v1 → v2)
- Deprecation warnings
- Migration guides

---

*Техническая документация PRICER Platform v1.0*

