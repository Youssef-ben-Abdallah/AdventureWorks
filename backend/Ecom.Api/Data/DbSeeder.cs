using Ecom.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration config, ILogger logger)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;

        var db = sp.GetRequiredService<OltpDbContext>();
        // Migrations are disabled, schema is managed externally
        // await db.Database.MigrateAsync();

        // -------------------------
        // Roles + Admin user
        // -------------------------
        var roleMgr = sp.GetRequiredService<RoleManager<IdentityRole>>();
        var userMgr = sp.GetRequiredService<UserManager<AppUser>>();

        foreach (var role in new[] { "Admin", "User" })
            if (!await roleMgr.RoleExistsAsync(role))
                await roleMgr.CreateAsync(new IdentityRole(role));

        var adminCfg = config.GetSection("SeedAdmin");
        var username = adminCfg["Username"] ?? "admin";
        var email = adminCfg["Email"] ?? "admin@demo.com";
        var password = adminCfg["Password"] ?? "Admin123!";

        var admin = await userMgr.FindByNameAsync(username);
        if (admin == null)
        {
            admin = new AppUser { UserName = username, Email = email, EmailConfirmed = true };
            var res = await userMgr.CreateAsync(admin, password);
            if (!res.Succeeded)
            {
                logger.LogWarning("Admin seed failed: {Errors}", string.Join(", ", res.Errors.Select(e => e.Description)));
                admin = null;
            }
            else
            {
                await userMgr.AddToRoleAsync(admin, "Admin");
            }
        }
        else
        {
            // Ensure role
            if (!await userMgr.IsInRoleAsync(admin, "Admin"))
                await userMgr.AddToRoleAsync(admin, "Admin");
        }

        // Catalog seed skipped because we are using AdventureWorks2019 views directly
        logger.LogInformation("✅ Seed finished.");
    }
}