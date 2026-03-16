using System.Security.Claims;
using Ecom.Api.DTOs;
using Ecom.Api.Entities;
using Ecom.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderRepository _repo;
    private readonly IProductRepository _products;

    public OrdersController(IOrderRepository repo, IProductRepository products)
    {
        _repo = repo;
        _products = products;
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<OrderDto>>> MyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var rows = await _repo.GetMyOrdersAsync(userId);
        return rows.Select(Map).ToList();
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<OrderDto>>> AllOrders()
    {
        var rows = await _repo.GetAllOrdersAsync();
        return rows.Select(Map).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("uid") ?? "";
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        if (dto.Items.Count == 0) return BadRequest("Order must contain at least 1 item.");

        var items = new List<OrderItem>();
        var touchedProducts = new List<Product>();

        foreach (var i in dto.Items)
        {
            var p = await _products.GetByIdAsync(i.ProductId);
            if (p == null) return BadRequest($"Product {i.ProductId} not found");
            if (i.Qty <= 0) return BadRequest("Qty must be > 0");
            if (p.StockQty < i.Qty) return BadRequest($"Not enough stock for {p.Name}");

            p.StockQty -= i.Qty;
            touchedProducts.Add(p);

            items.Add(new OrderItem
            {
                ProductId = p.Id,
                Qty = i.Qty,
                UnitPrice = p.Price
            });
        }

        var order = new Order
        {
            UserId = userId,
            Status = OrderStatus.Pending,
            Items = items,
            Total = items.Sum(x => x.LineTotal)
        };

        var created = await _repo.AddAsync(order);

        foreach (var product in touchedProducts)
            await _products.UpdateAsync(product);

        var fetched = await _repo.GetByIdAsync(created.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, Map(fetched!));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _repo.GetByIdAsync(id);
        if (order == null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("uid") ?? "";
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && order.UserId != userId) return Forbid();
        return Map(order);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusDto dto)
    {
        var order = await _repo.GetByIdAsync(id);
        if (order == null) return NotFound();

        order.Status = dto.Status;
        await _repo.UpdateAsync(order);
        return NoContent();
    }

    private static OrderDto Map(Order o) => new(
        o.Id,
        o.CreatedAtUtc,
        o.Status,
        o.UserId,
        o.User?.UserName ?? "",
        o.Total,
        o.Items.Select(i => new OrderItemDto(
            i.Id,
            i.ProductId,
            i.Product?.Name ?? "",
            i.Qty,
            i.UnitPrice,
            i.LineTotal
        )).ToList()
    );
}
