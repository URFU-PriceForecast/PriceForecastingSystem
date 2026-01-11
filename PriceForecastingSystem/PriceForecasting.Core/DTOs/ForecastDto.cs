namespace PriceForecasting.Core.DTOs;

public class ForecastDto
{
    public List<ForecastPoint> Predictions { get; set; } = new();
    public List<string> Dates { get; set; } = new();
    public string Trend { get; set; } = default!;
    public int PeriodDays { get; set; }
}

public class ForecastPoint
{
    public DateTime Date { get; set; }
    public decimal Price { get; set; }
}
