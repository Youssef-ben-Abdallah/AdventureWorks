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
        _db.Products.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(Product entity)
    {
        _db.Products.Update(entity);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Product entity)
    {
        _db.Products.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public Task<bool> ExistsBySkuAsync(string sku, int? exceptId = null) =>
        _db.Products.AnyAsync(p => p.Sku == sku && (!exceptId.HasValue || p.Id != exceptId.Value));
}
