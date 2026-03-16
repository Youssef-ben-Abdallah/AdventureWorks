using System.ComponentModel.DataAnnotations;

namespace Ecom.Api.Entities.Analytics;

public class ShipMethodDim
{
    [Key]
    public int ShipMethodID { get; set; }
    public string? Name { get; set; }
}
