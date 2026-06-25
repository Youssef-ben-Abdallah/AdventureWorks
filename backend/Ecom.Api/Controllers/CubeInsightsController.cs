using Microsoft.AspNetCore.Mvc;
using Ecom.Api.Services;

namespace Ecom.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CubeInsightsController : ControllerBase
{
    private readonly IOlapService _olapService;

    public CubeInsightsController(IOlapService olapService)
    {
        _olapService = olapService;
    }

    [HttpGet("filters")]
    public async Task<IActionResult> GetFilters()
    {
        var data = await _olapService.GetFiltersAsync();
        return Ok(data);
    }

    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetKpisAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("profit-analysis")]
    public async Task<IActionResult> GetProfitAnalysis([FromQuery] string? year, [FromQuery] string? territory, [FromQuery] string? category)
    {
        var data = await _olapService.GetProfitAnalysisAsync(year, territory, category);
        return Ok(data);
    }

    [HttpGet("freight-analysis")]
    public async Task<IActionResult> GetFreightAnalysis([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetFreightAnalysisAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("sales-trend")]
    public async Task<IActionResult> GetSalesTrend([FromQuery] string? year, [FromQuery] string? territory, [FromQuery] string? month)
    {
        var result = await _olapService.GetSalesTrendAsync(year, territory, month);
        return Ok(result);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] string? year, [FromQuery] string? territory, [FromQuery] string? subcategory)
    {
        var result = await _olapService.GetTopProductsAsync(year, territory, subcategory);
        return Ok(result);
    }

    [HttpGet("territory-sales")]
    public async Task<IActionResult> GetTerritorySales([FromQuery] string? year, [FromQuery] string? territoryGroup, [FromQuery] string? territoryCountry)
    {
        var data = await _olapService.GetTerritorySalesAsync(year, territoryGroup, territoryCountry);
        return Ok(data);
    }

    [HttpGet("target-status")]
    public async Task<IActionResult> GetTargetStatus([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetTargetStatusAsync(year, territory);
        return Ok(data);
    }

    // Product Insights
    [HttpGet("product-cost-analysis")]
    public async Task<IActionResult> GetProductCostAnalysis([FromQuery] string? year, [FromQuery] string? territory, [FromQuery] string? category, [FromQuery] string? subcategory)
    {
        var data = await _olapService.GetProductCostAnalysisAsync(year, territory, category, subcategory);
        return Ok(data);
    }

    [HttpGet("discount-by-product")]
    public async Task<IActionResult> GetDiscountByProduct([FromQuery] string? year, [FromQuery] string? territory, [FromQuery] string? category)
    {
        var data = await _olapService.GetDiscountByProductAsync(year, territory, category);
        return Ok(data);
    }

    [HttpGet("order-volume-by-product")]
    public async Task<IActionResult> GetOrderVolumeByProduct([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetOrderVolumeByProductAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("price-gap-analysis")]
    public async Task<IActionResult> GetPriceGapAnalysis([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetPriceGapAnalysisAsync(year, territory);
        return Ok(data);
    }

    // Territory Map Detail
    [HttpGet("territory-detail")]
    public async Task<IActionResult> GetTerritoryDetail([FromQuery] string? year, [FromQuery] string? territoryGroup, [FromQuery] string? territoryCountry)
    {
        var data = await _olapService.GetTerritoryDetailAsync(year, territoryGroup, territoryCountry);
        return Ok(data);
    }

    // Employee Performance
    [HttpGet("employee-kpis")]
    public async Task<IActionResult> GetEmployeeKpis([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetEmployeeKpisAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("top-employees")]
    public async Task<IActionResult> GetTopEmployees([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetTopEmployeesAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("employee-sales-by-territory")]
    public async Task<IActionResult> GetEmployeeSalesByTerritory([FromQuery] string? year, [FromQuery] string? territoryGroup)
    {
        var data = await _olapService.GetEmployeeSalesByTerritoryAsync(year, territoryGroup);
        return Ok(data);
    }

    [HttpGet("employee-aov")]
    public async Task<IActionResult> GetEmployeeAov([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetEmployeeAovAsync(year, territory);
        return Ok(data);
    }

    // Promotions & Discounts
    [HttpGet("promotion-kpis")]
    public async Task<IActionResult> GetPromotionKpis([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetPromotionKpisAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("sales-by-promotion")]
    public async Task<IActionResult> GetSalesByPromotion([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetSalesByPromotionAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("discount-trend")]
    public async Task<IActionResult> GetDiscountTrend([FromQuery] string? year, [FromQuery] string? territory, [FromQuery] string? month)
    {
        var data = await _olapService.GetDiscountTrendAsync(year, territory, month);
        return Ok(data);
    }

    [HttpGet("sales-by-currency")]
    public async Task<IActionResult> GetSalesByCurrency([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetSalesByCurrencyAsync(year, territory);
        return Ok(data);
    }

    // Order Fulfillment
    [HttpGet("fulfillment-kpis")]
    public async Task<IActionResult> GetFulfillmentKpis([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetFulfillmentKpisAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("shipping-volume")]
    public async Task<IActionResult> GetShippingVolume([FromQuery] string? year, [FromQuery] string? territory, [FromQuery] string? month)
    {
        var data = await _olapService.GetShippingVolumeAsync(year, territory, month);
        return Ok(data);
    }

    [HttpGet("freight-by-territory")]
    public async Task<IActionResult> GetFreightByTerritory([FromQuery] string? year, [FromQuery] string? territoryGroup, [FromQuery] string? territoryCountry)
    {
        var data = await _olapService.GetFreightByTerritoryAsync(year, territoryGroup, territoryCountry);
        return Ok(data);
    }

    [HttpGet("order-ship-lag")]
    public async Task<IActionResult> GetOrderShipLag([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetOrderShipLagAsync(year, territory);
        return Ok(data);
    }
}
