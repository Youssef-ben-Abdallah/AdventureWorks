namespace Ecom.Api.Services;

public interface IOlapService
{
    Task<object> GetKpisAsync(string? year, string? territory);
    Task<object> GetProfitAnalysisAsync(string? year, string? territory, string? category = null);
    Task<object> GetSalesTrendAsync(string? year, string? territory, string? month = null);
    Task<object> GetTopProductsAsync(string? year, string? territory, string? subcategory = null);
    Task<object> GetTerritorySalesAsync(string? year, string? territoryGroup = null, string? territoryCountry = null);
    Task<object> GetFreightAnalysisAsync(string? year, string? territory);
    Task<object> GetTargetStatusAsync(string? year, string? territory);
    Task<object> GetFiltersAsync();

    // Product Insights
    Task<object> GetProductCostAnalysisAsync(string? year, string? territory, string? category = null, string? subcategory = null);
    Task<object> GetDiscountByProductAsync(string? year, string? territory, string? category = null);
    Task<object> GetOrderVolumeByProductAsync(string? year, string? territory);
    Task<object> GetPriceGapAnalysisAsync(string? year, string? territory);

    // Territory Map
    Task<object> GetTerritoryDetailAsync(string? year, string? territoryGroup = null, string? territoryCountry = null);

    // Employee Performance
    Task<object> GetEmployeeKpisAsync(string? year, string? territory);
    Task<object> GetTopEmployeesAsync(string? year, string? territory);
    Task<object> GetEmployeeSalesByTerritoryAsync(string? year, string? territoryGroup = null);
    Task<object> GetEmployeeAovAsync(string? year, string? territory);

    // Promotions & Discounts
    Task<object> GetPromotionKpisAsync(string? year, string? territory);
    Task<object> GetSalesByPromotionAsync(string? year, string? territory);
    Task<object> GetDiscountTrendAsync(string? year, string? territory, string? month = null);
    Task<object> GetSalesByCurrencyAsync(string? year, string? territory);

    // Order Fulfillment
    Task<object> GetFulfillmentKpisAsync(string? year, string? territory);
    Task<object> GetShippingVolumeAsync(string? year, string? territory, string? month = null);
    Task<object> GetFreightByTerritoryAsync(string? year, string? territoryGroup = null, string? territoryCountry = null);
    Task<object> GetOrderShipLagAsync(string? year, string? territory);
}
