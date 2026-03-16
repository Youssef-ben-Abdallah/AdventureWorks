using Ecom.Api.Data;
using Ecom.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly OltpDbContext _db;
    public CategoryRepository(OltpDbContext db) => _db = db;

    public Task<List<Category>> GetAllAsync() => _db.Categories.AsNoTracking().OrderBy(x => x.Name).ToListAsync();

    public Task<Category?> GetByIdAsync(int id) =>
        _db.Categories.Include(x => x.SubCategories).FirstOrDefaultAsync(x => x.Id == id);

    public async Task<Category> AddAsync(Category entity)
    {
        _db.Categories.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(Category entity)
    {
        _db.Categories.Update(entity);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Category entity)
    {
        _db.Categories.Remove(entity);
        await _db.SaveChangesAsync();
    }
}
