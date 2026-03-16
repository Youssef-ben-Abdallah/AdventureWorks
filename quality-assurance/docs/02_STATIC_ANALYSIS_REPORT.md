# Static analysis report

## Coverage scanned
- C# files: 50
- TypeScript files: 32
- HTML files: 14

## Corrected or confirmed improvements
- Stock is decremented when an order is created.
- Cart manual quantity updates are capped by stock quantity.
- Category delete action returns Conflict instead of a raw database failure.
- Subcategory delete action returns Conflict instead of a raw database failure.
- Product delete action returns Conflict instead of a raw database failure.
- Stable data-testid selectors were added to key pages for Selenium automation.
- Image tags in Angular templates include alt text in the scanned pages.

## Remaining warnings
- CORS policy allows every origin in development configuration.
- Development secrets are hardcoded in appsettings.json and must be changed outside local use.
- Program.cs contains extra seed logic after DbSeeder.SeedAsync; this is acceptable in dev but redundant.


## Summary of corrections applied in this package
1. Order creation now visibly decrements stock in `OrdersController`.
2. Cart manual quantity updates are capped to available stock in `cart.service.ts`.
3. Delete actions for categories, subcategories, and products now return `409 Conflict` on FK-related failures instead of surfacing a raw database exception.
4. Stable `data-testid` selectors were added to key Angular pages to improve Selenium robustness.
