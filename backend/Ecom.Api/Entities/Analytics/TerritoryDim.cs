using System.ComponentModel.DataAnnotations;

namespace Ecom.Api.Entities.Analytics;

public class TerritoryDim
{
    [Key]
    public int TerritoryID { get; set; }
    public string? Name { get; set; }
    public string? CountryRegionCode { get; set; }
    public string? Group { get; set; }
}
