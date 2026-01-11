namespace PriceForecasting.Data.Models;

public class Category
{
    public int id { get; set; }
    public string name { get; set; } = default!;
    public int? parent_id { get; set; }
}