# Ecom.Api

ASP.NET Core Web API project for the e-commerce and analytics backend.

## Tech stack

- .NET 9
- ASP.NET Core Web API
- Entity Framework Core 9
- ASP.NET Core Identity
- JWT bearer authentication
- Swagger / Swashbuckle
- SQL Server

## Key responsibilities

- Register and log in users
- Seed default roles and a development admin user
- Manage categories, subcategories, and products
- Accept and track orders
- Serve product images from a local folder
- Expose admin analytics endpoints backed by `AdventureWorksDW_Sales`

## Project structure

- `Controllers/` - HTTP endpoints
- `DTOs/` - API contracts
- `Entities/` - database entities
- `Repositories/` - data access layer
- `Services/` - JWT and dashboard services
- `Data/` - DbContexts and seed logic
- `Migrations/` - EF Core migration files
- `Properties/launchSettings.json` - development URL bindings

## Local run

```bash
dotnet restore
dotnet ef database update
dotnet run
```

## Default local URLs

- `https://localhost:57240`
- `http://localhost:57241`
- Swagger: `https://localhost:57240/swagger`

## Required setup

### 1) SQL Server access
The project expects:
- LocalDB for OLTP (`EcomOltpDb1`)
- SQL Server database `AdventureWorksDW_Sales` for analytics

Review `appsettings.json` before running if your SQL instance differs.

### 2) Product image folder
By default the API uses:
- `C:\images\product`

Create this folder (or update config) if needed.

### 3) Development admin account
By default:
- username: `admin`
- password: `Admin123!`

## API documentation

Detailed endpoint documentation is available here:
- [`../../docs/api/API_REFERENCE.md`](../../docs/api/API_REFERENCE.md)

## Notes for Git

The uploaded snapshot already contains generated folders like `.vs/`, `bin/`, and `obj/`.
The new repository ignore files are meant to prevent these from being re-added in future commits.


## Authors

- **Youssef Ben Abdallah**
- **Mariem Ben Slim**
