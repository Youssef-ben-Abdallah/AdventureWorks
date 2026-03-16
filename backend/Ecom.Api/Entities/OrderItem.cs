namespace Ecom.Api.Entities;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal => UnitPrice * Qty;
}
