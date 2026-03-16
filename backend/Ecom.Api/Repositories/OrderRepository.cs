using Ecom.Api.Data;
using Ecom.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly OltpDbContext _db;
    public OrderRepository(OltpDbContext db) => _db = db;

    public Task<List<Order>> GetMyOrdersAsync(string userId) =>
        _db.Orders
          .Include(o => o.Items).ThenInclude(i => i.Product)
          .Include(o => o.User)
          .AsNoTracking()
          .Where(o => o.UserId == userId)
          .OrderByDescending(o => o.CreatedAtUtc)
          .ToListAsync();

    public Task<List<Order>> GetAllOrdersAsync() =>
        _db.Orders
          .Include(o => o.Items).ThenInclude(i => i.Product)
          .Include(o => o.User)
          .AsNoTracking()
          .OrderByDescending(o => o.CreatedAtUtc)
          .ToListAsync();

    public Task<Order?> GetByIdAsync(int id) =>
        _db.Orders
          .Include(o => o.Items).ThenInclude(i => i.Product)
          .Include(o => o.User)
          .FirstOrDefaultAsync(o => o.Id == id);

    public async Task<Order> AddAsync(Order entity)
    {
        _db.Orders.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(Order entity)
    {
        _db.Orders.Update(entity);
        await _db.SaveChangesAsync();
    }
}
