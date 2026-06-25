using Microsoft.AnalysisServices.AdomdClient;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Ecom.Api.Services;

public class OlapService : IOlapService
{
    private readonly string _connectionString;
    private readonly string? _dwConnectionString;
    private Dictionary<string, string>? _employeeNames;
    private Dictionary<string, string>? _promotionNames;
    private Dictionary<string, string>? _currencyNames;

    public OlapService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("SsasConnection")
            ?? throw new ArgumentNullException("SsasConnection not found");
        _dwConnectionString = configuration.GetConnectionString("DwSourceConnection");
    }

    private async Task<AdomdConnection> GetConnectionAsync()
    {
        var conn = new AdomdConnection(_connectionString);
        await Task.Run(() => conn.Open());
        return conn;
    }

    private async Task<Dictionary<string, string>> GetLookupAsync(string sql)
    {
        if (string.IsNullOrEmpty(_dwConnectionString)) return new();
        var dict = new Dictionary<string, string>();
        await using var conn = new SqlConnection(_dwConnectionString);
        await conn.OpenAsync();
        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var key = reader[0]?.ToString();
            var name = reader[1]?.ToString();
            if (key != null && name != null) dict[key] = name;
        }
        return dict;
    }

    private async Task<string> ResolveEmployeeAsync(string? key)
    {
        if (string.IsNullOrEmpty(key)) return "";
        _employeeNames ??= await GetLookupAsync("SELECT CAST(EmployeeKey AS VARCHAR), FirstName + ' ' + LastName FROM DimEmployee");
        return _employeeNames.GetValueOrDefault(key, $"Employee {key}");
    }

    private async Task<string> ResolvePromotionAsync(string? key)
    {
        if (string.IsNullOrEmpty(key)) return "";
        _promotionNames ??= await GetLookupAsync("SELECT CAST(PromotionKey AS VARCHAR), EnglishPromotionName FROM DimPromotion");
        return _promotionNames.GetValueOrDefault(key, $"Promotion {key}");
    }

    private async Task<string> ResolveCurrencyAsync(string? key)
    {
        if (string.IsNullOrEmpty(key)) return "";
        _currencyNames ??= await GetLookupAsync("SELECT CAST(CurrencyKey AS VARCHAR), CurrencyAlternateKey + ' - ' + CurrencyName FROM DimCurrency");
        return _currencyNames.GetValueOrDefault(key, $"Currency {key}");
    }

    public async Task<object> GetFiltersAsync()
    {
        var years = new List<string>();
        string yearMdx = @"SELECT { [Measures].[Sales Amount] } ON COLUMNS, NON EMPTY { [Order Date].[Calendar Year].[Calendar Year].MEMBERS } ON ROWS FROM [Adventure Works DW2019]";
        using (var conn = await GetConnectionAsync())
        using (var yearCmd = new AdomdCommand(yearMdx, conn))
        using (var yearReader = yearCmd.ExecuteReader())
        {
            while (yearReader.Read())
            {
                var year = yearReader[0]?.ToString();
                if (!string.IsNullOrEmpty(year) && year != "All")
                {
                    var cleanedYear = new string(year.Where(char.IsDigit).ToArray());
                    if (!string.IsNullOrEmpty(cleanedYear))
                    {
                        years.Add(cleanedYear);
                    }
                    else
                    {
                        years.Add(year);
                    }
                }
            }
        }
        years.Sort();

        var territories = new List<string>();
        string terrMdx = @"SELECT { [Measures].[Sales Amount] } ON COLUMNS, NON EMPTY { [Dim Sales Territory].[Group].MEMBERS } ON ROWS FROM [Adventure Works DW2019]";
        using (var conn = await GetConnectionAsync())
        using (var terrCmd = new AdomdCommand(terrMdx, conn))
        using (var terrReader = terrCmd.ExecuteReader())
        {
            while (terrReader.Read())
            {
                var terr = terrReader[0]?.ToString();
                if (!string.IsNullOrEmpty(terr) && terr != "All" && terr != "NA")
                {
                    territories.Add(terr);
                }
            }
        }

        var filters = new
        {
            Years = years.Distinct(),
            Territories = territories.Distinct()
        };

        return filters;
    }

    public async Task<object> GetKpisAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH 
            MEMBER [Measures].[Gross Profit Margin] AS 'IIF([Measures].[Sales Amount] = 0, 0, ([Measures].[Sales Amount] - [Measures].[Total Product Cost]) / [Measures].[Sales Amount])'
            MEMBER [Measures].[AOV] AS 'IIF([Measures].[Fact Reseller Sales Count] = 0, 0, [Measures].[Sales Amount] / [Measures].[Fact Reseller Sales Count])'
            MEMBER [Measures].[Discount Ratio] AS 'IIF(([Measures].[Sales Amount] + [Measures].[Discount Amount]) = 0, 0, [Measures].[Discount Amount] / ([Measures].[Sales Amount] + [Measures].[Discount Amount]))'
            MEMBER [Measures].[Effective Tax Rate] AS 'IIF([Measures].[Sales Amount] = 0, 0, [Measures].[Tax Amt] / [Measures].[Sales Amount])'
            SELECT 
            {{ 
                [Measures].[Gross Profit Margin],
                [Measures].[AOV],
                [Measures].[Discount Ratio],
                [Measures].[Effective Tax Rate] 
            }} ON COLUMNS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";

        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            return new
            {
                GrossProfitMargin = reader[0] == DBNull.Value ? 0 : reader[0],
                AOV = reader[1] == DBNull.Value ? 0 : reader[1],
                DiscountRatio = reader[2] == DBNull.Value ? 0 : reader[2],
                EffectiveTaxRate = reader[3] == DBNull.Value ? 0 : reader[3]
            };
        }
        
        return new { };
    }

    public async Task<object> GetProfitAnalysisAsync(string? year, string? territory, string? category = null)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        if (!string.IsNullOrEmpty(category) && category != "All") slicer += $"[Dim Product].[Category].[{category}], ";

        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows = string.IsNullOrEmpty(category) || category == "All" ? 
            "[Dim Product].[Category].MEMBERS" : 
            "[Dim Product].[Subcategory].MEMBERS";

        string mdx = $@"
            WITH 
            MEMBER [Measures].[Gross Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost]'
            MEMBER [Measures].[Net Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost] - [Measures].[Tax Amt] - [Measures].[Freight]'
            SELECT 
            {{ [Measures].[Gross Profit Amt], [Measures].[Net Profit Amt] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            results.Add(new
            {
                Category = reader[0]?.ToString(),
                GrossProfit = reader[1] == DBNull.Value ? 0 : reader[1],
                NetProfit = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetFreightAnalysisAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH MEMBER [Measures].[Freight Cost Per Item] AS 'IIF([Measures].[Order Quantity] = 0, 0, [Measures].[Freight] / [Measures].[Order Quantity])'
            SELECT
            {{ [Measures].[Freight Cost Per Item] }} ON COLUMNS,
            NON EMPTY {{ [Dim Sales Territory].[Country].MEMBERS }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var region = reader[0]?.ToString();
            if (string.IsNullOrEmpty(region) || region == "NA" || region == "Unknown" || region == "Not Applicable") continue;
            
            results.Add(new
            {
                Region = region,
                FreightCost = reader[1] == DBNull.Value ? 0 : reader[1]
            });
        }
        return results;
    }

    public async Task<object> GetTargetStatusAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        bool hasTerritory = !string.IsNullOrEmpty(territory) && territory != "All";

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (hasTerritory) slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows = hasTerritory
            ? "[Dim Sales Territory].[Country].MEMBERS"
            : "[Dim Sales Territory].[Group].MEMBERS";

        string mdx = $@"
            WITH MEMBER [Measures].[Target Amount] AS 5000000
            SELECT
            {{ [Measures].[Sales Amount], [Measures].[Target Amount] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var group = reader[0]?.ToString();
            if (string.IsNullOrEmpty(group) || group == "NA" || group == "Unknown") continue;

            results.Add(new
            {
                Group = group,
                Sales = reader[1] == DBNull.Value ? 0 : reader[1],
                Target = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetSalesTrendAsync(string? year, string? territory, string? month = null)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";

        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        // Month Name has a composite key (CalendarYear, MonthName) so referencing
        // by name alone is ambiguous. Use FILTER on Date members instead.
        string onRows = string.IsNullOrEmpty(month) || month == "All"
            ? "[Order Date].[Month Name].MEMBERS"
            : $"FILTER([Order Date].[Date].MEMBERS, [Order Date].[Month Name].CURRENTMEMBER.MEMBER_CAPTION = \"{month}\")";

        string mdx = $@"
            WITH MEMBER [Measures].[Net Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost] - [Measures].[Tax Amt] - [Measures].[Freight]'
            SELECT
            {{ [Measures].[Sales Amount], [Measures].[Net Profit Amt] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            results.Add(new
            {
                Month = reader[0]?.ToString(),
                Sales = reader[1] == DBNull.Value ? 0 : reader[1],
                Profit = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetTopProductsAsync(string? year, string? territory, string? subcategory = null)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        if (!string.IsNullOrEmpty(subcategory) && subcategory != "All") slicer += $"[Dim Product].[Subcategory].[{subcategory}], ";

        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows = string.IsNullOrEmpty(subcategory) || subcategory == "All" ? 
            "TOPCOUNT(NONEMPTY([Dim Product].[Subcategory].MEMBERS, [Measures].[Sales Amount]), 10, [Measures].[Sales Amount])" : 
            "TOPCOUNT(NONEMPTY([Dim Product].[Product].MEMBERS, [Measures].[Sales Amount]), 10, [Measures].[Sales Amount])";

        string mdx = $@"
            WITH MEMBER [Measures].[Net Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost] - [Measures].[Tax Amt] - [Measures].[Freight]'
            SELECT 
            {{ [Measures].[Sales Amount], [Measures].[Net Profit Amt] }} ON COLUMNS,
            {onRows} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            results.Add(new
            {
                Product = reader[0]?.ToString(),
                Sales = reader[1] == DBNull.Value ? 0 : reader[1],
                Profit = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetTerritorySalesAsync(string? year, string? territoryGroup = null, string? territoryCountry = null)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        
        if (!string.IsNullOrEmpty(territoryCountry) && territoryCountry != "All") {
            slicer += $"[Dim Sales Territory].[Country].[{territoryCountry}], ";
        } else if (!string.IsNullOrEmpty(territoryGroup) && territoryGroup != "All") {
            slicer += $"[Dim Sales Territory].[Group].[{territoryGroup}], ";
        }
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows;
        if (!string.IsNullOrEmpty(territoryCountry) && territoryCountry != "All") {
            onRows = "[Dim Sales Territory].[Region].MEMBERS";
        } else if (!string.IsNullOrEmpty(territoryGroup) && territoryGroup != "All") {
            onRows = "[Dim Sales Territory].[Country].MEMBERS";
        } else {
            onRows = "[Dim Sales Territory].[Group].MEMBERS";
        }

        string mdx = $@"
            SELECT 
            {{ [Measures].[Sales Amount] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            results.Add(new
            {
                Region = reader[0]?.ToString(),
                Sales = reader[1] == DBNull.Value ? 0 : reader[1]
            });
        }
        return results;
    }

    // ── Product Insights ────────────────────────────────────────────

    public async Task<object> GetProductCostAnalysisAsync(string? year, string? territory, string? category = null, string? subcategory = null)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        if (!string.IsNullOrEmpty(subcategory) && subcategory != "All") slicer += $"[Dim Product].[Subcategory].[{subcategory}], ";
        else if (!string.IsNullOrEmpty(category) && category != "All") slicer += $"[Dim Product].[Category].[{category}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows;
        if (!string.IsNullOrEmpty(subcategory) && subcategory != "All")
            onRows = "TOPCOUNT(NONEMPTY([Dim Product].[Product].MEMBERS, [Measures].[Sales Amount]), 10, [Measures].[Sales Amount])";
        else if (!string.IsNullOrEmpty(category) && category != "All")
            onRows = "[Dim Product].[Subcategory].MEMBERS";
        else
            onRows = "[Dim Product].[Category].MEMBERS";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Margin Pct] AS 'IIF([Measures].[Sales Amount] = 0, 0, ([Measures].[Sales Amount] - [Measures].[Product Standard Cost]) / [Measures].[Sales Amount])'
            SELECT
            {{ [Measures].[Sales Amount], [Measures].[Product Standard Cost], [Measures].[Margin Pct] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var name = reader[0]?.ToString();
            if (string.IsNullOrEmpty(name)) continue;
            results.Add(new
            {
                Name = name,
                SalesAmount = reader[1] == DBNull.Value ? 0 : reader[1],
                StandardCost = reader[2] == DBNull.Value ? 0 : reader[2],
                MarginPct = reader[3] == DBNull.Value ? 0 : reader[3]
            });
        }
        return results;
    }

    public async Task<object> GetDiscountByProductAsync(string? year, string? territory, string? category = null)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        if (!string.IsNullOrEmpty(category) && category != "All") slicer += $"[Dim Product].[Category].[{category}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows = string.IsNullOrEmpty(category) || category == "All"
            ? "[Dim Product].[Category].MEMBERS"
            : "[Dim Product].[Subcategory].MEMBERS";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Discount Pct] AS 'IIF([Measures].[Extended Amount] = 0, 0, [Measures].[Discount Amount] / [Measures].[Extended Amount])'
            SELECT
            {{ [Measures].[Discount Amount], [Measures].[Discount Pct] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var name = reader[0]?.ToString();
            if (string.IsNullOrEmpty(name)) continue;
            results.Add(new
            {
                Name = name,
                DiscountAmount = reader[1] == DBNull.Value ? 0 : reader[1],
                DiscountPct = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetOrderVolumeByProductAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            SELECT
            {{ [Measures].[Order Quantity] }} ON COLUMNS,
            NON EMPTY {{ [Dim Product].[Category].MEMBERS }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var name = reader[0]?.ToString();
            if (string.IsNullOrEmpty(name)) continue;
            results.Add(new
            {
                Name = name,
                Quantity = reader[1] == DBNull.Value ? 0 : reader[1]
            });
        }
        return results;
    }

    public async Task<object> GetPriceGapAnalysisAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            SELECT
            {{ [Measures].[Extended Amount], [Measures].[Sales Amount] }} ON COLUMNS,
            NON EMPTY {{ [Dim Product].[Category].MEMBERS }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var name = reader[0]?.ToString();
            if (string.IsNullOrEmpty(name)) continue;
            results.Add(new
            {
                Name = name,
                ExtendedAmount = reader[1] == DBNull.Value ? 0 : reader[1],
                SalesAmount = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    // ── Territory Map Detail ────────────────────────────────────────

    public async Task<object> GetTerritoryDetailAsync(string? year, string? territoryGroup = null, string? territoryCountry = null)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territoryCountry) && territoryCountry != "All")
            slicer += $"[Dim Sales Territory].[Country].[{territoryCountry}], ";
        else if (!string.IsNullOrEmpty(territoryGroup) && territoryGroup != "All")
            slicer += $"[Dim Sales Territory].[Group].[{territoryGroup}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows;
        if (!string.IsNullOrEmpty(territoryCountry) && territoryCountry != "All")
            onRows = "[Dim Sales Territory].[Region].MEMBERS";
        else if (!string.IsNullOrEmpty(territoryGroup) && territoryGroup != "All")
            onRows = "[Dim Sales Territory].[Country].MEMBERS";
        else
            onRows = "[Dim Sales Territory].[Group].MEMBERS";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Net Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost] - [Measures].[Tax Amt] - [Measures].[Freight]'
            MEMBER [Measures].[Margin Pct] AS 'IIF([Measures].[Sales Amount] = 0, 0, [Measures].[Net Profit Amt] / [Measures].[Sales Amount])'
            SELECT
            {{ [Measures].[Sales Amount], [Measures].[Net Profit Amt], [Measures].[Order Quantity], [Measures].[Freight], [Measures].[Margin Pct] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var name = reader[0]?.ToString();
            if (string.IsNullOrEmpty(name) || name == "NA" || name == "Unknown") continue;
            results.Add(new
            {
                Region = name,
                Sales = reader[1] == DBNull.Value ? 0 : reader[1],
                Profit = reader[2] == DBNull.Value ? 0 : reader[2],
                OrderQty = reader[3] == DBNull.Value ? 0 : reader[3],
                Freight = reader[4] == DBNull.Value ? 0 : reader[4],
                MarginPct = reader[5] == DBNull.Value ? 0 : reader[5]
            });
        }
        return results;
    }

    // ── Employee Performance ────────────────────────────────────────

    public async Task<object> GetEmployeeKpisAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Active Employees] AS 'COUNT(NONEMPTY([Dim Employee].[Employee Key].MEMBERS, [Measures].[Sales Amount]))'
            MEMBER [Measures].[Avg Revenue Per Employee] AS 'IIF([Measures].[Active Employees] = 0, 0, [Measures].[Sales Amount] / [Measures].[Active Employees])'
            MEMBER [Measures].[Top Employee Revenue] AS 'MAX(NONEMPTY([Dim Employee].[Employee Key].MEMBERS, [Measures].[Sales Amount]), [Measures].[Sales Amount])'
            SELECT
            {{ [Measures].[Active Employees], [Measures].[Avg Revenue Per Employee], [Measures].[Top Employee Revenue], [Measures].[Sales Amount] }} ON COLUMNS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            return new
            {
                ActiveEmployees = reader[0] == DBNull.Value ? 0 : reader[0],
                AvgRevenuePerEmployee = reader[1] == DBNull.Value ? 0 : reader[1],
                TopEmployeeRevenue = reader[2] == DBNull.Value ? 0 : reader[2],
                TotalRevenue = reader[3] == DBNull.Value ? 0 : reader[3]
            };
        }
        return new { ActiveEmployees = 0, AvgRevenuePerEmployee = 0, TopEmployeeRevenue = 0, TotalRevenue = 0 };
    }

    public async Task<object> GetTopEmployeesAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Net Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost] - [Measures].[Tax Amt] - [Measures].[Freight]'
            SELECT
            {{ [Measures].[Sales Amount], [Measures].[Net Profit Amt] }} ON COLUMNS,
            TOPCOUNT(NONEMPTY([Dim Employee].[Employee Key].MEMBERS, [Measures].[Sales Amount]), 10, [Measures].[Sales Amount]) ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var emp = reader[0]?.ToString();
            if (string.IsNullOrEmpty(emp)) continue;
            results.Add(new
            {
                Employee = await ResolveEmployeeAsync(emp),
                Sales = reader[1] == DBNull.Value ? 0 : reader[1],
                Profit = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetEmployeeSalesByTerritoryAsync(string? year, string? territoryGroup = null)
    {
        using var conn = await GetConnectionAsync();

        bool hasGroup = !string.IsNullOrEmpty(territoryGroup) && territoryGroup != "All";

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (hasGroup) slicer += $"[Dim Sales Territory].[Group].[{territoryGroup}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows = hasGroup
            ? "[Dim Sales Territory].[Country].MEMBERS"
            : "[Dim Sales Territory].[Group].MEMBERS";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Employee Count] AS 'COUNT(NONEMPTY([Dim Employee].[Employee Key].MEMBERS, [Measures].[Sales Amount]))'
            SELECT
            {{ [Measures].[Sales Amount], [Measures].[Employee Count] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var name = reader[0]?.ToString();
            if (string.IsNullOrEmpty(name) || name == "NA" || name == "Unknown") continue;
            results.Add(new
            {
                Territory = name,
                Sales = reader[1] == DBNull.Value ? 0 : reader[1],
                EmployeeCount = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetEmployeeAovAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Employee AOV] AS 'IIF([Measures].[Fact Reseller Sales Count] = 0, 0, [Measures].[Sales Amount] / [Measures].[Fact Reseller Sales Count])'
            SELECT
            {{ [Measures].[Employee AOV], [Measures].[Fact Reseller Sales Count] }} ON COLUMNS,
            TOPCOUNT(NONEMPTY([Dim Employee].[Employee Key].MEMBERS, [Measures].[Sales Amount]), 10, [Measures].[Sales Amount] / [Measures].[Fact Reseller Sales Count]) ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var emp = reader[0]?.ToString();
            if (string.IsNullOrEmpty(emp)) continue;
            results.Add(new
            {
                Employee = await ResolveEmployeeAsync(emp),
                Aov = reader[1] == DBNull.Value ? 0 : reader[1],
                OrderCount = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    // ── Promotions & Discounts ──────────────────────────────────────

    public async Task<object> GetPromotionKpisAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Discount Revenue Ratio] AS 'IIF([Measures].[Sales Amount] = 0, 0, [Measures].[Discount Amount] / [Measures].[Sales Amount])'
            MEMBER [Measures].[Avg Discount Per Order] AS 'IIF([Measures].[Fact Reseller Sales Count] = 0, 0, [Measures].[Discount Amount] / [Measures].[Fact Reseller Sales Count])'
            SELECT
            {{ [Measures].[Discount Amount], [Measures].[Discount Revenue Ratio], [Measures].[Avg Discount Per Order], [Measures].[Fact Reseller Sales Count] }} ON COLUMNS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            return new
            {
                TotalDiscount = reader[0] == DBNull.Value ? 0 : reader[0],
                DiscountRevenueRatio = reader[1] == DBNull.Value ? 0 : reader[1],
                AvgDiscountPerOrder = reader[2] == DBNull.Value ? 0 : reader[2],
                TotalOrders = reader[3] == DBNull.Value ? 0 : reader[3]
            };
        }
        return new { TotalDiscount = 0, DiscountRevenueRatio = 0, AvgDiscountPerOrder = 0, TotalOrders = 0 };
    }

    public async Task<object> GetSalesByPromotionAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            SELECT
            {{ [Measures].[Sales Amount], [Measures].[Discount Amount] }} ON COLUMNS,
            NON EMPTY {{ [Dim Promotion].[Promotion Key].MEMBERS }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var key = reader[0]?.ToString();
            if (string.IsNullOrEmpty(key)) continue;
            results.Add(new
            {
                Promotion = await ResolvePromotionAsync(key),
                Sales = reader[1] == DBNull.Value ? 0 : reader[1],
                Discount = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetDiscountTrendAsync(string? year, string? territory, string? month = null)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows = string.IsNullOrEmpty(month) || month == "All"
            ? "[Order Date].[Month Name].MEMBERS"
            : $"FILTER([Order Date].[Date].MEMBERS, [Order Date].[Month Name].CURRENTMEMBER.MEMBER_CAPTION = \"{month}\")";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Discount Ratio] AS 'IIF([Measures].[Sales Amount] = 0, 0, [Measures].[Discount Amount] / [Measures].[Sales Amount])'
            SELECT
            {{ [Measures].[Discount Amount], [Measures].[Discount Ratio] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            results.Add(new
            {
                Month = reader[0]?.ToString(),
                DiscountAmount = reader[1] == DBNull.Value ? 0 : reader[1],
                DiscountRatio = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetSalesByCurrencyAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            SELECT
            {{ [Measures].[Sales Amount] }} ON COLUMNS,
            NON EMPTY {{ [Dim Currency].[Currency Key].MEMBERS }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var key = reader[0]?.ToString();
            if (string.IsNullOrEmpty(key)) continue;
            results.Add(new
            {
                Currency = await ResolveCurrencyAsync(key),
                Sales = reader[1] == DBNull.Value ? 0 : reader[1]
            });
        }
        return results;
    }

    // ── Order Fulfillment ───────────────────────────────────────────

    public async Task<object> GetFulfillmentKpisAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Freight Revenue Ratio] AS 'IIF([Measures].[Sales Amount] = 0, 0, [Measures].[Freight] / [Measures].[Sales Amount])'
            MEMBER [Measures].[Freight Per Unit] AS 'IIF([Measures].[Order Quantity] = 0, 0, [Measures].[Freight] / [Measures].[Order Quantity])'
            SELECT
            {{ [Measures].[Freight], [Measures].[Freight Revenue Ratio], [Measures].[Freight Per Unit], [Measures].[Fact Reseller Sales Count] }} ON COLUMNS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            return new
            {
                TotalFreight = reader[0] == DBNull.Value ? 0 : reader[0],
                FreightRevenueRatio = reader[1] == DBNull.Value ? 0 : reader[1],
                FreightPerUnit = reader[2] == DBNull.Value ? 0 : reader[2],
                TotalOrders = reader[3] == DBNull.Value ? 0 : reader[3]
            };
        }
        return new { TotalFreight = 0, FreightRevenueRatio = 0, FreightPerUnit = 0, TotalOrders = 0 };
    }

    public async Task<object> GetShippingVolumeAsync(string? year, string? territory, string? month = null)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Ship Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows = string.IsNullOrEmpty(month) || month == "All"
            ? "[Ship Date].[Month Name].MEMBERS"
            : $"FILTER([Ship Date].[Date].MEMBERS, [Ship Date].[Month Name].CURRENTMEMBER.MEMBER_CAPTION = \"{month}\")";

        string mdx = $@"
            SELECT
            {{ [Measures].[Order Quantity], [Measures].[Freight] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            results.Add(new
            {
                Month = reader[0]?.ToString(),
                Quantity = reader[1] == DBNull.Value ? 0 : reader[1],
                Freight = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetFreightByTerritoryAsync(string? year, string? territoryGroup = null, string? territoryCountry = null)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territoryCountry) && territoryCountry != "All")
            slicer += $"[Dim Sales Territory].[Country].[{territoryCountry}], ";
        else if (!string.IsNullOrEmpty(territoryGroup) && territoryGroup != "All")
            slicer += $"[Dim Sales Territory].[Group].[{territoryGroup}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string onRows;
        if (!string.IsNullOrEmpty(territoryCountry) && territoryCountry != "All")
            onRows = "[Dim Sales Territory].[Region].MEMBERS";
        else if (!string.IsNullOrEmpty(territoryGroup) && territoryGroup != "All")
            onRows = "[Dim Sales Territory].[Country].MEMBERS";
        else
            onRows = "[Dim Sales Territory].[Group].MEMBERS";

        string mdx = $@"
            WITH
            MEMBER [Measures].[Freight Per Unit] AS 'IIF([Measures].[Order Quantity] = 0, 0, [Measures].[Freight] / [Measures].[Order Quantity])'
            SELECT
            {{ [Measures].[Freight], [Measures].[Freight Per Unit] }} ON COLUMNS,
            NON EMPTY {{ {onRows} }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        using var cmd = new AdomdCommand(mdx, conn);
        using var reader = cmd.ExecuteReader();
        var results = new List<object>();
        while (reader.Read())
        {
            var name = reader[0]?.ToString();
            if (string.IsNullOrEmpty(name) || name == "NA" || name == "Unknown") continue;
            results.Add(new
            {
                Region = name,
                Freight = reader[1] == DBNull.Value ? 0 : reader[1],
                FreightPerUnit = reader[2] == DBNull.Value ? 0 : reader[2]
            });
        }
        return results;
    }

    public async Task<object> GetOrderShipLagAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();

        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string slicerShip = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicerShip += $"[Ship Date].[Calendar Year].[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicerShip += $"[Dim Sales Territory].[Group].[{territory}], ";
        string whereShip = slicerShip != "" ? "WHERE (" + slicerShip.TrimEnd(',', ' ') + ")" : "";

        string mdxOrdered = $@"
            SELECT
            {{ [Measures].[Fact Reseller Sales Count] }} ON COLUMNS,
            NON EMPTY {{ [Order Date].[Calendar Quarter].MEMBERS }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereClause}
        ";
        string mdxShipped = $@"
            SELECT
            {{ [Measures].[Fact Reseller Sales Count] }} ON COLUMNS,
            NON EMPTY {{ [Ship Date].[Calendar Quarter].MEMBERS }} ON ROWS
            FROM [Adventure Works DW2019]
            {whereShip}
        ";

        var ordered = new Dictionary<string, object>();
        using (var cmd1 = new AdomdCommand(mdxOrdered, conn))
        using (var r1 = cmd1.ExecuteReader())
        {
            while (r1.Read())
            {
                var q = r1[0]?.ToString();
                if (!string.IsNullOrEmpty(q)) ordered[q] = r1[1] == DBNull.Value ? 0 : r1[1];
            }
        }

        var shipped = new Dictionary<string, object>();
        using (var conn2 = await GetConnectionAsync())
        using (var cmd2 = new AdomdCommand(mdxShipped, conn2))
        using (var r2 = cmd2.ExecuteReader())
        {
            while (r2.Read())
            {
                var q = r2[0]?.ToString();
                if (!string.IsNullOrEmpty(q)) shipped[q] = r2[1] == DBNull.Value ? 0 : r2[1];
            }
        }

        var allQuarters = ordered.Keys.Union(shipped.Keys).OrderBy(q => q).ToList();
        var results = allQuarters.Select(q => new
        {
            Quarter = q,
            OrdersPlaced = ordered.GetValueOrDefault(q, 0),
            OrdersShipped = shipped.GetValueOrDefault(q, 0)
        }).ToList();

        return results;
    }
}
