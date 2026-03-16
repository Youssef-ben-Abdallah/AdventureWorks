# 08 - Source fixes summary

## Fix 1 - order stock decrement
**Problem:** the order-creation flow validated stock but did not visibly decrement product stock in the controller path.

**Change:** added `p.StockQty -= i.Qty;` and persisted updated products after the order is created.

## Fix 2 - cart quantity cap
**Problem:** manual cart quantity edits could exceed `stockQty`.

**Change:** `setQty()` now caps the requested quantity with `Math.min(q, i.product.stockQty || 999999)`.

## Fix 3 - graceful conflict handling on delete
**Problem:** deleting referenced categories, subcategories, or products could bubble up a raw database exception.

**Change:** the three delete actions now catch `DbUpdateException` and return `409 Conflict` with a user-readable message.

## Fix 4 - stable selectors for Selenium
**Problem:** Angular pages lacked stable selectors, which makes UI automation brittle.

**Change:** `data-testid` attributes were added to the login page, navbar, products page, cart page, product details page, home page, orders page, and admin page anchors/headings.
