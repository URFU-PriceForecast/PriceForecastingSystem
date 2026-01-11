// Controllers/PriceController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;
using PriceForecasting.Core.DTOs;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PriceController : ControllerBase
{
    private readonly AppDbContext _db;

    public PriceController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("demo/{article}")]
    public async Task<IActionResult> GetPriceDemo(string article)
    {
        // Найти товар по артикулу
        var product = await _db.products
            .FirstOrDefaultAsync(p => p.article == article);

        if (product == null)
        {
            return NotFound(new { message = "Товар не найден" });
        }

        // Получить последнюю цену из истории
        var latestPrice = await _db.price_history
            .Where(ph => ph.product_id == product.id)
            .OrderByDescending(ph => ph.created_at)
            .FirstOrDefaultAsync();

        var response = new
        {
            price = latestPrice?.price ?? 0,
            date = latestPrice?.created_at.ToString("yyyy-MM-dd") ?? "Нет данных",
            product = new ProductDto
            {
                Id = product.id,
                Article = product.article,
                Name = product.name,
                Description = product.description,
                CategoryId = product.category_id,
                Brand = product.brand,
                ImageUrl = product.image_url,
                CurrentPrice = latestPrice?.price,
                LastPriceUpdate = latestPrice?.created_at
            }
        };

        return Ok(response);
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetProductPrices(int productId)
    {
        var product = await _db.products.FindAsync(productId);
        if (product == null)
        {
            return NotFound();
        }

        var prices = await _db.price_history
            .Where(ph => ph.product_id == productId)
            .OrderBy(ph => ph.created_at)
            .Select(ph => new
            {
                price = ph.price,
                date = ph.created_at.ToString("yyyy-MM-dd"),
                timestamp = ph.created_at
            })
            .ToListAsync();

        return Ok(new
        {
            product = new ProductDto
            {
                Id = product.id,
                Article = product.article,
                Name = product.name,
                Description = product.description,
                CategoryId = product.category_id,
                Brand = product.brand,
                ImageUrl = product.image_url
            },
            priceHistory = prices,
            currentPrice = prices.LastOrDefault()?.price ?? 0,
            lastUpdate = prices.LastOrDefault()?.date ?? "Нет данных"
        });
    }
}
