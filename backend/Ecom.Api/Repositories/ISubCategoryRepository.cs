using Ecom.Api.Entities;

namespace Ecom.Api.Repositories;

public interface ISubCategoryRepository
{
    Task<List<SubCategory>> GetAllAsync();
    Task<SubCategory?> GetByIdAsync(int id);
    Task<SubCategory> AddAsync(SubCategory entity);
    Task UpdateAsync(SubCategory entity);
    Task DeleteAsync(SubCategory entity);
}
