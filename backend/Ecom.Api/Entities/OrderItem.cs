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

    public int SpecialOfferID { get; set; } = 1;
    public decimal UnitPriceDiscount { get; set; } = 0m;
    public Guid rowguid { get; set; } = Guid.NewGuid();
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
}
