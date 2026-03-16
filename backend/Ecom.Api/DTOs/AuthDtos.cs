namespace Ecom.Api.DTOs;

public record RegisterDto(string Username, string Email, string Password);
public record LoginDto(string Username, string Password);

public record AuthResponseDto(
    string Token,
    DateTime ExpiresAtUtc,
    string Username,
    string Email,
    string[] Roles
);
