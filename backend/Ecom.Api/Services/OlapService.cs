using Microsoft.AnalysisServices.AdomdClient;
using Microsoft.Extensions.Configuration;

namespace Ecom.Api.Services;

public class OlapService : IOlapService
{
    private readonly string _connectionString;

    public OlapService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("SsasConnection") 
            ?? throw new ArgumentNullException("SsasConnection not found");
    }

    private async Task<AdomdConnection> GetConnectionAsync()
    {
        var conn = new AdomdConnection(_connectionString);
        await Task.Run(() => conn.Open()); // AdomdClient doesn't have true async Open
        return conn;
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

        var territories = new List<string> { "All" };
        string terrMdx = @"SELECT { [Measures].[Sales Amount] } ON COLUMNS, NON EMPTY { [Dim Sales Territory].[Sales Territory Group].[Sales Territory Group].MEMBERS } ON ROWS FROM [Adventure Works DW2019]";
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
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].&[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Sales Territory Group].&[{territory}], ";
        
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

    public async Task<object> GetProfitAnalysisAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].&[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Sales Territory Group].&[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH 
            MEMBER [Measures].[Gross Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost]'
            MEMBER [Measures].[Net Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost] - [Measures].[Tax Amt] - [Measures].[Freight]'
            SELECT 
            {{ [Measures].[Gross Profit Amt], [Measures].[Net Profit Amt] }} ON COLUMNS,
            NON EMPTY {{ [Dim Product].[Product Category Key].MEMBERS }} ON ROWS
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
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].&[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Sales Territory Group].&[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH MEMBER [Measures].[Freight Cost Per Item] AS 'IIF([Measures].[Order Quantity] = 0, 0, [Measures].[Freight] / [Measures].[Order Quantity])'
            SELECT 
            {{ [Measures].[Freight Cost Per Item] }} ON COLUMNS,
            NON EMPTY {{ [Dim Sales Territory].[Sales Territory Region].MEMBERS }} ON ROWS
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
                FreightCost = reader[1] == DBNull.Value ? 0 : reader[1]
            });
        }
        return results;
    }

    public async Task<object> GetTargetStatusAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].&[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Sales Territory Group].&[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH MEMBER [Measures].[Target Status] AS 'IIf([Measures].[Sales Amount] > 5000000, ""Met"", ""Not Met"")'
            SELECT 
            {{ [Measures].[Target Status] }} ON COLUMNS,
            NON EMPTY {{ [Dim Sales Territory].[Sales Territory Group].MEMBERS }} ON ROWS
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
                Group = reader[0]?.ToString(),
                Status = reader[1]?.ToString()
            });
        }
        return results;
    }

    public async Task<object> GetSalesTrendAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].&[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Sales Territory Group].&[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH MEMBER [Measures].[Net Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost] - [Measures].[Tax Amt] - [Measures].[Freight]'
            SELECT 
            {{ [Measures].[Sales Amount], [Measures].[Net Profit Amt] }} ON COLUMNS,
            NON EMPTY {{ [Order Date].[English Month Name].[English Month Name].MEMBERS }} ON ROWS
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

    public async Task<object> GetTopProductsAsync(string? year, string? territory)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].&[{year}], ";
        if (!string.IsNullOrEmpty(territory) && territory != "All") slicer += $"[Dim Sales Territory].[Sales Territory Group].&[{territory}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            WITH MEMBER [Measures].[Net Profit Amt] AS '[Measures].[Sales Amount] - [Measures].[Total Product Cost] - [Measures].[Tax Amt] - [Measures].[Freight]'
            SELECT 
            {{ [Measures].[Sales Amount], [Measures].[Net Profit Amt] }} ON COLUMNS,
            TOPCOUNT(NONEMPTY([Dim Product].[Product Key].[Product Key].MEMBERS, [Measures].[Sales Amount]), 10, [Measures].[Sales Amount]) ON ROWS
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

    public async Task<object> GetTerritorySalesAsync(string? year)
    {
        using var conn = await GetConnectionAsync();
        
        string slicer = "";
        if (!string.IsNullOrEmpty(year) && year != "All") slicer += $"[Order Date].[Calendar Year].&[{year}], ";
        string whereClause = slicer != "" ? "WHERE (" + slicer.TrimEnd(',', ' ') + ")" : "";

        string mdx = $@"
            SELECT 
            {{ [Measures].[Sales Amount] }} ON COLUMNS,
            NON EMPTY {{ [Dim Sales Territory].[Sales Territory Region].MEMBERS }} ON ROWS
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
}
