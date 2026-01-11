namespace PriceForecasting.Data.Models;

public class PriceHistory
{
    public int id { get; set; }
    public int product_id { get; set; }
    public decimal price { get; set; }
    public DateTime created_at { get; set; }
}