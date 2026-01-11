// Controllers/PriceHistoryController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PriceHistoryController : ControllerBase
{
    private readonly AppDbContext _db;

    public PriceHistoryController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetByProduct(int productId)
    {
        var history = await _db.price_history
            .Where(ph => ph.product_id == productId)
            .OrderBy(ph => ph.created_at)
            .ToListAsync();
        return Ok(history);
    }

    [HttpGet("latest")]
    public async Task<IActionResult> GetLatestPrices()
    {
        // Получить последнюю цену для каждого товара
        var latest = await _db.price_history
            .GroupBy(ph => ph.product_id)
            .Select(g => g.OrderByDescending(ph => ph.created_at).First())
            .ToListAsync();
        return Ok(latest);
    }
}