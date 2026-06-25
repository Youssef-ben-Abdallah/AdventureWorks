# 01 - Test plan and strategy

## Context
This plan covers the **AdventureWorks Sales BI Platform** with a **Python-only** QA approach.
The system under test includes:
- **ASP.NET Core .NET 9** Web API backend
- **React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4** frontend (migrated from Angular 17)
- Analytics dashboard endpoints backed by the AdventureWorks DW star-schema (`AdventureWorksDW_Sales`)
- SSAS multidimensional cube (`CubeAW2019`) queried via ADOMD.NET for `/api/CubeInsights/*` endpoints

> **React migration note**: The frontend was fully migrated from Angular 17 to React 19 + Vite.
> All Angular `.component.html` selector references and `cart.service.ts` references have been
> updated to their React equivalents (`Login.tsx`, `Navbar.tsx`, `Products.tsx`, `Cart.tsx`,
> `CartContext.tsx`). The Vite dev server runs on port **5173** (previously 4200 for Angular CLI).
> Stable `data-testid` attributes are added to all key React components to support Selenium POM.

## Objectives
- Verify core business requirements for authentication, catalog, cart, orders, admin CRUD, dashboard analytics, and SSAS cube insights.
- Include **static** and **dynamic** testing.
- Cover the three required levels: **unit-level**, **integration**, and **system**.
- Include functional and non-functional checks.
- Maintain traceability from requirement to scenario, test case, and result.
- Produce execution evidence in CSV and HTML form.

## Scope
### In scope
- Backend API endpoints (Auth, Catalog, Orders, Admin, Dashboard, CubeInsights)
- Frontend user journeys via Selenium + React POM
- Admin-only flows (dashboard, catalog CRUD, order management)
- CubeInsights SSAS MDX endpoint coverage (KPIs, trends, drill-down, territories)
- Regression checks on previously faulty behaviors
- Basic non-functional checks: performance, access-control security, accessibility smoke
- React-specific: theme toggle state changes, `data-testid` selectors, CartContext stock cap
- Runtime evidence capture for negative UI scenarios and failed/error UI tests

### Out of scope
- Load testing under concurrent multi-user traffic
- Penetration testing beyond basic access-control and injection-like payload checks
- Full cross-browser matrix (the suite supports Chrome/Edge via `--browser chrome|edge`)
- SSIS ETL pipeline testing

## Test levels used
- **Static**: source inspection, code review evidence, static audit report (now covers `.tsx` files)
- **Unit-level**: isolated API requirement checks using Python `requests`
- **Integration**: multi-endpoint business workflows using Python `requests`
- **System**: end-to-end UI journeys using Selenium Page Object Model (React app on Vite)

## Types of test used
- Functional: auth, catalog, cart, orders, admin CRUD, dashboard, cube insights
- Confirmation: stock decrement and delete conflict behavior after fixes
- Regression: core smoke flows rerunnable after future changes
- Negative: invalid credentials, unauthorized routing, non-admin access with mandatory screenshot evidence
- Non-functional:
  - performance (response-time thresholds: 2s for REST, 5s for SSAS MDX)
  - security (401/403 behavior, invalid upload, injection-like login payload, public CubeInsights check)
  - accessibility smoke (alt attributes in React TSX component files)

## Technique choices
- **Black-box** for endpoint and UI behavior (Python-only, exercises the SUT from outside).
- **White-box static inspection** for source-level corrections, React file structure, and selector checks.
- **Boundary values** for empty order, invalid product, negative/zero quantity, overstock, unknown id, page size, and SSAS year filter.
- **Equivalence partitioning** for valid vs invalid credentials, valid vs invalid file type, admin vs non-admin, monthly vs daily SSAS granularity.

## Environment assumptions
- Backend: `https://localhost:57240` (HTTP: `http://localhost:57241`)
- Frontend: `http://localhost:5173` (Vite dev server — **not** 4200 which was Angular CLI)
- SSAS cube: `localhost` — required for CubeInsights tests; skip gracefully if unavailable
- Seed admin: `admin / Admin123!`
- Browser: Edge by default, Chrome supported through `--browser chrome`

## Entry criteria
- Backend starts successfully and exposes `/swagger`
- Frontend starts successfully and loads the React app at port 5173
- Seeded admin account exists
- Warehouse connection is available for dashboard endpoint execution
- SSAS cube is online for CubeInsights endpoint tests (tests are skipped on 500/timeout)

## Exit criteria
- Static checks pass (React file paths, data-testid selectors, CartContext stock cap)
- Critical functional tests pass (auth, catalog, orders, admin, dashboard)
- CubeInsights API tests pass or skip gracefully when SSAS is offline
- No blocker remains on login, ordering, authorization, or dashboard access control
- Known warnings and environment limitations are documented
- Execution logs, screenshots, and HTML report are available under `reports/`

## Evidence strategy
- `reports/runs/<timestamp>/execution_results.csv` records suite result status, duration, and evidence paths.
- `reports/runs/<timestamp>/traceability_results.csv` records requirement → scenario → test case → result.
- `reports/runs/<timestamp>/qa_execution_report.html` (with `--qa-html-report`) — styled HTML dashboard.
- `@pytest.mark.negative` forces screenshot, browser log, and per-test text execution logs even when the negative scenario passes.
- Any failed or error UI test also stores screenshot, browser log, and per-test execution text log.

## Page Object Model — React selectors
All Selenium tests use `data-testid` attributes (via `BasePage.by_testid()`). Key selectors added to React:

| Component | `data-testid` values |
|---|---|
| `Login.tsx` | `mode-login`, `mode-register`, `login-username`, `register-email`, `login-password`, `auth-submit`, `auth-error` |
| `Navbar.tsx` | `nav-products`, `nav-orders`, `nav-cart`, `nav-admin`, `nav-dashboard`, `nav-cube-insights`, `nav-login`, `nav-account-menu`, `nav-logout`, `nav-theme-btn` |
| `Products.tsx` | `product-card`, `product-add-to-cart`, `product-details-link`, `products-prev-page`, `products-next-page` |
| `Cart.tsx` | `cart-item`, `cart-qty-dec`, `cart-qty-input`, `cart-qty-inc`, `cart-checkout`, `cart-clear` |
| `AdminDashboard.tsx` | `admin-tab-categories`, `admin-tab-subcategories`, `admin-tab-products`, `admin-tab-orders`, `admin-categories-title`, `admin-subcategories-title`, `admin-products-title` |
| `MyOrders.tsx` | `order-card` |
| `KpiCards.tsx` | `dashboard-kpis` |
