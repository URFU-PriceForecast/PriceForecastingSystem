namespace PriceForecasting.Core.DTOs;

public class RecommendationDto
{
    public string PriceAction { get; set; } = default!; // "increase", "decrease", "hold"
    public decimal Percentage { get; set; }
    public string Timeframe { get; set; } = default!;
    public decimal Confidence { get; set; }
    public string Reasoning { get; set; } = default!;
    public string Scenario { get; set; } = default!;
}

public class RecommendationRequestDto
{
    public string Article { get; set; } = default!;
    public int Period { get; set; } = 30;
    public string Scenario { get; set; } = "optimist"; // "optimist" или "pessimist"
}
