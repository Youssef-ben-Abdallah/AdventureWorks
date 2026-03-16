using System.ComponentModel.DataAnnotations;

namespace Ecom.Api.Entities.Analytics;

public class CustomerDim
{
    [Key]
    public int CustomerID { get; set; }
    public int? PersonID { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}
