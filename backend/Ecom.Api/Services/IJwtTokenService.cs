using Ecom.Api.Entities;

namespace Ecom.Api.Services;

public interface IJwtTokenService
{
    Task<(string token, DateTime expiresAtUtc, string[] roles)> CreateTokenAsync(AppUser user);
}
