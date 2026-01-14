using Microsoft.AspNetCore.Mvc;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("api/demo")]
public class DemoController : ControllerBase
{
    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new
        {
            message = "Demo API works without authorization!",
            timestamp = DateTime.Now,
            status = "success"
        });
    }

    [HttpGet("forecast/{article}")]
    public IActionResult GetDemoForecast(string article)
    {
        return Ok(new
        {
            forecast = new
            {
                predictions = new[] { 50000m, 51000m, 52000m, 51500m, 52500m, 53000m, 53500m },
                dates = new[]
                {
                    "2025-01-15", "2025-01-16", "2025-01-17", "2025-01-18",
                    "2025-01-19", "2025-01-20", "2025-01-21"
                },
                trend = "optimist",
                periodDays = 7
            },
            product = new
            {
                id = 1,
                article = article,
                name = $"Товар {article}",
                currentPrice = 50000m,
                lastPriceUpdate = DateTime.Now.ToString("yyyy-MM-dd")
            },
            values = new[] { 50000m, 51000m, 52000m, 51500m, 52500m, 53000m, 53500m },
            dates = new[]
            {
                "2025-01-15", "2025-01-16", "2025-01-17", "2025-01-18",
                "2025-01-19", "2025-01-20", "2025-01-21"
            },
            metrics = new
            {
                mape = 3.2,
                rmse = 1250.5,
                r2 = 0.89,
                directionAccuracy = 82.5,
                inferenceTime = 0.03
            },
            confidence = new
            {
                value = 0.85,
                level = "высокая уверенность",
                components = new
                {
                    dataQuality = 0.9,
                    modelQuality = 0.8,
                    externalFactors = 0.85
                }
            },
            recommendation = new
            {
                priceAction = "increase",
                percentage = 3.5,
                timeframe = "7 дней",
                confidence = 0.85,
                reasoning = "Демо-рекомендация на основе анализа трендов",
                scenario = "optimist"
            }
        });
    }

    [HttpGet("recommendations/{article}")]
    public IActionResult GetDemoRecommendations(string article)
    {
        return Ok(new
        {
            priceAction = "increase",
            percentage = 3.5,
            timeframe = "7 дней",
            confidence = 0.85,
            reasoning = "Демо-рекомендация: анализ показывает положительную динамику",
            scenario = "optimist"
        });
    }

    [HttpGet("price/{article}")]
    public IActionResult GetDemoPrice(string article)
    {
        return Ok(new
        {
            price = 50000m,
            date = DateTime.Now.ToString("yyyy-MM-dd"),
            product = new
            {
                id = 1,
                article = article,
                name = $"Товар {article}",
                description = "Демо-товар для тестирования системы",
                category_id = 1,
                brand = "DemoBrand",
                image_url = "/images/demo-product.jpg",
                currentPrice = 50000m,
                lastPriceUpdate = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss")
            }
        });
    }

    [HttpGet("products")]
    public IActionResult GetDemoProducts()
    {
        return Ok(new[]
        {
            new {
                id = 1,
                article = "482159736",
                name = "Смартфон iPhone 15 128GB",
                description = "Флагманский смартфон Apple",
                category_id = 1,
                brand = "Apple",
                image_url = "/images/iphone15.jpg"
            },
            new {
                id = 2,
                article = "5938472610",
                name = "Смартфон iPhone 15 256GB",
                description = "Флагманский смартфон Apple с увеличенной памятью",
                category_id = 1,
                brand = "Apple",
                image_url = "/images/iphone15-256.jpg"
            },
            new {
                id = 3,
                article = "620184735",
                name = "Смартфон Samsung Galaxy S24 128GB",
                description = "Флагманский смартфон Samsung",
                category_id = 1,
                brand = "Samsung",
                image_url = "/images/galaxy-s24.jpg"
            }
        });
    }
}
