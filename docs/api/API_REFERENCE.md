# API reference

This document summarizes the API exactly as packaged in the current source code.

## Base URL

- HTTPS: `https://localhost:57240`
- HTTP: `http://localhost:57241`

Swagger UI:
- `https://localhost:57240/swagger`

## Authentication model

The API uses JWT bearer authentication.

- Public endpoints are explicitly marked with `[AllowAnonymous]`.
- Protected endpoints require a valid bearer token.
- Admin-only endpoints require the `Admin` role.

Use the header below for protected calls:

```http
Authorization: Bearer <your-jwt-token>
```

## Development seed credentials

A development admin user is seeded on startup:

- Username: `admin`
- Email: `admin@local.test`
- Password: `Admin123!`

## Controller overview

### AuthController
Route prefix: `api/auth`

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user and return JWT token data. |
| POST | `/api/auth/login` | Public | Authenticate an existing user and return JWT token data. |
| GET | `/api/auth/me` | Authenticated | Return current user identity and roles. |

#### Request models

`POST /api/auth/register`

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

`POST /api/auth/login`

```json
{
  "username": "string",
  "password": "string"
}
```

#### Auth response shape

```json
{
  "token": "string",
  "expiresAtUtc": "2026-01-01T00:00:00Z",
  "username": "string",
  "email": "string",
  "roles": ["User"]
}
```

### CategoriesController
Route prefix: `api/categories`

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/categories` | Public | List all categories. |
| POST | `/api/categories` | Admin | Create a category. |
| GET | `/api/categories/{id}` | Authenticated | Get a single category by id. |
| PUT | `/api/categories/{id}` | Admin | Update a category. |
| DELETE | `/api/categories/{id}` | Admin | Delete a category. |

#### Category payloads

```json
{
  "id": 1,
  "name": "helmet"
}
```

Create/update body:

```json
{
  "name": "string"
}
```

### SubCategoriesController
Route prefix: `api/subcategories`

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/subcategories` | Public | List all subcategories. |
| POST | `/api/subcategories` | Admin | Create a subcategory. |
| GET | `/api/subcategories/{id}` | Authenticated | Get a single subcategory. |
| PUT | `/api/subcategories/{id}` | Admin | Update a subcategory. |
| DELETE | `/api/subcategories/{id}` | Admin | Delete a subcategory. |

#### Subcategory payloads

```json
{
  "id": 1,
  "name": "Road helmet",
  "categoryId": 1,
  "categoryName": "helmet"
}
```

Create/update body:

```json
{
  "name": "string",
  "categoryId": 1
}
```

### ProductsController
Route prefix: `api/products`

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/products` | Public | List all products. |
| POST | `/api/products` | Admin | Create a product. |
| GET | `/api/products/{id}` | Public | Get one product by id. |
| PUT | `/api/products/{id}` | Admin | Update a product. |
| DELETE | `/api/products/{id}` | Admin | Delete a product. |
| POST | `/api/products/{id}/image` | Admin | Upload a product image (multipart/form-data). |

Notes:
- The image upload endpoint is marked with `ApiExplorerSettings(IgnoreApi = true)`, so it may not appear in Swagger.
- Allowed upload extensions: `.png`, `.jpg`, `.jpeg`, `.gif`

#### Product payloads

```json
{
  "id": 1,
  "sku": "RB-1001",
  "name": "Road Bike Aero 700C",
  "description": "string",
  "price": 1899.0,
  "stockQty": 8,
  "imageFileName": "roadbike1.jpg",
  "categoryId": 1,
  "categoryName": "helmet",
  "subCategoryId": 1,
  "subCategoryName": "Road helmet"
}
```

Create/update body:

```json
{
  "sku": "string",
  "name": "string",
  "description": "string",
  "price": 0,
  "stockQty": 0,
  "imageFileName": "string",
  "categoryId": 1,
  "subCategoryId": 1
}
```

#### Image upload request

Use `multipart/form-data` with one field:
- `file` -> binary image

### OrdersController
Route prefix: `api/orders`

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/orders/mine` | Authenticated | Return the current user's orders. |
| GET | `/api/orders` | Admin | Return all orders. |
| POST | `/api/orders` | Authenticated | Create an order from a list of items. |
| GET | `/api/orders/{id}` | Authenticated / Admin | Return one order (owner or admin only). |
| PATCH | `/api/orders/{id}/status` | Admin | Update order status. |

#### Create order body

```json
{
  "items": [
    {
      "productId": 1,
      "qty": 2
    }
  ]
}
```

#### Order response shape

```json
{
  "id": 1,
  "createdAtUtc": "2026-01-01T00:00:00Z",
  "status": 0,
  "userId": "string",
  "username": "string",
  "total": 0,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "string",
      "qty": 1,
      "unitPrice": 0,
      "lineTotal": 0
    }
  ]
}
```

#### Update order status body

```json
{
  "status": 1
}
```

### DashboardController
Route prefix: `api/dashboard`
Access: Admin only for all endpoints.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/dashboard/filters` | Returns filter values for dashboard controls. |
| GET | `/api/dashboard/overview` | Returns KPI cards, revenue trend, and high-level breakdowns. |
| GET | `/api/dashboard/products` | Returns product analytics widgets. |
| GET | `/api/dashboard/customers` | Returns customer analytics widgets. |
| GET | `/api/dashboard/sales-team` | Returns sales team / quota analytics. |
| GET | `/api/dashboard/shipping` | Returns shipping and lead-time analytics. |
| GET | `/api/dashboard/details` | Returns paged transactional detail rows. |

#### Supported dashboard query fields

These endpoints bind to a shared `DashboardQuery` object from query string:

- `from` (DateTime)
- `to` (DateTime)
- `territoryId` (int)
- `territoryGroup` (string)
- `salesPersonId` (int)
- `shipMethodId` (int)
- `category` (string)
- `subCategory` (string)
- `currencyCode` (string)
- `online` (bool)

Additional paging parameters for `/api/dashboard/details`:
- `page` (default `1`)
- `pageSize` (default `50`)

#### Example dashboard request

```http
GET /api/dashboard/overview?from=2013-01-01&to=2013-12-31&territoryId=1
Authorization: Bearer <token>
```

## Static image hosting

The API also exposes product images via static files under:

- `/images/product/<file-name>`

The physical folder is read from `Images:ProductsPath` in `appsettings.json`.

## Operational notes

- Swagger is enabled in the current startup pipeline.
- CORS policy is currently permissive for development (`SetIsOriginAllowed(_ => true)`).
- The API uses two SQL Server contexts:
  - `OltpDbContext` for transactional data
  - `AnalyticsDbContext` for `AdventureWorksDW_Sales`

## Recommended first test flow

1. Run the API.
2. Open Swagger.
3. Call `POST /api/auth/login` using the seeded admin credentials.
4. Copy the JWT token.
5. Authorize in Swagger with `Bearer <token>`.
6. Test admin endpoints such as:
   - `GET /api/dashboard/filters`
   - `GET /api/orders`
   - `POST /api/categories`
