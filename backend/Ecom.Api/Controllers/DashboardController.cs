using Ecom.Api.DTOs;
using Ecom.Api.Services.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _svc;

    public DashboardController(IDashboardService svc)
    {
        _svc = svc;
    }

    [HttpGet("filters")]
    public Task<DashboardFiltersDto> Filters(CancellationToken ct)
        => _svc.GetFiltersAsync(ct);

    [HttpGet("overview")]
    public Task<OverviewDto> Overview([FromQuery] DashboardQuery q, CancellationToken ct)
        => _svc.GetOverviewAsync(q, ct);

    [HttpGet("products")]
    public Task<ProductsDto> Products([FromQuery] DashboardQuery q, CancellationToken ct)
        => _svc.GetProductsAsync(q, ct);

    [HttpGet("customers")]
    public Task<CustomersDto> Customers([FromQuery] DashboardQuery q, CancellationToken ct)
        => _svc.GetCustomersAsync(q, ct);

    [HttpGet("sales-team")]
    public Task<SalesTeamDto> SalesTeam([FromQuery] DashboardQuery q, CancellationToken ct)
        => _svc.GetSalesTeamAsync(q, ct);

    [HttpGet("shipping")]
    public Task<ShippingDto> Shipping([FromQuery] DashboardQuery q, CancellationToken ct)
        => _svc.GetShippingAsync(q, ct);

    [HttpGet("details")]
    public Task<PagedResultDto<DetailRowDto>> Details(
        [FromQuery] DashboardQuery q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
        => _svc.GetDetailsAsync(q, page, pageSize, ct);
}
