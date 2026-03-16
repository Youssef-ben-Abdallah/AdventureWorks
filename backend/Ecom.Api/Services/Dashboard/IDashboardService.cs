using Ecom.Api.DTOs;

namespace Ecom.Api.Services.Dashboard;

public interface IDashboardService
{
    Task<DashboardFiltersDto> GetFiltersAsync(CancellationToken ct);

    Task<OverviewDto> GetOverviewAsync(DashboardQuery q, CancellationToken ct);
    Task<ProductsDto> GetProductsAsync(DashboardQuery q, CancellationToken ct);
    Task<CustomersDto> GetCustomersAsync(DashboardQuery q, CancellationToken ct);
    Task<SalesTeamDto> GetSalesTeamAsync(DashboardQuery q, CancellationToken ct);
    Task<ShippingDto> GetShippingAsync(DashboardQuery q, CancellationToken ct);
    Task<PagedResultDto<DetailRowDto>> GetDetailsAsync(DashboardQuery q, int page, int pageSize, CancellationToken ct);
}

public record DashboardQuery(
    DateTime? From,
    DateTime? To,
    int? TerritoryId,
    string? TerritoryGroup,
    int? SalesPersonId,
    int? ShipMethodId,
    string? Category,
    string? SubCategory,
    string? CurrencyCode,
    bool? Online
);
