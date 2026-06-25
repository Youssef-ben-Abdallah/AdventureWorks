using Ecom.Api.Entities;

namespace Ecom.Api.DTOs;

public record CreateOrderItemDto(int ProductId, int Qty);

public record CreateOrderDto(
    List<CreateOrderItemDto> Items,
    int CustomerID = 1,
    int BillToAddressID = 1,
    int ShipToAddressID = 1,
    int ShipMethodID = 1
);

public record OrderItemDto(int Id, int ProductId, string ProductName, int Qty, decimal UnitPrice, decimal LineTotal);

public record OrderDto(
    int Id,
    DateTime CreatedAtUtc,
    OrderStatus Status,
    string UserId,
    string Username,
    decimal Total,
    int CustomerID,
    int BillToAddressID,
    int ShipToAddressID,
    int ShipMethodID,
    List<OrderItemDto> Items
);

public record UpdateOrderStatusDto(OrderStatus Status);
