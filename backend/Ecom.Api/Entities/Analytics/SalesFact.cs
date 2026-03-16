using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecom.Api.Entities.Analytics;

/// <summary>
/// Fact table at (SalesOrderDetail) grain.
/// One row ~ one line item.
/// </summary>
public class SalesFact
{
    public int? SalesOrderID { get; set; }
    public DateTime? OrderDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ShipDate { get; set; }
    public byte? Status { get; set; }
    public bool? OnlineOrderFlag { get; set; }
    public string? SalesOrderNumber { get; set; }
    public string? PurchaseOrderNumber { get; set; }
    public string? AccountNumber { get; set; }

    public int? CustomerID { get; set; }
    public int? SalesPersonID { get; set; }
    public int? TerritoryID { get; set; }
    public int? ShipMethodID { get; set; }
    public int? CurrencyRateID { get; set; }

    public decimal? SubTotal { get; set; }
    public decimal? TaxAmt { get; set; }
    public decimal? Freight { get; set; }
    public decimal? TotalDue { get; set; }

    [Key]
    public int SalesOrderDetailID { get; set; }
    public string? CarrierTrackingNumber { get; set; }
    public short? OrderQty { get; set; }
    public int? ProductID { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? UnitPriceDiscount { get; set; }

    [Column(TypeName = "numeric(38,6)")]
    public decimal? LineTotal { get; set; }

    // Navigation (optional)
    public CustomerDim? Customer { get; set; }
    public ProductDim? Product { get; set; }
    public CurrencyDim? Currency { get; set; }
    public SalesPersonDim? SalesPerson { get; set; }
    public ShipMethodDim? ShipMethod { get; set; }
    public TerritoryDim? Territory { get; set; }
}
