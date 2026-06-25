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
    public async Task<IActionResult> GetProfitAnalysis([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetProfitAnalysisAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("freight-analysis")]
    public async Task<IActionResult> GetFreightAnalysis([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetFreightAnalysisAsync(year, territory);
        return Ok(data);
    }

    [HttpGet("sales-trend")]
    public async Task<IActionResult> GetSalesTrend([FromQuery] string? year, [FromQuery] string? territory)
    {
        var result = await _olapService.GetSalesTrendAsync(year, territory);
        return Ok(result);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] string? year, [FromQuery] string? territory)
    {
        var result = await _olapService.GetTopProductsAsync(year, territory);
        return Ok(result);
    }

    [HttpGet("territory-sales")]
    public async Task<IActionResult> GetTerritorySales([FromQuery] string? year)
    {
        var result = await _olapService.GetTerritorySalesAsync(year);
        return Ok(result);
    }

    [HttpGet("target-status")]
    public async Task<IActionResult> GetTargetStatus([FromQuery] string? year, [FromQuery] string? territory)
    {
        var data = await _olapService.GetTargetStatusAsync(year, territory);
        return Ok(data);
    }
}
