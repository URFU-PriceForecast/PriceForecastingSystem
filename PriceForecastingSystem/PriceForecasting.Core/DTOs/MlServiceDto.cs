namespace PriceForecasting.Core.DTOs;

public class MlServiceRequest
{
    public List<float> PriceHistory { get; set; } = new();
    public List<DateTime> Dates { get; set; } = new();
    public string Scenario { get; set; } = "optimist";
    public int ForecastDays { get; set; } = 7;
}

public class MlServiceResponse
{
    public ForecastResult Forecast { get; set; } = new();
    public MetricsResult Metrics { get; set; } = new();
    public ConfidenceResult Confidence { get; set; } = new();
    public RecommendationResult Recommendation { get; set; } = new();
    public decimal CurrentPrice { get; set; }
}

public class ForecastResult
{
    public List<decimal> Predictions { get; set; } = new();
    public List<string> Dates { get; set; } = new();
    public string Trend { get; set; } = default!;
    public int PeriodDays { get; set; }
}

public class MetricsResult
{
    public double InferenceTime { get; set; }
    public string ModelName { get; set; } = default!;
}

public class ConfidenceResult
{
    public decimal Value { get; set; }
    public string Level { get; set; } = default!;
    public ConfidenceComponents Components { get; set; } = new();
}

public class ConfidenceComponents
{
    public decimal DataQuality { get; set; }
    public decimal ModelQuality { get; set; }
    public decimal ExternalFactors { get; set; }
}

public class RecommendationResult
{
    public string PriceAction { get; set; } = default!;
    public decimal Percentage { get; set; }
    public string Timeframe { get; set; } = default!;
    public decimal Confidence { get; set; }
    public string Reasoning { get; set; } = default!;
    public string Scenario { get; set; } = default!;
}
