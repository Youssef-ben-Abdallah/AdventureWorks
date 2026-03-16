using Ecom.Api.Data;
using Ecom.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Repositories;

public class SubCategoryRepository : ISubCategoryRepository
{
    private readonly OltpDbContext _db;
    public SubCategoryRepository(OltpDbContext db) => _db = db;

    public Task<List<SubCategory>> GetAllAsync() =>
        _db.SubCategories.Include(x => x.Category).AsNoTracking()
            .OrderBy(x => x.CategoryId).ThenBy(x => x.Name)
            .ToListAsync();

    public Task<SubCategory?> GetByIdAsync(int id) =>
        _db.SubCategories.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);

    public async Task<SubCategory> AddAsync(SubCategory entity)
    {
        _db.SubCategories.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(SubCategory entity)
    {
        _db.SubCategories.Update(entity);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(SubCategory entity)
    {
        _db.SubCategories.Remove(entity);
        await _db.SaveChangesAsync();
    }
}
