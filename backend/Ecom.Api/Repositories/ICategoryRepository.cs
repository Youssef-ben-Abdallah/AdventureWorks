using Ecom.Api.Entities;

namespace Ecom.Api.Repositories;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(int id);
    Task<Category> AddAsync(Category entity);
    Task UpdateAsync(Category entity);
    Task DeleteAsync(Category entity);
}
