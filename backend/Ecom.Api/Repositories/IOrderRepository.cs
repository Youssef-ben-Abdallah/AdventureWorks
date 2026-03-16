using Ecom.Api.Entities;

namespace Ecom.Api.Repositories;

public interface IOrderRepository
{
    Task<List<Order>> GetMyOrdersAsync(string userId);
    Task<List<Order>> GetAllOrdersAsync();
    Task<Order?> GetByIdAsync(int id);
    Task<Order> AddAsync(Order entity);
    Task UpdateAsync(Order entity);
}
