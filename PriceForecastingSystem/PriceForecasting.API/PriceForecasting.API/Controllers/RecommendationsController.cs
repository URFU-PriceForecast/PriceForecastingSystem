// Controllers/RecommendationsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;
using PriceForecasting.Core.DTOs;
using PriceForecasting.Core.Services;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMlService _mlService;

    public RecommendationsController(AppDbContext db, IMlService mlService)
    {
        _db = db;
        _mlService = mlService;
    }

    [HttpGet("demo/{article}")]
    public async Task<IActionResult> GetRecommendationDemo(
        string article,
        [FromQuery] int period = 30,
        [FromQuery] string scenario = "optimist")
    {
        // Найти товар по артикулу
        var product = await _db.products
            .FirstOrDefaultAsync(p => p.article == article);

        if (product == null)
        {
            return NotFound(new { message = "Товар не найден" });
        }

        // Получить историю цен за последние period дней
        var startDate = DateTime.Now.AddDays(-period);
        var priceHistory = await _db.price_history
            .Where(ph => ph.product_id == product.id && ph.created_at >= startDate)
            .OrderBy(ph => ph.created_at)
            .ToListAsync();

        if (!priceHistory.Any())
        {
            return Ok(new RecommendationDto
            {
                PriceAction = "hold",
                Percentage = 0,
                Timeframe = "Недостаточно данных",
                Confidence = 0.3m,
                Reasoning = "Недостаточно исторических данных для анализа",
                Scenario = scenario
            });
        }

        // Подготовить данные для ML сервиса
        var request = new RecommendationRequestDto
        {
            Article = article,
            Period = period,
            Scenario = scenario
        };

        var recommendation = await _mlService.GetRecommendationAsync(request);

        return Ok(recommendation);
    }

    [HttpGet("{article}")]
    public async Task<IActionResult> GetRecommendation(
        string article,
        [FromQuery] int period = 30,
        [FromQuery] string scenario = "optimist")
    {
        // Найти товар по артикулу
        var product = await _db.products
            .FirstOrDefaultAsync(p => p.article == article);

        if (product == null)
        {
            return NotFound(new { message = "Товар не найден" });
        }

        // Получить историю цен за последние period дней
        var startDate = DateTime.Now.AddDays(-period);
        var priceHistory = await _db.price_history
            .Where(ph => ph.product_id == product.id && ph.created_at >= startDate)
            .OrderBy(ph => ph.created_at)
            .ToListAsync();

        if (!priceHistory.Any())
        {
            return Ok(new RecommendationDto
            {
                PriceAction = "hold",
                Percentage = 0,
                Timeframe = "Недостаточно данных",
                Confidence = 0.3m,
                Reasoning = "Недостаточно исторических данных для анализа",
                Scenario = scenario
            });
        }

        // Подготовить данные для ML сервиса
        var request = new RecommendationRequestDto
        {
            Article = article,
            Period = period,
            Scenario = scenario
        };

        var recommendation = await _mlService.GetRecommendationAsync(request);

        return Ok(recommendation);
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeProduct([FromBody] RecommendationRequestDto request)
    {
        var product = await _db.products
            .FirstOrDefaultAsync(p => p.article == request.Article);

        if (product == null)
        {
            return NotFound(new { message = "Товар не найден" });
        }

        // Получить историю цен
        var startDate = DateTime.Now.AddDays(-request.Period);
        var priceHistory = await _db.price_history
            .Where(ph => ph.product_id == product.id && ph.created_at >= startDate)
            .OrderBy(ph => ph.created_at)
            .ToListAsync();

        if (!priceHistory.Any())
        {
            return BadRequest(new { message = "Недостаточно данных для анализа" });
        }

        var recommendation = await _mlService.GetRecommendationAsync(request);

        return Ok(new
        {
            product = new ProductDto
            {
                Id = product.id,
                Article = product.article,
                Name = product.name,
                CurrentPrice = priceHistory.Last().price,
                LastPriceUpdate = priceHistory.Last().created_at
            },
            recommendation = recommendation,
            dataPoints = priceHistory.Count,
            analysisPeriod = request.Period
        });
    }
}
