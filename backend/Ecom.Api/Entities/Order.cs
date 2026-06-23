namespace Ecom.Api.Entities;

public class Order
{
    public int Id { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    public decimal Total { get; set; }

    public int CustomerID { get; set; } = 1;
    public int BillToAddressID { get; set; } = 1;
    public int ShipToAddressID { get; set; } = 1;
    public int ShipMethodID { get; set; } = 1;

    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(7);
    public bool OnlineOrderFlag { get; set; } = true;
    public byte RevisionNumber { get; set; } = 0;
    public Guid rowguid { get; set; } = Guid.NewGuid();
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
