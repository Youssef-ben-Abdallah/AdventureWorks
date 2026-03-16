using Ecom.Api.Controllers;
using Ecom.Api.Data;
using Ecom.Api.Entities;
using Ecom.Api.Repositories;
using Ecom.Api.Services;
using Ecom.Api.Services.Dashboard;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Ecom API",
        Version = "v1"
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer {your JWT token}'"
    });

    // Apply JWT to all endpoints (or you can control per endpoint)
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { } // scopes, not needed for JWT
        }
    });
});

builder.Services.AddDbContext<OltpDbContext>(opt =>
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("OLTPConnection"));
});

// Analytics (AdventureWorksDW_Sales) – read-only dashboard context
builder.Services.AddDbContext<AnalyticsDbContext>(opt =>
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("AnalyticsConnection"));
});

builder.Services.AddIdentity<AppUser, IdentityRole>(opt =>
    {
        opt.Password.RequiredLength = 6;
        opt.Password.RequireDigit = true;
        opt.Password.RequireUppercase = true;
        opt.Password.RequireLowercase = true;
        opt.Password.RequireNonAlphanumeric = false;
        opt.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<OltpDbContext>()
    .AddDefaultTokenProviders();
var jwtSection = builder.Configuration.GetSection("Jwt");
var key = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key missing");
var issuer = jwtSection["Issuer"];
var audience = jwtSection["Audience"];

builder.Services.AddAuthentication(opt =>
    {
        opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ClockSkew = TimeSpan.FromSeconds(15)
        };
    });

builder.Services.ConfigureApplicationCookie(opt =>
{
    opt.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    opt.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthorization();

builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ISubCategoryRepository, SubCategoryRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Dashboard
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("dev", p => p
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .SetIsOriginAllowed(_ => true));
});

var app = builder.Build();
await DbSeeder.SeedAsync(
    app.Services,
    builder.Configuration,
    app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Seed")
);
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

// Serve product images from a local folder (Windows default: C:\images\product)
var productImagesPath = app.Configuration["Images:ProductsPath"] ?? @"C:\images\product";
Directory.CreateDirectory(productImagesPath);

// Create a tiny default image if it doesn't exist (so UI doesn't show broken images)
var defaultImg = Path.Combine(productImagesPath, "default.png");
if (!File.Exists(defaultImg))
{
    // 1x1 transparent PNG
    var base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOqWcYgAAAAASUVORK5CYII=";
    File.WriteAllBytes(defaultImg, Convert.FromBase64String(base64));
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(productImagesPath),
    RequestPath = "/images/product"
});

app.UseCors("dev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed roles + admin user (dev convenience)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("Seed");
    try
    {
        var db = services.GetRequiredService<OltpDbContext>();
        await db.Database.MigrateAsync();

        var roleMgr = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userMgr = services.GetRequiredService<UserManager<AppUser>>();

        foreach (var role in new[] { "Admin", "User" })
        {
            if (!await roleMgr.RoleExistsAsync(role))
                await roleMgr.CreateAsync(new IdentityRole(role));
        }

        var adminCfg = builder.Configuration.GetSection("SeedAdmin");
        var username = adminCfg["Username"]!;
        var email = adminCfg["Email"]!;
        var password = adminCfg["Password"]!;

        var existing = await userMgr.FindByNameAsync(username);
        if (existing == null)
        {
            var admin = new AppUser { UserName = username, Email = email, EmailConfirmed = true };
            var result = await userMgr.CreateAsync(admin, password);
            if (!result.Succeeded)
            {
                logger.LogWarning("Admin seed failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            }
            else
            {
                await userMgr.AddToRoleAsync(admin, "Admin");
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error seeding database");
    }
}

app.Run();
