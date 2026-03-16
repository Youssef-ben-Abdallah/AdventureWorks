using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Ecom.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace Ecom.Api.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _cfg;
    private readonly UserManager<AppUser> _userManager;

    public JwtTokenService(IConfiguration cfg, UserManager<AppUser> userManager)
    {
        _cfg = cfg;
        _userManager = userManager;
    }

    public async Task<(string token, DateTime expiresAtUtc, string[] roles)> CreateTokenAsync(AppUser user)
    {
        var jwt = _cfg.GetSection("Jwt");
        var key = jwt["Key"]!;
        var issuer = jwt["Issuer"]!;
        var audience = jwt["Audience"]!;
        var expiresMinutes = int.TryParse(jwt["ExpiresMinutes"], out var m) ? m : 120;

        var roles = (await _userManager.GetRolesAsync(user)).ToArray();

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),                  
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? ""),  

            // JWT standard claims (optional but fine)
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.UniqueName, user.UserName ?? ""),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),

            // Your custom claims (optional)
            new("uid", user.Id),
            new("uname", user.UserName ?? "")
        };

        // Roles
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddMinutes(expiresMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expires, roles);
    }
}