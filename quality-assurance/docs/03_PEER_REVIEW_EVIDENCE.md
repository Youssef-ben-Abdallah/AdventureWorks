# 03 - Peer review evidence

## Review method
A structured peer review was simulated as required by the course guideline. The review focused on:
- business rules
- API authorization rules
- UI automation stability
- non-functional risks
- source-level maintainability concerns

## Review checklist
| Item | Reviewer verdict | Notes |
|---|---|---|
| Authentication endpoints protected correctly | OK | `/api/auth/me` requires JWT |
| Anonymous vs admin access separation | OK with warning | Dev CORS is very broad and should not stay in production |
| Order creation business rule | Corrected | Stock decrement added |
| Deletion error handling | Corrected | Conflict handling added for FK-related delete failures |
| UI selectors stable for automation | Corrected | `data-testid` added to key pages |
| Cart quantity control | Corrected | Manual entry now capped by stock |
| Hardcoded dev secrets | Warning | Present in `appsettings.json` for local development |
| Windows-only image storage path | Warning | Reduces portability |
| Duplicate seeding logic | Warning | `Program.cs` contains additional dev seeding after `DbSeeder.SeedAsync` |

## Review findings turned into action
- Added stable selectors for login, navigation, products, cart, orders, and admin view checks.
- Added conflict handling to delete endpoints.
- Added visible stock decrement logic during order creation.
- Added stock-cap logic to cart quantity update path.
