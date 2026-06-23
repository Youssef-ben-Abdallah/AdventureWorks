using Ecom.Api.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Data;

public class OltpDbContext : IdentityDbContext<AppUser>
{
    public OltpDbContext(DbContextOptions<OltpDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<SubCategory> SubCategories => Set<SubCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Category>()
            .HasIndex(x => x.Name)
            .IsUnique();

        b.Entity<SubCategory>()
            .HasIndex(x => new { x.CategoryId, x.Name })
            .IsUnique();

        b.Entity<Product>()
            .HasIndex(x => x.Sku)
            .IsUnique();

        b.Entity<Product>()
            .Property(x => x.Price)
            .HasPrecision(18, 2);

        b.Entity<Order>()
            .Property(x => x.Total)
            .HasPrecision(18, 2);

        b.Entity<OrderItem>()
            .Property(x => x.UnitPrice)
            .HasPrecision(18, 2);

        b.Entity<SubCategory>()
            .HasOne(x => x.Category)
            .WithMany(x => x.SubCategories)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Product>()
            .HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Product>()
            .HasOne(x => x.SubCategory)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.SubCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Order>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<OrderItem>()
            .HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Category>().ToTable("Categories", t => t.ExcludeFromMigrations());
        b.Entity<SubCategory>().ToTable("SubCategories", t => t.ExcludeFromMigrations());
        b.Entity<Product>().ToTable("Products", t => {
            t.ExcludeFromMigrations();
            t.HasTrigger("TR_Products_Insert");
            t.HasTrigger("TR_Products_Update");
        });

        b.Entity<Order>().ToTable("SalesOrderHeader", "Sales", t => {
            t.ExcludeFromMigrations();
            t.HasTrigger("uSalesOrderHeader");
        });
        b.Entity<Order>().Property(o => o.Id).HasColumnName("SalesOrderID");
        b.Entity<Order>().Property(o => o.CreatedAtUtc).HasColumnName("OrderDate");
        b.Entity<Order>().Property(o => o.Total).HasColumnName("SubTotal");
        b.Entity<Order>().Property(o => o.UserId).HasColumnName("Comment");
        b.Entity<Order>().Property(o => o.Status).HasColumnType("tinyint");

        b.Entity<OrderItem>().ToTable("SalesOrderDetail", "Sales", t => {
            t.ExcludeFromMigrations();
            t.HasTrigger("iduSalesOrderDetail");
        });
        b.Entity<OrderItem>().Property(o => o.Id).HasColumnName("SalesOrderDetailID");
        b.Entity<OrderItem>().Property(o => o.OrderId).HasColumnName("SalesOrderID");
        b.Entity<OrderItem>().Property(o => o.Qty).HasColumnName("OrderQty").HasColumnType("smallint");
        b.Entity<OrderItem>().Ignore(o => o.LineTotal);

        b.Entity<OrderItem>()
            .HasOne(x => x.Order)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
