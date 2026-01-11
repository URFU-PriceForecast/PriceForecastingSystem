using PriceForecasting.Core.DTOs;

namespace PriceForecasting.Core.Services;

public interface IMlService
{
    Task<MlServiceResponse> GenerateForecastAsync(MlServiceRequest request);
    Task<RecommendationDto> GetRecommendationAsync(RecommendationRequestDto request);
}
