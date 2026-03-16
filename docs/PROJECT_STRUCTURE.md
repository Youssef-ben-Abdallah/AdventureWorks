# Project structure

## Root

- `README.md` - main entry point for the full repository.
- `.gitignore` - root ignore rules for all modules.
- `backend/` - .NET solution and API project.
- `frontend/` - Angular application wrapper folder.
- `AW_Sales_DW_ETL/` - SSIS ETL project for the sales warehouse.
- `docs/` - shared documentation and diagrams.

## backend/

- `Ecom.sln` - Visual Studio solution for backend work.
- `README.md` - backend-level setup and structure notes.
- `.gitignore` - backend-specific Git ignore rules.
- `Ecom.Api/` - actual ASP.NET Core API project.

## backend/Ecom.Api/

### Key runtime files
- `Program.cs` - service registration, middleware, Swagger, auth, CORS, static image hosting, and startup seeding.
- `appsettings.json` - connection strings, JWT settings, seed admin config, and image storage path.
- `Ecom.Api.csproj` - .NET 9 project definition and package references.

### Application layers
- `Controllers/` - REST endpoints for auth, catalog, orders, and dashboards.
- `DTOs/` - transport/request/response models.
- `Entities/` - EF Core entities for OLTP domain objects.
- `Repositories/` - data access abstractions and implementations.
- `Services/` - JWT service and dashboard service logic.
- `Data/` - EF Core contexts and database seed logic.
- `Migrations/` - EF Core migration history.
- `Properties/launchSettings.json` - local launch URLs for development.

### Generated folders already present in the uploaded snapshot
- `.vs/`
- `bin/`
- `obj/`

These should not normally be committed going forward.

## frontend/

- `README.md` - frontend-level instructions.
- `.gitignore` - frontend wrapper ignore rules.
- `ecom-ui/` - actual Angular 17 app.

## frontend/ecom-ui/

### Key runtime files
- `package.json` - scripts and npm dependencies.
- `package-lock.json` - locked dependency tree.
- `angular.json` - Angular workspace configuration.
- `tsconfig*.json` - TypeScript configs.

### Angular source layout
- `src/main.ts` - Angular bootstrap entry point.
- `src/styles.css` - global styles.
- `src/app/app.routes.ts` - route table.
- `src/app/core/` - config, services, guards, interceptor, models.
- `src/app/pages/` - page components (home, products, cart, login, orders, admin, dashboard).
- `src/app/shared/` - reusable UI components and widgets.

### Notable pages
- `/` - home
- `/products` - public catalog
- `/products/:id` - product detail
- `/cart` - authenticated cart
- `/login` - auth page
- `/orders` - authenticated user orders
- `/admin` - admin management view
- `/dashboard` - admin analytics dashboard

## AW_Sales_DW_ETL/

### Core files
- `AW_Sales_DW_ETL.slnx` - solution entry for Visual Studio.
- `AW_Sales_DW_ETL.dtproj` - SSIS project definition.
- `Project.params` - project-level parameters.
- `01_Load_Dimension.dtsx` - dimension load package.
- `02_Load_FactSales.dtsx` - fact load package.

### Generated / local folders already present in the uploaded snapshot
- `.vs/`
- `bin/`
- `obj/`

## docs/

- `README.md` - docs index.
- `PROJECT_STRUCTURE.md` - this file.
- `api/API_REFERENCE.md` - API reference.
- `diagrams/` - copied data model diagrams provided by the user.
