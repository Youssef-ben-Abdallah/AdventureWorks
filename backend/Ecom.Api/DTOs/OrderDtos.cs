using Ecom.Api.Entities;

namespace Ecom.Api.DTOs;

public record CreateOrderItemDto(int ProductId, int Qty);

public record CreateOrderDto(List<CreateOrderItemDto> Items);

public record OrderItemDto(int Id, int ProductId, string ProductName, int Qty, decimal UnitPrice, decimal LineTotal);

public record OrderDto(
    int Id,
    DateTime CreatedAtUtc,
    OrderStatus Status,
    string UserId,
    string Username,
    decimal Total,
    List<OrderItemDto> Items
);

public record UpdateOrderStatusDto(OrderStatus Status);
