using Ecom.Api.Data;
using Ecom.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Services.Dashboard;

public class DashboardService : IDashboardService
{
    private readonly AnalyticsDbContext _db;

    public DashboardService(AnalyticsDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardFiltersDto> GetFiltersAsync(CancellationToken ct)
    {
        var territories = await _db.Territories
            .OrderBy(t => t.Name)
            .Select(t => new NamedItemDto(t.TerritoryID.ToString(), t.Name ?? $"Territory {t.TerritoryID}"))
            .ToListAsync(ct);

        var territoryGroups = await _db.Territories
            .Where(t => t.Group != null)
            .Select(t => t.Group!)
            .Distinct()
            .OrderBy(x => x)
            .Select(g => new NamedItemDto(g, g))
            .ToListAsync(ct);

        var salesPeople = await _db.SalesPeople
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .Select(s => new NamedItemDto(s.BusinessEntityID.ToString(), (s.FirstName + " " + s.LastName).Trim()))
            .ToListAsync(ct);

        var shipMethods = await _db.ShipMethods
            .OrderBy(s => s.Name)
            .Select(s => new NamedItemDto(s.ShipMethodID.ToString(), s.Name ?? $"ShipMethod {s.ShipMethodID}"))
            .ToListAsync(ct);

        var categories = await _db.Products
            .Where(p => p.CategoryName != null)
            .Select(p => p.CategoryName!)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new NamedItemDto(x, x))
            .ToListAsync(ct);

        var subCategories = await _db.Products
            .Where(p => p.SubCategoryName != null)
            .Select(p => p.SubCategoryName!)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new NamedItemDto(x, x))
            .ToListAsync(ct);

