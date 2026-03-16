using System.ComponentModel.DataAnnotations;

namespace Ecom.Api.Entities.Analytics;

public class ProductDim
{
    public int? ProductSubcategoryID { get; set; }

    [Key]
    public int ProductID { get; set; }

    public string? Name { get; set; }
    public string? ProductNumber { get; set; }
    public string? Color { get; set; }
    public decimal? ListPrice { get; set; }
    public string? Size { get; set; }
    public decimal? Weight { get; set; }
    public DateTime? SellEndDate { get; set; }
    public DateTime? SellStartDate { get; set; }
    public decimal? StandardCost { get; set; }
    public int? ProductCategoryID { get; set; }
    public string? SubCategoryName { get; set; }
    public string? CategoryName { get; set; }
}
