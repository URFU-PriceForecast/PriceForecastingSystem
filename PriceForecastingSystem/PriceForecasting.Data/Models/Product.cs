namespace PriceForecasting.Data.Models;

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