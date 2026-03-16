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
        await db.Database.MigrateAsync();

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

        // -------------------------
        // Catalog seed (BIKES)
        // -------------------------
        if (!await db.Categories.AnyAsync())
        {
            var helmet = new Category { Name = "helmet" };
            var lights = new Category { Name = "lights" };
            var parts = new Category { Name = "Parts" };

            db.Categories.AddRange(helmet, lights, parts);
            await db.SaveChangesAsync();

            var road = new SubCategory { Name = "Road helmet", CategoryId = helmet.Id };
            var mtb = new SubCategory { Name = "Mountain helmet", CategoryId = helmet.Id };
            var ebike = new SubCategory { Name = "E-helmet", CategoryId = helmet.Id };
            var helmets = new SubCategory { Name = "double Lights", CategoryId = lights.Id };
            var light = new SubCategory { Name = "Lights", CategoryId = lights.Id };
            var drivetrain = new SubCategory { Name = "Chainset", CategoryId = parts.Id };

            db.SubCategories.AddRange(road, mtb, ebike, helmets, light, drivetrain);
            await db.SaveChangesAsync();

            db.Products.AddRange(
                new Product
                {
                    Sku = "RB-1001",
                    Name = "Road Bike Aero 700C",
                    Description = "Carbon frame, Shimano 105, 700C wheels",
                    Price = 1899m,
                    StockQty = 8,
                    CategoryId = helmet.Id,
                    SubCategoryId = road.Id,
                    ImageFileName = "roadbike1.jpg"
                },
                new Product
                {
                    Sku = "MTB-2001",
                    Name = "Mountain Bike Trail 29\"",
                    Description = "Aluminum frame, front suspension, 29-inch wheels",
                    Price = 1199m,
                    StockQty = 10,
                    CategoryId = helmet.Id,
                    SubCategoryId = mtb.Id,
                    ImageFileName = "mtb1.jpg"
                },
                new Product
                {
                    Sku = "EB-3001",
                    Name = "E-Bike City 500W",
                    Description = "500W motor, 48V battery, up to 60km range",
                    Price = 1599m,
                    StockQty = 6,
                    CategoryId = helmet.Id,
                    SubCategoryId = ebike.Id,
                    ImageFileName = "ebike1.jpg"
                },
                new Product
                {
                    Sku = "ACC-4001",
                    Name = "Helmet MIPS Pro",
                    Description = "Lightweight helmet with MIPS protection",
                    Price = 89.99m,
                    StockQty = 35,
                    CategoryId = lights.Id,
                    SubCategoryId = helmets.Id,
                    ImageFileName = "helmet1.jpg"
                },
                new Product
                {
                    Sku = "ACC-4002",
                    Name = "USB Rechargeable Bike Light Set",
                    Description = "Front 800lm + rear red light, USB-C charging",
                    Price = 49.99m,
                    StockQty = 50,
                    CategoryId = lights.Id,
                    SubCategoryId = lights.Id,
                    ImageFileName = "lights1.jpg"
                },
                new Product
                {
                    Sku = "PRT-5001",
                    Name = "11-Speed Chain + Cassette Kit",
                    Description = "11-speed chain + 11-32T cassette bundle",
                    Price = 79.99m,
                    StockQty = 20,
                    CategoryId = parts.Id,
                    SubCategoryId = drivetrain.Id,
                    ImageFileName = "drivetrain1.jpg"
                }
            );

            await db.SaveChangesAsync();
        }

        logger.LogInformation("✅ Seed finished.");
    }
}