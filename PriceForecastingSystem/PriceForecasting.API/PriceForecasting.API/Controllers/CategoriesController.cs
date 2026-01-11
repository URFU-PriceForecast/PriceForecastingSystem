// Controllers/CategoriesController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _db.categories.ToListAsync();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _db.categories.FindAsync(id);
        if (category == null) return NotFound();
        return Ok(category);
    }

    // Получить дерево категорий (родитель → дети)
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var all = await _db.categories.ToListAsync();

        // Локальная функция BuildTree (объявлена до использования)
        List<CategoryDto> BuildTree(int? parentId)
        {
            return all
                .Where(c => c.parent_id == parentId)
                .Select(c => new CategoryDto
                {
                    id = c.id,
                    name = c.name,
                    parent_id = c.parent_id,
                    children = BuildTree(c.id) // рекурсивный вызов
                })
                .ToList();
        }

        return Ok(BuildTree(null));
    }
}

public class CategoryDto
{
    public int id { get; set; }
    public string name { get; set; } = default!;
    public int? parent_id { get; set; }
    public List<CategoryDto> children { get; set; } = new();
}