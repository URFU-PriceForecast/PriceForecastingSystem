// Controllers/ForecastController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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

    [HttpGet("{article}")]
    [Authorize]
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
