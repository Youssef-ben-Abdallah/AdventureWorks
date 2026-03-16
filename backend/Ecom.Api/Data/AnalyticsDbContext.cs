using Ecom.Api.Entities.Analytics;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Data;

/// <summary>
/// Read-only analytics context over the schema defined in script.sql
/// (AdventureWorksDW_Sales database).
///
/// We keep this separate from the OLTP context to avoid changing existing
/// entity mappings and migrations.
/// </summary>
public class AnalyticsDbContext : DbContext
{
    public AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : base(options) { }

    public DbSet<SalesFact> Sales => Set<SalesFact>();
    public DbSet<CustomerDim> Customers => Set<CustomerDim>();
    public DbSet<ProductDim> Products => Set<ProductDim>();
    public DbSet<CurrencyDim> Currencies => Set<CurrencyDim>();
    public DbSet<SalesPersonDim> SalesPeople => Set<SalesPersonDim>();
    public DbSet<ShipMethodDim> ShipMethods => Set<ShipMethodDim>();
    public DbSet<TerritoryDim> Territories => Set<TerritoryDim>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Facts
        modelBuilder.Entity<SalesFact>(e =>
        {
            e.ToTable("Sales", "dbo");
            e.HasKey(x => x.SalesOrderDetailID);
            e.Property(x => x.LineTotal).HasColumnType("numeric(38,6)");

            // Optional relationships (FKs allow NULLs)
            e.HasOne(x => x.Customer).WithMany().HasForeignKey(x => x.CustomerID);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductID);
            e.HasOne(x => x.Currency).WithMany().HasForeignKey(x => x.CurrencyRateID);
            e.HasOne(x => x.SalesPerson).WithMany().HasForeignKey(x => x.SalesPersonID);
            e.HasOne(x => x.ShipMethod).WithMany().HasForeignKey(x => x.ShipMethodID);
            e.HasOne(x => x.Territory).WithMany().HasForeignKey(x => x.TerritoryID);
        });

        // Dimensions
        modelBuilder.Entity<CustomerDim>().ToTable("Customer", "dbo");
        modelBuilder.Entity<ProductDim>().ToTable("Products", "dbo");
        modelBuilder.Entity<CurrencyDim>().ToTable("Currency", "dbo");
        modelBuilder.Entity<SalesPersonDim>().ToTable("SalesPerson", "dbo");
        modelBuilder.Entity<ShipMethodDim>().ToTable("ShipMethod", "dbo");
        modelBuilder.Entity<TerritoryDim>().ToTable("Territory", "dbo");
    }
}
