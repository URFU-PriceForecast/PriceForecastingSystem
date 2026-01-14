// Controllers/ForecastController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;
using PriceForecasting.Core.DTOs;
using PriceForecasting.Core.Services;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ForecastController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMlService _mlService;

    public ForecastController(AppDbContext db, IMlService mlService)
    {
        _db = db;
        _mlService = mlService;
    }

    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new
        {
            message = "Test endpoint works without authorization",
            timestamp = DateTime.Now,
            status = "OK"
        });
    }

    [HttpGet("demo-test")]
    public IActionResult DemoTest()
    {
        return Ok(new
        {
            message = "Demo endpoint works",
            forecast = new
            {
                predictions = new[] { 1000m, 1050m, 1100m },
                dates = new[] { "2025-01-01", "2025-01-02", "2025-01-03" },
                trend = "optimist"
            },
            recommendations = new
            {
                action = "increase",
                percentage = 5.0,
                reasoning = "Demo recommendation"
            }
        });
    }

    [HttpGet("demo/{article}")]
    public async Task<IActionResult> GetForecastDemo(
        string article,
        [FromQuery] int days = 7,
        [FromQuery] string scenario = "optimist",
        [FromQuery] string model = "auto")
    {
        // Найти товар по артикулу
        var product = await _db.products
            .FirstOrDefaultAsync(p => p.article == article);

        if (product == null)
        {
            return NotFound(new { message = "Товар не найден" });
        }

        // Получить историю цен (минимум 30 дней для качественного прогноза)
        var startDate = DateTime.Now.AddDays(-90);
        var priceHistory = await _db.price_history
            .Where(ph => ph.product_id == product.id && ph.created_at >= startDate)
            .OrderBy(ph => ph.created_at)
            .ToListAsync();

        if (priceHistory.Count < 7)
        {
            return BadRequest(new
            {
                message = "Недостаточно исторических данных для прогноза",
                dataPoints = priceHistory.Count,
                required = 7
            });
        }

        // Для демо режима создаем mock данные без ML сервиса
        var mockPredictions = new List<decimal>();
        var mockDates = new List<string>();
        var currentPrice = priceHistory.Last().price;

        for (int i = 1; i <= days; i++)
        {
            var trendMultiplier = scenario switch
            {
                "optimist" => 1.02,
                "pessimist" => 0.98,
                _ => 1.005
            };
            var price = currentPrice * (decimal)Math.Pow(trendMultiplier, i);
            mockPredictions.Add(price);
            mockDates.Add(DateTime.Now.AddDays(i).ToString("yyyy-MM-dd"));
        }

        // Для демо режима возвращаем mock данные
        var forecast = new ForecastDto
        {
            Predictions = mockPredictions.Select((price, index) =>
                new ForecastPoint
                {
                    Date = DateTime.Parse(mockDates[index]),
                    Price = price
                }).ToList(),
            Dates = mockDates,
            Trend = scenario,
            PeriodDays = days
        };

        return Ok(new
        {
            forecast = forecast,
            product = new ProductDto
            {
                Id = product.id,
                Article = product.article,
                Name = product.name,
                CurrentPrice = priceHistory.Last().price,
                LastPriceUpdate = priceHistory.Last().created_at
            },
            values = forecast.Predictions.Select(p => p.Price).ToList(),
            dates = forecast.Predictions.Select(p => p.Date.ToString("yyyy-MM-dd")).ToList(),
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
                priceAction = scenario == "optimist" ? "increase" : scenario == "pessimist" ? "decrease" : "hold",
                percentage = 3.5,
                timeframe = $"{days} дней",
                confidence = 0.85,
                reasoning = $"Рекомендация основана на {scenario} сценарии развития рынка",
                scenario = scenario
            }
        });
    }

    [HttpGet("{article}")]
    public async Task<IActionResult> GetForecast(
        string article,
        [FromQuery] int days = 7,
        [FromQuery] string scenario = "optimist",
        [FromQuery] string model = "auto")
    {
        // Найти товар по артикулу
        var product = await _db.products
            .FirstOrDefaultAsync(p => p.article == article);

        if (product == null)
        {
            return NotFound(new { message = "Товар не найден" });
        }

        // Получить историю цен (минимум 30 дней для качественного прогноза)
        var startDate = DateTime.Now.AddDays(-90);
        var priceHistory = await _db.price_history
            .Where(ph => ph.product_id == product.id && ph.created_at >= startDate)
            .OrderBy(ph => ph.created_at)
            .ToListAsync();

        if (priceHistory.Count < 7)
        {
            return BadRequest(new
            {
                message = "Недостаточно исторических данных для прогноза",
                dataPoints = priceHistory.Count,
                required = 7
            });
        }

        // Подготовить данные для ML сервиса
        var mlRequest = new MlServiceRequest
        {
            PriceHistory = priceHistory.Select(ph => (float)ph.price).ToList(),
            Dates = priceHistory.Select(ph => ph.created_at).ToList(),
            Scenario = scenario,
            ForecastDays = days
        };

        var mlResponse = await _mlService.GenerateForecastAsync(mlRequest);

        // Преобразовать ответ в формат для фронтенда
        var forecast = new ForecastDto
        {
            Predictions = mlResponse.Forecast.Predictions.Select((price, index) =>
                new ForecastPoint
                {
                    Date = DateTime.Parse(mlResponse.Forecast.Dates[index]),
                    Price = price
                }).ToList(),
            Dates = mlResponse.Forecast.Dates,
            Trend = mlResponse.Forecast.Trend,
            PeriodDays = mlResponse.Forecast.PeriodDays
        };

        return Ok(new
        {
            forecast = forecast,
            product = new ProductDto
            {
                Id = product.id,
                Article = product.article,
                Name = product.name,
                CurrentPrice = priceHistory.Last().price,
                LastPriceUpdate = priceHistory.Last().created_at
            },
            values = forecast.Predictions.Select(p => p.Price).ToList(),
            dates = forecast.Predictions.Select(p => p.Date.ToString("yyyy-MM-dd")).ToList(),
            metrics = mlResponse.Metrics,
            confidence = mlResponse.Confidence,
            recommendation = mlResponse.Recommendation
        });
    }

    [HttpPost("detailed")]
    public async Task<IActionResult> GetDetailedForecast([FromBody] MlServiceRequest request)
    {
        if (request.PriceHistory.Count < 7)
        {
            return BadRequest(new { message = "Нужно минимум 7 точек данных для прогноза" });
        }

        if (request.Dates.Count != request.PriceHistory.Count)
        {
            return BadRequest(new { message = "Количество дат должно соответствовать количеству цен" });
        }

        var response = await _mlService.GenerateForecastAsync(request);

        return Ok(response);
    }
}
