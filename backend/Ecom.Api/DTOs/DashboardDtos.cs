namespace Ecom.Api.DTOs;

public record DashboardFiltersDto(
    List<NamedItemDto> Territories,
    List<NamedItemDto> TerritoryGroups,
    List<NamedItemDto> SalesPeople,
    List<NamedItemDto> ShipMethods,
    List<NamedItemDto> ProductCategories,
    List<NamedItemDto> ProductSubCategories,
    List<NamedItemDto> Currencies
);

public record NamedItemDto(string Id, string Name);

public record KpiDto(string Key, string Label, decimal Value, string? Unit = null);

public record SeriesPointDto(string X, decimal Y);

public record BreakdownItemDto(string Key, string Label, decimal Value, decimal? Share = null);

public record OverviewDto(
    List<KpiDto> Kpis,
    List<SeriesPointDto> RevenueTrend,
    List<BreakdownItemDto> RevenueByCategory,
    List<BreakdownItemDto> RevenueByTerritory,
    List<BreakdownItemDto> TopProducts
);

public record ProductsDto(
    List<KpiDto> Kpis,
    List<BreakdownItemDto> CategoryMatrix,
    List<ProductScatterDto> Scatter,
    List<BreakdownItemDto> DiscountBands
);

public record ProductScatterDto(
    string ProductId,
    string ProductName,
    string Category,
    decimal Units,
    decimal Revenue,
    decimal MarginPct
);

public record CustomersDto(
    List<KpiDto> Kpis,
    List<BreakdownItemDto> RevenueDistribution,
    List<CustomerTopDto> TopCustomers,
    List<SeriesPointDto> CustomerTrend
);

public record CustomerTopDto(
    string CustomerId,
    string CustomerName,
    decimal Orders,
    decimal Revenue,
    DateTime? LastOrderDate
);

public record SalesTeamDto(
    List<KpiDto> Kpis,
    List<BreakdownItemDto> Leaderboard,
    List<SalesQuotaDto> Quota,
    List<HeatCellDto> TerritoryHeat
);

public record SalesQuotaDto(
    string SalesPersonId,
    string SalesPersonName,
    decimal Revenue,
    decimal? Quota
);

public record HeatCellDto(string RowKey, string ColKey, decimal Value);

public record ShippingDto(
    List<KpiDto> Kpis,
    List<BreakdownItemDto> LeadTimeByShipMethod,
    List<BreakdownItemDto> FreightByShipMethod,
    List<BreakdownItemDto> LeadTimeByTerritory
);

public record PagedResultDto<T>(List<T> Items, int Page, int PageSize, long Total);

public record DetailRowDto(
    int SalesOrderDetailId,
    int? SalesOrderId,
    DateTime? OrderDate,
    DateTime? ShipDate,
    string? Customer,
    string? Product,
    string? Category,
    string? Territory,
    string? Country,
    string? SalesPerson,
    string? ShipMethod,
    short? Qty,
    decimal? UnitPrice,
    decimal? Discount,
    decimal? LineTotal
);
