// Controllers/ProductsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;
using PriceForecasting.Core.DTOs;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await _db.products.ToListAsync();
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _db.products.FindAsync(id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpGet("by-category/{categoryId}")]
    public async Task<IActionResult> GetByCategory(int categoryId)
    {
        var products = await _db.products
            .Where(p => p.category_id == categoryId)
            .ToListAsync();
        return Ok(products);
    }

    [HttpPost("datacheck")]
    public async Task<IActionResult> DataCheck([FromBody] ArticleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Article))
        {
            return BadRequest(new { message = "Артикул не указан" });
        }

        // Найти товар по артикулу
        var product = await _db.products
            .FirstOrDefaultAsync(p => p.article == request.Article.Trim());

        if (product == null)
        {
            return NotFound(new { message = "Товар с таким артикулом не найден" });
        }

        // Получить последнюю цену
        var latestPrice = await _db.price_history
            .Where(ph => ph.product_id == product.id)
            .OrderByDescending(ph => ph.created_at)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            productId = product.id,
            article = product.article,
            name = product.name,
            currentPrice = latestPrice?.price ?? 0,
            lastUpdate = latestPrice?.created_at,
            categoryId = product.category_id,
            brand = product.brand,
            description = product.description,
            imageUrl = product.image_url
        });
    }
}

public class ArticleRequest
{
    public string Article { get; set; } = default!;
}