namespace Ecom.Api.Services;

public interface IOlapService
{
    Task<object> GetKpisAsync(string? year, string? territory);
    Task<object> GetProfitAnalysisAsync(string? year, string? territory);
    Task<object> GetFreightAnalysisAsync(string? year, string? territory);
    Task<object> GetTargetStatusAsync(string? year, string? territory);
    Task<object> GetFiltersAsync();
}
