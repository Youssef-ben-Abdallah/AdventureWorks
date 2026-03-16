using Ecom.Api.Entities;

namespace Ecom.Api.Repositories;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product> AddAsync(Product entity);
    Task UpdateAsync(Product entity);
    Task DeleteAsync(Product entity);
    Task<bool> ExistsBySkuAsync(string sku, int? exceptId = null);
}