        var currencies = await _db.Currencies
            .Where(c => c.CurrencyCode != null)
            .Select(c => c.CurrencyCode!)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new NamedItemDto(x, x))
            .ToListAsync(ct);

        return new DashboardFiltersDto(
            Territories: territories,
            TerritoryGroups: territoryGroups,
            SalesPeople: salesPeople,
            ShipMethods: shipMethods,
            ProductCategories: categories,
            ProductSubCategories: subCategories,
            Currencies: currencies
        );
    }

    public async Task<OverviewDto> GetOverviewAsync(DashboardQuery q, CancellationToken ct)
    {
        var baseQ = ApplyFilters(_db.Sales.AsNoTracking(), q);

        // KPIs
        var revenue = await baseQ.SumAsync(x => (decimal?)(x.LineTotal ?? 0m), ct) ?? 0m;
        var orders = await baseQ.Select(x => x.SalesOrderID).Distinct().CountAsync(ct);
        var units = await baseQ.SumAsync(x => (int?)(x.OrderQty ?? 0), ct) ?? 0;
        var aov = orders == 0 ? 0m : revenue / orders;

        // Shipping KPIs
        var leadTimeAvg = await baseQ
            .Where(x => x.OrderDate != null && x.ShipDate != null)
            .Select(x => EF.Functions.DateDiffDay(x.OrderDate!.Value, x.ShipDate!.Value))
            .AverageAsync(x => (double?)x, ct);
        var onTimePct = await baseQ
            .Where(x => x.ShipDate != null && x.DueDate != null)
            .Select(x => x.ShipDate!.Value <= x.DueDate!.Value ? 1 : 0)
            .AverageAsync(x => (double?)x, ct);
        var freight = await baseQ.SumAsync(x => (decimal?)(x.Freight ?? 0m), ct) ?? 0m;
        var freightPct = revenue == 0 ? 0m : freight / revenue;

        var kpis = new List<KpiDto>
        {
            new("revenue", "Revenue", revenue, "$") ,
            new("orders", "Orders", orders, "") ,
            new("units", "Units", units, "") ,
            new("aov", "Avg Order Value", aov, "$") ,
            new("onTime", "On-Time %", (decimal)((onTimePct ?? 0) * 100.0), "%") ,
            new("freightPct", "Freight %", freightPct * 100m, "%")
        };

        // Trend by month
        var trendRaw = await baseQ
    .Where(x => x.OrderDate != null)
    .GroupBy(x => new
    {
        Year = x.OrderDate!.Value.Year,
        Month = x.OrderDate!.Value.Month
    })
    .Select(g => new
    {
        g.Key.Year,
        g.Key.Month,
        Value = g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m
    })
    .OrderBy(x => x.Year).ThenBy(x => x.Month)
    .ToListAsync(ct);

        var trend = trendRaw
            .Select(x => new SeriesPointDto(
                $"{x.Year:0000}-{x.Month:00}",
                x.Value
            ))
            .ToList();

        // Revenue by category
        var byCategory = await baseQ
            .Join(_db.Products.AsNoTracking(), s => s.ProductID, p => p.ProductID, (s, p) => new { s.LineTotal, p.CategoryName })
            .GroupBy(x => x.CategoryName ?? "(Unknown)")
            .Select(g => new { Key = g.Key, Value = g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m })
            .OrderByDescending(x => x.Value)
            .Take(10)
            .ToListAsync(ct);
        var catTotal = byCategory.Sum(x => x.Value);
        var byCategoryDto = byCategory
            .Select(x => new BreakdownItemDto(x.Key, x.Key, x.Value, catTotal == 0 ? null : x.Value / catTotal))
            .ToList();

        // Revenue by territory
        var byTerritory = await baseQ
            .Join(_db.Territories.AsNoTracking(), s => s.TerritoryID, t => t.TerritoryID, (s, t) => new { s.LineTotal, Territory = t.Name })
            .GroupBy(x => x.Territory ?? "(Unknown)")
            .Select(g => new { Key = g.Key, Value = g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m })
            .OrderByDescending(x => x.Value)
            .Take(10)
            .ToListAsync(ct);
        var terrTotal = byTerritory.Sum(x => x.Value);
        var byTerritoryDto = byTerritory
            .Select(x => new BreakdownItemDto(x.Key, x.Key, x.Value, terrTotal == 0 ? null : x.Value / terrTotal))
            .ToList();

        // Top products
        var topProducts = await baseQ
            .Join(_db.Products.AsNoTracking(), s => s.ProductID, p => p.ProductID, (s, p) => new { s.LineTotal, Product = p.Name })
            .GroupBy(x => x.Product ?? "(Unknown)")
            .Select(g => new { Key = g.Key, Value = g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m })
            .OrderByDescending(x => x.Value)
            .Take(10)
            .ToListAsync(ct);
        var prodTotal = topProducts.Sum(x => x.Value);
        var topProductsDto = topProducts
            .Select(x => new BreakdownItemDto(x.Key, x.Key, x.Value, prodTotal == 0 ? null : x.Value / prodTotal))
            .ToList();

        return new OverviewDto(kpis, trend, byCategoryDto, byTerritoryDto, topProductsDto);
    }

    public async Task<ProductsDto> GetProductsAsync(DashboardQuery q, CancellationToken ct)
    {
        var baseQ = ApplyFilters(_db.Sales.AsNoTracking(), q);

        var revenue = await baseQ.SumAsync(x => (decimal?)(x.LineTotal ?? 0m), ct) ?? 0m;
        var units = await baseQ.SumAsync(x => (int?)(x.OrderQty ?? 0), ct) ?? 0;

        // margin estimate using Product.StandardCost (best-effort; costs can be null)
        var margin = await baseQ
            .Join(_db.Products.AsNoTracking(), s => s.ProductID, p => p.ProductID, (s, p) => new { s, p })
            .SumAsync(x => (decimal?)(((x.s.UnitPrice ?? 0m) - (x.p.StandardCost ?? 0m)) * (x.s.OrderQty ?? 0)), ct) ?? 0m;
        var marginPct = revenue == 0 ? 0m : margin / revenue;
        var asp = units == 0 ? 0m : revenue / units;

        var kpis = new List<KpiDto>
        {
            new("revenue", "Revenue", revenue, "$") ,
            new("units", "Units", units, "") ,
            new("asp", "Avg Selling Price", asp, "$") ,
            new("marginPct", "Est. Margin %", marginPct * 100m, "%")
        };

        // Category matrix (Category/SubCategory flattened into a single key label)
        var matrix = await baseQ
            .Join(_db.Products.AsNoTracking(), s => s.ProductID, p => p.ProductID, (s, p) => new { s.LineTotal, p.CategoryName, p.SubCategoryName })
            .GroupBy(x => new { Cat = x.CategoryName ?? "(Unknown)", Sub = x.SubCategoryName ?? "(Unknown)" })
            .Select(g => new { Label = g.Key.Cat + " / " + g.Key.Sub, Value = g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m })
            .OrderByDescending(x => x.Value)
            .Take(5)
            .ToListAsync(ct);
        var matrixTotal = matrix.Sum(x => x.Value);
        var matrixDto = matrix.Select(x => new BreakdownItemDto(x.Label, x.Label, x.Value, matrixTotal == 0 ? null : x.Value / matrixTotal)).ToList();

        // Scatter: per product
        var scatterRaw = await baseQ
            .Join(_db.Products.AsNoTracking(), s => s.ProductID, p => p.ProductID, (s, p) => new { s, p })
            .GroupBy(x => new { x.p.ProductID, x.p.Name, x.p.CategoryName, x.p.StandardCost })
            .Select(g => new
            {
                g.Key.ProductID,
                ProductName = g.Key.Name ?? "(Unknown)",
                Category = g.Key.CategoryName ?? "(Unknown)",
                Units = g.Sum(x => (int?)(x.s.OrderQty ?? 0)) ?? 0,
                Revenue = g.Sum(x => (decimal?)(x.s.LineTotal ?? 0m)) ?? 0m,
                Margin = g.Sum(x => (decimal?)(((x.s.UnitPrice ?? 0m) - (g.Key.StandardCost ?? 0m)) * (x.s.OrderQty ?? 0))) ?? 0m
            })
            .OrderByDescending(x => x.Revenue)
            .Take(10)
            .ToListAsync(ct);

        var scatter = scatterRaw.Select(x => new ProductScatterDto(
            x.ProductID.ToString(),
            x.ProductName,
            x.Category,
            x.Units,
            x.Revenue,
            x.Revenue == 0 ? 0m : (x.Margin / x.Revenue) * 100m
        )).ToList();

        // Discount bands based on UnitPriceDiscount / UnitPrice
        var rows = await baseQ
    .Select(x => new
    {
        UnitPrice = x.UnitPrice,
        UnitPriceDiscount = x.UnitPriceDiscount,
        LineTotal = x.LineTotal
    })
    .ToListAsync(ct);

        var discountBands = rows
            .Select(x =>
            {
                string band;
                if (x.UnitPrice is null || x.UnitPrice == 0m) band = "(Unknown)";
                else
                {
                    var r = (x.UnitPriceDiscount ?? 0m) / x.UnitPrice.Value;
                    band = r == 0m ? "0%"
                        : r <= 0.05m ? "0–5%"
                        : r <= 0.15m ? "5–15%"
                        : ">15%";
                }
                return new { Band = band, Value = x.LineTotal ?? 0m };
            })
            .GroupBy(x => x.Band)
            .Select(g => new { Band = g.Key, Value = g.Sum(v => v.Value) })
            .OrderByDescending(x => x.Value)
            .ToList();
        var discTotal = discountBands.Sum(x => x.Value);
        var discDto = discountBands.Select(x => new BreakdownItemDto(x.Band, x.Band, x.Value, discTotal == 0 ? null : x.Value / discTotal)).ToList();

        return new ProductsDto(kpis, matrixDto, scatter, discDto);
    }

    public async Task<CustomersDto> GetCustomersAsync(DashboardQuery q, CancellationToken ct)
    {
        var baseQ = ApplyFilters(_db.Sales.AsNoTracking(), q);

        var revenue = await baseQ.SumAsync(x => (decimal?)(x.LineTotal ?? 0m), ct) ?? 0m;
        var customers = await baseQ.Select(x => x.CustomerID).Where(x => x != null).Distinct().CountAsync(ct);
        var orders = await baseQ.Select(x => x.SalesOrderID).Distinct().CountAsync(ct);

        var revPerCust = customers == 0 ? 0m : revenue / customers;
        var ordPerCust = customers == 0 ? 0m : (decimal)orders / customers;

        var kpis = new List<KpiDto>
        {
            new("customers", "Active Customers", customers, ""),
            new("revPerCust", "Revenue / Customer", revPerCust, "$") ,
            new("ordPerCust", "Orders / Customer", ordPerCust, "")
        };

        // Revenue per customer distribution (bins)
        var perCustomer = await baseQ
            .GroupBy(x => x.CustomerID)
            .Select(g => new { CustomerID = g.Key, Revenue = g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m })
            .ToListAsync(ct);

        string Bin(decimal v) => v switch
        {
            < 1000m => "< 1k",
            < 5000m => "1k–5k",
            < 20000m => "5k–20k",
            < 50000m => "20k–50k",
            _ => ">= 50k"
        };

        var dist = perCustomer
            .GroupBy(x => Bin(x.Revenue))
            .Select(g => new { Band = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToList();
        var distTotal = dist.Sum(x => (decimal)x.Count);
        var distDto = dist.Select(x => new BreakdownItemDto(x.Band, x.Band, x.Count, distTotal == 0 ? null : x.Count / distTotal)).ToList();

        // Top customers
        var top = await baseQ
            .Join(_db.Customers.AsNoTracking(), s => s.CustomerID, c => c.CustomerID, (s, c) => new { s, c })
            .GroupBy(x => new { x.c.CustomerID, x.c.FirstName, x.c.LastName })
            .Select(g => new
            {
                g.Key.CustomerID,
                Name = ((g.Key.FirstName ?? "") + " " + (g.Key.LastName ?? "")).Trim(),
                Orders = g.Select(x => x.s.SalesOrderID).Distinct().Count(),
                Revenue = g.Sum(x => (decimal?)(x.s.LineTotal ?? 0m)) ?? 0m,
                LastOrder = g.Max(x => x.s.OrderDate)
            })
            .OrderByDescending(x => x.Revenue)
            .Take(10)
            .ToListAsync(ct);
        var topDto = top.Select(x => new CustomerTopDto(
            x.CustomerID.ToString(),
            string.IsNullOrWhiteSpace(x.Name) ? $"Customer {x.CustomerID}" : x.Name,
            x.Orders,
            x.Revenue,
            x.LastOrder
        )).ToList();

        // Customer trend (active customers per month)
        var trendRaw = await baseQ
    .Where(x => x.OrderDate != null && x.CustomerID != null)
    .GroupBy(x => new
    {
        Year = x.OrderDate!.Value.Year,
        Month = x.OrderDate!.Value.Month
    })
    .Select(g => new
    {
        g.Key.Year,
        g.Key.Month,
        Customers = g.Select(x => x.CustomerID).Distinct().Count()
    })
    .OrderBy(x => x.Year).ThenBy(x => x.Month)
    .ToListAsync(ct);

        var trend = trendRaw
            .Select(x => new SeriesPointDto(
                $"{x.Year:0000}-{x.Month:00}",
                x.Customers
            ))
            .ToList();

        return new CustomersDto(kpis, distDto, topDto, trend);
    }

    public async Task<SalesTeamDto> GetSalesTeamAsync(DashboardQuery q, CancellationToken ct)
    {
        var baseQ = ApplyFilters(_db.Sales.AsNoTracking(), q);

        var revenue = await baseQ.SumAsync(x => (decimal?)(x.LineTotal ?? 0m), ct) ?? 0m;
        var orders = await baseQ.Select(x => x.SalesOrderID).Distinct().CountAsync(ct);
        var aov = orders == 0 ? 0m : revenue / orders;
        var kpis = new List<KpiDto>
        {
            new("revenue", "Revenue", revenue, "$") ,
            new("orders", "Orders", orders, "") ,
            new("aov", "Avg Order Value", aov, "$")
        };

        // Leaderboard
        var leaderboard = await baseQ
            .Join(_db.SalesPeople.AsNoTracking(), s => s.SalesPersonID, sp => sp.BusinessEntityID, (s, sp) => new { s.LineTotal, sp.FirstName, sp.LastName, sp.BusinessEntityID, sp.SalesQuota })
            .GroupBy(x => new { x.BusinessEntityID, x.FirstName, x.LastName })
            .Select(g => new
            {
                Id = g.Key.BusinessEntityID,
                Name = ((g.Key.FirstName ?? "") + " " + (g.Key.LastName ?? "")).Trim(),
                Revenue = g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m
            })
            .OrderByDescending(x => x.Revenue)
            .Take(20)
            .ToListAsync(ct);
        var lbTotal = leaderboard.Sum(x => x.Revenue);
        var lbDto = leaderboard.Select(x => new BreakdownItemDto(x.Id.ToString(), string.IsNullOrWhiteSpace(x.Name) ? $"SalesPerson {x.Id}" : x.Name, x.Revenue, lbTotal == 0 ? null : x.Revenue / lbTotal)).ToList();

        // Quota
        var quotaRaw = await baseQ
    .Where(s => s.SalesPersonID != null) // important to avoid null join keys
    .Join(
        _db.SalesPeople.AsNoTracking(),
        s => s.SalesPersonID!.Value,          // align types
        sp => sp.BusinessEntityID,
        (s, sp) => new
        {
            s.LineTotal,
            sp.BusinessEntityID,
            sp.SalesQuota,
            sp.FirstName,
            sp.LastName
        })
    .GroupBy(x => new
    {
        x.BusinessEntityID,
        x.SalesQuota,
        x.FirstName,
        x.LastName
    })
    .Select(g => new
    {
        g.Key.BusinessEntityID,
        g.Key.SalesQuota,
        g.Key.FirstName,
        g.Key.LastName,
        Revenue = g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m
    })
    .OrderByDescending(x => x.Revenue)
    .Take(10)
    .ToListAsync(ct);

        // presentation-safe (in memory)
        var quota = quotaRaw
            .Select(x => new SalesQuotaDto(
                x.BusinessEntityID.ToString(),
                $"{(x.FirstName ?? "")} {(x.LastName ?? "")}".Trim(),
                x.Revenue,
                x.SalesQuota
            ))
            .ToList();

        // Territory heat (SalesPerson x Territory)
        var heat = await baseQ
            .Where(x => x.SalesPersonID != null && x.TerritoryID != null)
            .GroupBy(x => new { x.SalesPersonID, x.TerritoryID })
            .Select(g => new HeatCellDto(
                g.Key.SalesPersonID!.Value.ToString(),
                g.Key.TerritoryID!.Value.ToString(),
                g.Sum(x => (decimal?)(x.LineTotal ?? 0m)) ?? 0m
            ))
            .Take(2000)
            .ToListAsync(ct);

        return new SalesTeamDto(kpis, lbDto, quota, heat);
    }

    public async Task<ShippingDto> GetShippingAsync(DashboardQuery q, CancellationToken ct)
    {
        var baseQ = ApplyFilters(_db.Sales.AsNoTracking(), q);
        var revenue = await baseQ.SumAsync(x => (decimal?)(x.LineTotal ?? 0m), ct) ?? 0m;

        var leadTimeAvg = await baseQ
            .Where(x => x.OrderDate != null && x.ShipDate != null)
            .Select(x => EF.Functions.DateDiffDay(x.OrderDate!.Value, x.ShipDate!.Value))
            .AverageAsync(x => (double?)x, ct);
        var onTimePct = await baseQ
            .Where(x => x.ShipDate != null && x.DueDate != null)
            .Select(x => x.ShipDate!.Value <= x.DueDate!.Value ? 1 : 0)
            .AverageAsync(x => (double?)x, ct);
        var freight = await baseQ.SumAsync(x => (decimal?)(x.Freight ?? 0m), ct) ?? 0m;
        var freightPct = revenue == 0 ? 0m : freight / revenue;

        var kpis = new List<KpiDto>
        {
            new("lead", "Avg Lead Time (days)", (decimal)(leadTimeAvg ?? 0), "days"),
            new("onTime", "On-Time %", (decimal)((onTimePct ?? 0) * 100.0), "%"),
            new("freightPct", "Freight %", freightPct * 100m, "%")
        };

        // Lead time by ship method
        var leadByShip = await baseQ
            .Where(x => x.OrderDate != null && x.ShipDate != null)
            .Join(_db.ShipMethods.AsNoTracking(), s => s.ShipMethodID, sm => sm.ShipMethodID, (s, sm) => new
            {
                ShipMethod = sm.Name ?? "(Unknown)",
                Lead = EF.Functions.DateDiffDay(s.OrderDate!.Value, s.ShipDate!.Value)
            })
            .GroupBy(x => x.ShipMethod)
            .Select(g => new { ShipMethod = g.Key, Lead = g.Average(x => (double)x.Lead) })
            .OrderBy(x => x.Lead)
            .ToListAsync(ct);
        var leadShipDto = leadByShip.Select(x => new BreakdownItemDto(x.ShipMethod, x.ShipMethod, (decimal)x.Lead, null)).ToList();

        // Freight by ship method
        var freightByShip = await baseQ
            .Join(_db.ShipMethods.AsNoTracking(), s => s.ShipMethodID, sm => sm.ShipMethodID, (s, sm) => new
            {
                ShipMethod = sm.Name ?? "(Unknown)",
                Freight = (decimal?)(s.Freight ?? 0m) ?? 0m
            })
            .GroupBy(x => x.ShipMethod)
            .Select(g => new { ShipMethod = g.Key, Freight = g.Sum(x => x.Freight) })
            .OrderByDescending(x => x.Freight)
            .ToListAsync(ct);
        var freightShipTotal = freightByShip.Sum(x => x.Freight);
        var freightShipDto = freightByShip.Select(x => new BreakdownItemDto(x.ShipMethod, x.ShipMethod, x.Freight, freightShipTotal == 0 ? null : x.Freight / freightShipTotal)).ToList();

        // Lead time by territory
        var leadByTerr = await baseQ
            .Where(x => x.OrderDate != null && x.ShipDate != null)
            .Join(_db.Territories.AsNoTracking(), s => s.TerritoryID, t => t.TerritoryID, (s, t) => new
            {
                Territory = t.Name ?? "(Unknown)",
                Lead = EF.Functions.DateDiffDay(s.OrderDate!.Value, s.ShipDate!.Value)
            })
            .GroupBy(x => x.Territory)
            .Select(g => new { Territory = g.Key, Lead = g.Average(x => (double)x.Lead) })
            .OrderByDescending(x => x.Lead)
            .Take(15)
            .ToListAsync(ct);
        var leadTerrDto = leadByTerr.Select(x => new BreakdownItemDto(x.Territory, x.Territory, (decimal)x.Lead, null)).ToList();

        return new ShippingDto(kpis, leadShipDto, freightShipDto, leadTerrDto);
    }

    public async Task<PagedResultDto<DetailRowDto>> GetDetailsAsync(DashboardQuery q, int page, int pageSize, CancellationToken ct)
    {
        if (page < 1) page = 1;
        if (pageSize is < 10 or > 200) pageSize = 50;

        var baseQ = ApplyFilters(_db.Sales.AsNoTracking(), q);
        var total = await baseQ.LongCountAsync(ct);

        var rows = await baseQ
            .OrderByDescending(x => x.OrderDate)
            .ThenByDescending(x => x.SalesOrderDetailID)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Join(_db.Customers.AsNoTracking(), s => s.CustomerID, c => c.CustomerID, (s, c) => new { s, c })
            .Join(_db.Products.AsNoTracking(), x => x.s.ProductID, p => p.ProductID, (x, p) => new { x.s, x.c, p })
            .Join(_db.Territories.AsNoTracking(), x => x.s.TerritoryID, t => t.TerritoryID, (x, t) => new { x.s, x.c, x.p, t })
            .Join(_db.SalesPeople.AsNoTracking(), x => x.s.SalesPersonID, sp => sp.BusinessEntityID, (x, sp) => new { x.s, x.c, x.p, x.t, sp })
            .Join(_db.ShipMethods.AsNoTracking(), x => x.s.ShipMethodID, sm => sm.ShipMethodID, (x, sm) => new DetailRowDto(
                x.s.SalesOrderDetailID,
                x.s.SalesOrderID,
                x.s.OrderDate,
                x.s.ShipDate,
                ((x.c.FirstName ?? "") + " " + (x.c.LastName ?? "")).Trim(),
                x.p.Name,
                x.p.CategoryName,
                x.t.Name,
                x.t.CountryRegionCode,
                ((x.sp.FirstName ?? "") + " " + (x.sp.LastName ?? "")).Trim(),
                sm.Name,
                x.s.OrderQty,
                x.s.UnitPrice,
                x.s.UnitPriceDiscount,
                x.s.LineTotal
            ))
            .ToListAsync(ct);

        return new PagedResultDto<DetailRowDto>(rows, page, pageSize, total);
    }

    private static IQueryable<Entities.Analytics.SalesFact> ApplyFilters(IQueryable<Entities.Analytics.SalesFact> q0, DashboardQuery q)
    {
        var q1 = q0;

        if (q.From != null)
            q1 = q1.Where(x => x.OrderDate != null && x.OrderDate >= q.From);
        if (q.To != null)
            q1 = q1.Where(x => x.OrderDate != null && x.OrderDate < q.To.Value.AddDays(1));

        if (q.TerritoryId != null)
            q1 = q1.Where(x => x.TerritoryID == q.TerritoryId);
        if (q.SalesPersonId != null)
            q1 = q1.Where(x => x.SalesPersonID == q.SalesPersonId);
        if (q.ShipMethodId != null)
            q1 = q1.Where(x => x.ShipMethodID == q.ShipMethodId);
        if (q.Online != null)
            q1 = q1.Where(x => x.OnlineOrderFlag == q.Online);

        if (!string.IsNullOrWhiteSpace(q.CurrencyCode))
        {
            // Currency lives in the dimension; filter via join using FK
            q1 = q1.Where(x => x.Currency != null && x.Currency.CurrencyCode == q.CurrencyCode);
        }
        if (!string.IsNullOrWhiteSpace(q.TerritoryGroup))
        {
            q1 = q1.Where(x => x.Territory != null && x.Territory.Group == q.TerritoryGroup);
        }
        if (!string.IsNullOrWhiteSpace(q.Category))
        {
            q1 = q1.Where(x => x.Product != null && x.Product.CategoryName == q.Category);
        }
        if (!string.IsNullOrWhiteSpace(q.SubCategory))
        {
            q1 = q1.Where(x => x.Product != null && x.Product.SubCategoryName == q.SubCategory);
        }

        return q1;
    }
}
