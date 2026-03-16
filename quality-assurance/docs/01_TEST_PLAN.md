# 01 - Test plan and strategy

## Context
This plan covers the `EcomOltp_EFCodeFirst_Angular17_CART_IMAGES_FILTERS` project with a **Python-only** QA approach.
The system under test includes:
- ASP.NET Core Web API backend
- Angular 17 frontend
- analytics endpoints backed by the AdventureWorks sales warehouse

## Objectives
- Verify core business requirements for authentication, catalog, orders, admin CRUD, and dashboard analytics.
- Include **static** and **dynamic** testing.
- Cover the three required levels: **unit-level**, **integration**, and **system**.
- Include functional and non-functional checks.
- Maintain traceability from requirement to scenario, test case, and result.
- Produce execution evidence in CSV form for grading and demonstration.

## Scope
### In scope
- Backend API endpoints
- Frontend user journeys
- Admin-only flows
- Regression checks on previously faulty behaviors
- Basic non-functional checks: performance, access-control security, accessibility smoke
- Runtime evidence capture for negative UI scenarios and failed/error UI tests

### Out of scope
- Load testing under concurrent multi-user traffic
- Penetration testing beyond basic access-control and injection-like payload checks
- Full cross-browser matrix execution in this delivered container (the suite supports Chrome/Edge when run locally)

## Test levels used
- **Static**: source inspection, code review evidence, static audit report
- **Unit-level**: isolated API requirement checks using Python `requests`
- **Integration**: multi-endpoint business workflows using Python `requests`
- **System**: end-to-end UI journeys using Selenium Page Object Model

## Types of test used
- Functional: auth, catalog, cart, orders, admin CRUD, dashboard
- Confirmation: stock decrement and delete conflict behavior after fixes
- Regression: core smoke flows rerunnable after future changes
- Negative: invalid credentials, unauthorized routing, and non-admin access attempts with mandatory screenshot evidence
- Non-functional:
  - performance (simple response-time thresholds)
  - security (401/403 behavior, invalid upload, injection-like login payload)
  - accessibility smoke (alt text on scanned UI templates)

## Technique choices
- **Black-box** for endpoint and UI behavior because the deliverable had to stay Python-only and directly exercise the SUT from outside.
- **White-box static inspection** for source-level corrections and accessibility/selector checks.
- **Boundary values** for empty order, invalid product, negative quantity, overstock, unknown id, and page size checks.
- **Equivalence partitioning** for valid vs invalid credentials, valid vs invalid file type, admin vs non-admin.

## Environment assumptions
- Backend: `https://localhost:57240`
- Frontend: `http://localhost:4200`
- Seed admin: `admin / Admin123!`
- Browser: Chrome by default, Edge supported through `--browser edge`

## Entry criteria
- Backend starts successfully and exposes `/swagger`
- Frontend starts successfully and loads the Angular app
- Seeded admin account exists
- Warehouse connection is available for dashboard endpoint execution

## Exit criteria
- Static checks pass
- Critical functional tests pass
- No blocker remains on login, ordering, authorization, or dashboard access control
- Known warnings and environment limitations are documented
- Execution logs and screenshots are available under `reports/`

## Evidence strategy
- `reports/runs/<timestamp>/execution_results.csv` records suite result status, duration, and evidence paths.
- `reports/runs/<timestamp>/traceability_results.csv` records requirement → scenario → test case → result.
- `@pytest.mark.negative` forces screenshot, browser log, and per-test text execution logs even when the negative scenario passes.
- Any failed or error UI test also stores screenshot, browser log, and per-test execution text log.
