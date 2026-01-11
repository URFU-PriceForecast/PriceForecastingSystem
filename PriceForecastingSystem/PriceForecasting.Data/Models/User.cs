namespace PriceForecasting.Data.Models;

public class User
{
    public int id { get; set; }
    public string username { get; set; } = default!;
    public string password { get; set; } = default!; // хэш
    public string email { get; set; } = default!;
}