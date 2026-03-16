using System.ComponentModel.DataAnnotations;

namespace Ecom.Api.Entities.Analytics;

public class CurrencyDim
{
    [Key]
    public int CurrencyID { get; set; }
    public string? CurrencyCode { get; set; }
    public decimal? AverageRate { get; set; }
    public decimal? EndOfDayRate { get; set; }
    public DateTime? CurrencyRateDate { get; set; }
    public string? Name { get; set; }
}
