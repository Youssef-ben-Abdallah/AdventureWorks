using Ecom.Api.Data;
using Ecom.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly OltpDbContext _db;
    public ProductRepository(OltpDbContext db) => _db = db;

    public Task<List<Product>> GetAllAsync() =>
        _db.Products
            .Include(x => x.Category)
            .Include(x => x.SubCategory)
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync();

    public Task<Product?> GetByIdAsync(int id) =>
        _db.Products
            .Include(x => x.Category)
            .Include(x => x.SubCategory)
            .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<Product> AddAsync(Product entity)
    {
        // Use raw SQL to bypass EF Core's implicit transaction and @@ROWCOUNT checking which fails 
        // due to the INSTEAD OF INSERT trigger on the Products view.
        await _db.Database.ExecuteSqlRawAsync(
            "INSERT INTO Products (CategoryId, Description, ImageFileName, Name, Price, Sku, StockQty, SubCategoryId) " +
            "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7})",
            entity.CategoryId, entity.Description, entity.ImageFileName, entity.Name, entity.Price, entity.Sku, entity.StockQty, entity.SubCategoryId);

        var inserted = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Sku == entity.Sku);
        if (inserted != null)
        {
            entity.Id = inserted.Id;
        }
        return entity;
    }

    public async Task UpdateAsync(Product entity)
    {
        // Use raw SQL to bypass EF Core's implicit transaction and @@ROWCOUNT checking which fails 
        // due to the INSTEAD OF UPDATE trigger on the Products view.
        await _db.Database.ExecuteSqlRawAsync(
            "UPDATE Products SET CategoryId = {0}, Description = {1}, ImageFileName = {2}, Name = {3}, Price = {4}, Sku = {5}, StockQty = {6}, SubCategoryId = {7} WHERE Id = {8}",
            entity.CategoryId, entity.Description, entity.ImageFileName, entity.Name, entity.Price, entity.Sku, entity.StockQty, entity.SubCategoryId, entity.Id);
    }

    public async Task DeleteAsync(Product entity)
    {
        _db.Products.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public Task<bool> ExistsBySkuAsync(string sku, int? exceptId = null) =>
        _db.Products.AnyAsync(p => p.Sku == sku && (!exceptId.HasValue || p.Id != exceptId.Value));
}
