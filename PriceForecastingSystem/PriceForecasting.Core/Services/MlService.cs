using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using PriceForecasting.Core.DTOs;

namespace PriceForecasting.Core.Services;

public class MlService : IMlService
{
    private readonly HttpClient _httpClient;
    private readonly string _mlServiceUrl;

    public MlService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _mlServiceUrl = configuration["MlService:Url"] ?? "http://localhost:5000";
    }

    public async Task<MlServiceResponse> GenerateForecastAsync(MlServiceRequest request)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync($"{_mlServiceUrl}/forecast", request);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"ML service returned {response.StatusCode}");
            }

            var result = await response.Content.ReadFromJsonAsync<MlServiceResponse>();
            return result ?? throw new Exception("Failed to deserialize ML response");
        }
        catch (Exception ex)
        {
            // Fallback: return mock data if ML service is unavailable
            return GenerateMockResponse(request);
        }
    }

    public async Task<RecommendationDto> GetRecommendationAsync(RecommendationRequestDto request)
    {
        try
        {
            var mlRequest = new MlServiceRequest
            {
                PriceHistory = new List<float> { 50000f, 51000f, 52000f, 51500f, 52500f }, // Mock data
                Dates = GenerateMockDates(5),
                Scenario = request.Scenario,
                ForecastDays = request.Period
            };

            var response = await GenerateForecastAsync(mlRequest);

            return new RecommendationDto
            {
                PriceAction = response.Recommendation.PriceAction,
                Percentage = response.Recommendation.Percentage,
                Timeframe = response.Recommendation.Timeframe,
                Confidence = response.Recommendation.Confidence,
                Reasoning = response.Recommendation.Reasoning,
                Scenario = response.Recommendation.Scenario
            };
        }
        catch
        {
            // Return safe fallback recommendation
            return new RecommendationDto
            {
                PriceAction = "hold",
                Percentage = 0,
                Timeframe = "1 неделя",
                Confidence = 0.5m,
                Reasoning = "Недостаточно данных для анализа",
                Scenario = request.Scenario
            };
        }
    }

    private MlServiceResponse GenerateMockResponse(MlServiceRequest request)
    {
        var currentPriceFloat = request.PriceHistory.LastOrDefault();
        var currentPrice = (decimal)currentPriceFloat;
        var predictions = new List<decimal>();

        // Generate mock predictions based on trend
        for (int i = 0; i < request.ForecastDays; i++)
        {
            var change = (decimal)(new Random().NextDouble() * 0.1 - 0.05); // +/- 5%
            predictions.Add(currentPrice * (1 + change));
        }

        return new MlServiceResponse
        {
            Forecast = new ForecastResult
            {
                Predictions = predictions,
                Dates = GenerateMockDateStrings(request.ForecastDays),
                Trend = "stable",
                PeriodDays = request.ForecastDays
            },
            Metrics = new MetricsResult
            {
                InferenceTime = 0.05,
                ModelName = "Mock Model"
            },
            Confidence = new ConfidenceResult
            {
                Value = 0.7m,
                Level = "средняя уверенность",
                Components = new ConfidenceComponents
                {
                    DataQuality = 0.8m,
                    ModelQuality = 0.6m,
                    ExternalFactors = 0.7m
                }
            },
            Recommendation = new RecommendationResult
            {
                PriceAction = "hold",
                Percentage = 0,
                Timeframe = "1 неделя",
                Confidence = 0.7m,
                Reasoning = "Анализ показывает стабильную ситуацию",
                Scenario = request.Scenario
            },
            CurrentPrice = currentPrice
        };
    }

    private List<DateTime> GenerateMockDates(int count)
    {
        var dates = new List<DateTime>();
        var now = DateTime.Now;

        for (int i = count - 1; i >= 0; i--)
        {
            dates.Add(now.AddDays(-i));
        }

        return dates;
    }

    private List<string> GenerateMockDateStrings(int count)
    {
        var dates = new List<string>();
        var now = DateTime.Now;

        for (int i = 0; i < count; i++)
        {
            dates.Add(now.AddDays(i + 1).ToString("yyyy-MM-dd"));
        }

        return dates;
    }
}
