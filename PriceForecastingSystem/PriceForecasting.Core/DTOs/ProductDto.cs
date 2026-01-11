namespace PriceForecasting.Core.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string Article { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public string? Brand { get; set; }
    public string ImageUrl { get; set; } = default!;
    public decimal? CurrentPrice { get; set; }
    public DateTime? LastPriceUpdate { get; set; }
}
