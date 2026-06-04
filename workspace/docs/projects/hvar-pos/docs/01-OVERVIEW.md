# Hvar-POS — System Overview

## What Is Hvar-POS?

Hvar-POS is an **e-commerce platform with a built-in POS terminal**, not a pure POS system.
It's a customized fork of **Active eCommerce CMS** (by ActiveITzone), running on **Laravel 8**.

The system serves as the **online storefront** and **mobile commerce backend** in the Hvar ecosystem. It
connects bidirectionally to **Hvar-ERP** (based on **Ultimate POS** by Ultimate Fosters, Laravel 10) which
handles the core business management (inventory, accounting, HR, manufacturing).

```
┌─────────────────────────────────────────────────────┐
│                  Hvar Ecosystem                      │
├──────────────────────┬──────────────────────────────┤
│   Hvar-POS           │   Hvar-ERP                   │
│   (Active eCommerce) │   (Ultimate POS)             │
│   Laravel 8          │   Laravel 10                  │
│   E-commerce + POS   │   Full business management    │
├──────────────────────┼──────────────────────────────┤
│ Storefront (web)     │ Dashboard + POS terminal     │
│ Mobile API (Flutter) │ Inventory management         │
│ Seller marketplace   │ Full accounting (auto- map)  │
│ 20+ payment gateways │ HR / Payroll (Essentials)    │
│ Shipping integration │ CRM + proposals              │
│ Affiliate / club pts │ Manufacturing (BOM/recipes)  │
│ Coupons / wallets    │ Restaurant / booking         │
│ Delivery boy system  │ WooCommerce sync             │
└──────────────────────┴──────────────────────────────┘
```

## Two Systems, One Data Flow

| Direction | What syncs | Mechanism |
|-----------|-----------|-----------|
| POS → ERP | Orders (new, update, delete) | Webhooks via Website Module |
| ERP → POS | Categories, brands, attributes | ERP Integration API (POS pulls) |
| ERP → POS | Product stock levels + prices | `php artisan pos:stock` (daily, except Fri) |
| POS → ERP | Product stock levels | `php artisan stock:cron` (push to ERP) |

## Key Facts

| Property | Value |
|----------|-------|
| Framework | Laravel 8.x |
| PHP | ^7.1.3 |
| Database | MySQL (schema managed by installer + `mehedi- iitdu/core-component-repository`) |
| Auth | Laravel Sanctum (API) + Spatie Permissions (admin) |
| Mobile API | V2 — Flutter app integration |
| Customization | Dokkan Agency 2024 — `v1.0.0 beta` |
| Footer | `© Hvar, Powered by Dokkan Agency 2024` |
| Repo | `kariemSeiam/Hvar-POS` (private) |

## Custom Hvar Code (the delta)

The following are **not** in the original Active eCommerce CMS — they were added by Hvar:

- **ERP Integration layer** — `app/Http/Controllers/Api/V2/ERP/IntegrationController.php`
- **Kashier payment gateway** — custom Egyptian payment gateway (`Payment/KashierController.php`)
- **Stock sync cron** — `app/Console/Commands/StockCron.php`
- **Shipping status tracking** — `app/Console/Commands/ShippingStatus.php` (Turbo shipping)
- **Order cancel cron** — `app/Console/Commands/OrderCancelled.php`
- **City dropdown cascade** — checkout UX with state → city AJAX
- **Bosta integration** (in ERP) — auto- shipment creation on order sync
- **Security hardening** — SQL injection, XSS, file upload fixes
- **`id_from_pos` field** — maps POS products to ERP product IDs
- **Custom views** — `resources/views/backend/newblades/`

## Directory Structure (key areas)

```
app/
├── Console/Commands/          # Cron jobs: StockCron, OrderCancelled, ShippingStatus
├── Events/                    # OrderCreated, DeleteOrder, UpdateOrder
├── Exports/                   # GuestUserExport
├── Http/
│   ├── Controllers/
│   │   ├── Api/V2/            # Mobile API (Flutter) — 100+ controllers
│   │   │   └── ERP/           # IntegrationController
│   │   ├── Auth/              # Laravel auth controllers
│   │   ├── Payment/           # 20+ payment gateway controllers
│   │   │   ├── KashierController.php
│   │   │   ├── PaypalController.php
│   │   │   ├── StripeController.php
│   │   │   └── ... (24 total)
│   │   ├── PosController.php  # POS terminal
│   │   ├── OrderController.php
│   │   ├── ProductController.php
│   │   ├── CheckoutController.php
│   │   └── ...
│   ├── Helpers.php            # Shared utility functions
│   ├── Middleware/             # Auth, admin, seller, language middleware
│   └── Resources/             # API response collections (V2)
├── Listeners/                 # SendOrderToExternalAPI, DeleteOrderApi, UpdateOrderApi
├── Mail/                      # Email templates (Invoice, Auction, etc.)
├── Models/                    # 70+ Eloquent models
├── Services/                  # OrderService, ProductService, ProductStockService
└── Traits/                    # ApiTrait, SharedFunctionTrait, ConversionApiTrait
```

## Route Structure

| File | Routes | Purpose |
|------|--------|---------|
| `web.php` | 229 | Storefront & admin pages |
| `admin.php` | 327 | Admin panel CRUD |
| `seller.php` | 89 | Seller dashboard |
| `api.php` | 227 | Mobile API V2 |
| `api_seller.php` | 62 | Seller API |
| `pos.php` | 18 | POS terminal |
| `affiliate.php` | 31 | Affiliate system |
| `delivery_boy.php` | 28 | Delivery boy API |
| `payment*.php` | 12+ | Payment gateway callbacks |
