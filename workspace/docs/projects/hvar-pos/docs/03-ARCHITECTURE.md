# Architecture

> Laravel 8 MVC structure with some deviations from standard Laravel patterns.

---

## Route Loading

Routes are split across 21 files in `routes/`:

```php
// app/Providers/RouteServiceProvider.php — likely loads them
```

### Route Groups

| Group | Middleware | Purpose |
|-------|-----------|---------|
| `web` | `web`, `language`, `AppLanguage` | Storefront, auth pages |
| `admin` | `auth`, `admin` | Admin panel |
| `seller` | `seller`, `verified` | Seller dashboard |
| `api` | `api`, `app_language`, `auth:sanctum` | Mobile API V2 |
| POS | — | POS terminal routes (some open, some admin/seller) |

### Middleware Stack

| Middleware | Purpose |
|-----------|---------|
| `AppLanguage` | Set app locale from mobile API header |
| `Language` | Set app locale from session |
| `IsAdmin` | Admin-only access |
| `IsSeller` | Seller-only access |
| `IsCustomer` | Customer-only access |
| `IsUser` | Any authenticated user |
| `IsUnbanned` | Check if user is not banned |
| `IsAppUserUnbanned` | Check mobile API user ban status |
| `CheckoutMiddleware` | Checkout-specific middleware |
| `OrderEditAccess` | Permission check for order editing |
| `HttpsProtocol` | Force HTTPS |
| `UserMiddleware` | General user check |

---

## Database Layer

**Key difference from standard Laravel:** The POS has only 5 migration files.
The database schema is managed through the installer (views in `resources/views/installation/`)
and the `mehedi-iitdu/core-component-repository` package.

**Tables (from model analysis and helpers):**

```
users
  ├── roles (Spatie Permissions)
  ├── sellers
  ├── customers
  ├── shops
  ├── staff
  ├── addresses
  ├── carts
  ├── orders (hasMany order_details)
  ├── wishlists
  ├── reviews
  ├── wallets
  ├── conversations
  └── messages

products
  ├── categories (self-referential parent_id)
  ├── brands
  ├── attributes + attribute_values
  ├── product_stocks (SKU, variant, price, qty)
  ├── product_translations
  ├── product_taxes
  ├── product_queries
  ├── reviews
  ├── offers
  └── wholesale_prices

orders
  ├── order_details (product_id, quantity, price, variation)
  ├── combined_orders
  └── refund_requests

settings
  ├── business_settings
  ├── currencies
  ├── languages
  ├── tax_rates
  ├── carriers
  ├── shipping (cities, states, countries, zones)
  ├── pickup_points
  └── pages

marketing
  ├── coupons + coupon_usages
  ├── flash_deals + flash_deal_products
  ├── banners
  ├── sliders
  ├── blog_categories + blogs
  └── newsletters + subscribers

affiliate
  ├── affiliate_configs, affiliate_options
  ├── affiliate_users, affiliate_logs
  ├── affiliate_earnings
  └── affiliate_withdraw_requests

club_points
  ├── club_points
  └── club_point_details

delivery_boys
  ├── delivery_boys
  ├── delivery_histories
  └── delivery_boy_payments

addons
  ├── addons
  └── app_settings
```

---

## Service Layer

**Directory:** `app/Services/`

| Service | Purpose |
|---------|---------|
| `OrderService.php` | Order processing logic |
| `ProductService.php` | Product CRUD operations |
| `ProductStockService.php` | Stock management |
| `ProductTaxService.php` | Tax calculations |
| `ProductFlashDealService.php` | Flash deal product logic |

---

## API Layer

**Directory:** `app/Http/Controllers/Api/V2/`

**Pattern:**
- Controllers directly return JSON or use API Resources
- API Resources (`app/Http/Resources/V2/`) format the responses
- Auth via Laravel Sanctum tokens
- Flutter mobile app consumes this API

**Key traits:**
- `app/Traits/ApiTrait.php` — Common API utilities
- `app/Traits/SharedFunctionTrait.php` — Shared helper functions

---

## Helper File

**File:** `app/Http/Helpers.php`

Contains globally available functions:

| Function | Purpose |
|----------|---------|
| `sendSMS()` | OTP SMS sending |
| `filter_products()` | Scope products by approved/published |
| `verified_sellers_id()` | Cached list of verified seller IDs |
| `format_price()` | Price formatting with currency |
| `single_price()` | Single price display |
| `cart_product_price()` | Cart line price calculation |
| `cart_product_tax()` | Cart line tax calculation |
| `cart_product_discount()` | Cart line discount calculation |

---

## Frontend

**Templates:** Blade (server-rendered)
**CSS:** Custom (custom-style.css) + Bootstrap
**JS:** jQuery-based with custom scripts
**Theme:** Not using Laravel UI scaffolding — custom admin theme
