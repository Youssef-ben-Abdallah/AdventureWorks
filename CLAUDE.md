# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdventureWorks Sales BI Platform — a full-stack e-commerce + business intelligence application built on the AdventureWorks 2019 SQL Server sample database. Combines an OLTP e-commerce API, a React frontend (migrated from Angular), a sales data warehouse, SSAS multidimensional cube, and an SSIS ETL pipeline.

## Build & Run Commands

### Backend (.NET 9)
```bash
cd backend/Ecom.Api
dotnet restore
dotnet build
dotnet run                  # HTTP: localhost:57241, HTTPS: localhost:57240, Swagger: localhost:57240/swagger
dotnet ef database update   # apply EF Core migrations (uses OLTPConnection)
```

### Frontend (React + Vite)
```bash
cd frontend/ecom-ui
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

### CI
GitHub Actions workflow (`.github/workflows/ci.yml`) runs `dotnet build --configuration Release` for backend and `npm run build` for frontend on push/PR to main.

## Architecture

### Two-database pattern
The backend connects to **two separate SQL Server databases** via distinct connection strings in `appsettings.json`:
- **OLTPConnection** → `AdventureWorks2019` — the transactional e-commerce database (Identity, Categories, Products, Orders). Managed by `OltpDbContext` (extends `IdentityDbContext<AppUser>`).
- **AnalyticsConnection** → `AdventureWorksDW_Sales` — the star-schema data warehouse for dashboard analytics. Managed by `AnalyticsDbContext` (read-only).

A third connection, **SsasConnection**, points to an SSAS multidimensional cube (`CubeAW2019`) used by `OlapService` for MDX queries.

### OLTP entity mapping quirk
`OltpDbContext` maps `Order`/`OrderItem` entities to the **existing AdventureWorks tables** (`Sales.SalesOrderHeader`, `Sales.SalesOrderDetail`) with explicit column renames (e.g., `Order.Id` → `SalesOrderID`, `Order.UserId` → `Comment`). Several tables are marked `ExcludeFromMigrations()` because they pre-exist in AdventureWorks. Be aware of trigger declarations (`TR_Products_Insert`, `uSalesOrderHeader`, etc.) when modifying these entities.

### Two analytics paths
1. **Dashboard** (`/api/dashboard/*`) — Admin-only, JWT-protected. Uses `DashboardService` which runs EF Core LINQ queries against `AnalyticsDbContext` (the DW). Serves tabbed views: Overview, Products, Customers, Sales Team, Shipping, Details.
2. **Cube Insights** (`/api/CubeInsights/*`) — No auth required. Uses `OlapService` which executes MDX queries via ADOMD.NET against the SSAS cube. Provides KPIs, profit analysis, trends, territory breakdowns.

### Frontend architecture
- **React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4** (in `frontend/ecom-ui/`)
- Global state via React Context: `AuthContext` (JWT in localStorage), `CartContext`, `ThemeContext` (dark/light mode)
- API layer: single Axios instance in `src/config/api.ts` with JWT interceptor, base URL hardcoded to `http://localhost:57241`
- Service files (`src/services/`) wrap API calls per domain: `auth`, `catalog`, `orders`, `dashboard`, `cubeInsights`
- Charts use Recharts; maps use React-Leaflet
- Legacy Angular frontend still exists at `frontend/ecom-ui-angular/` but active development is on the React version

### Backend service registration
All DI is in `Program.cs` — repository pattern for OLTP entities (`ICategoryRepository`, `IProductRepository`, etc.), `IDashboardService` for DW analytics, `IOlapService` for SSAS cube queries. The app seeds roles ("Admin", "User") and an admin user on startup from `SeedAdmin` config section.

### ETL & Warehouse
- `AW_Sales_DW_ETL/` — SSIS packages: run `01_Load_Dimension.dtsx` then `02_Load_FactSales.dtsx`
- `Database/` — SQL scripts defining the DW star schema (fact + dimension tables), stored procedures for incremental loads, and a reporting view (`vwSalesDashboard`)
- `MultdimCubeAW2019/` — SSAS multidimensional cube project (`.dwproj`) with dimension and cube definitions

### Product images
The API serves product images as static files from a configurable local path (default: `C:\images\product`), exposed at `/images/product/{filename}`.

## Key Connection Points

- Frontend base URL → `http://localhost:57241` (backend HTTP port)
- Auth flow: register/login → JWT token stored in `localStorage` → sent via Axios interceptor
- Admin features (Dashboard, AdminDashboard, product CRUD) require `Admin` role
- Default dev admin: `admin` / `Admin123!`
