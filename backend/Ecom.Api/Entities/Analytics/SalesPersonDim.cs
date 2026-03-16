using System.ComponentModel.DataAnnotations;

namespace Ecom.Api.Entities.Analytics;

public class SalesPersonDim
{
    [Key]
    public int BusinessEntityID { get; set; }
    public decimal? SalesQuota { get; set; }
    public decimal? Bonus { get; set; }
    public decimal? CommissionPct { get; set; }
    public int? TerritoryID { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}
