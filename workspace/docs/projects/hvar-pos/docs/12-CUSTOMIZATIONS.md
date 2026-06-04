# Hvar Customizations

> All modifications made to the base Active eCommerce CMS and Ultimate POS systems,
> organized by commit and purpose.

---

## 🐺 Commit Convention

Hvar uses conventional commits with a **wolf emoji** prefix for custom work:

```
🐺 fix: shipping status fallback + bill code validation
🐺 docs: add CONTRIBUTING.md for Hvar ecosystem
```

See `CONTRIBUTING.md` in the repo root for full standards:
- Branch strategy: `main` vs `dev`
- Conventional commits with 🐺
- PSR-2 (PHP), PEP-8 (Python), ESLint (JS)
- PR process and security guidelines

---

## POS Customizations

### 1. ERP Integration Layer

**Files added:**
- `app/Http/Controllers/Api/V2/ERP/IntegrationController.php`
- `app/Console/Commands/StockCron.php`
- `app/Events/OrderCreated.php`, `DeleteOrder.php`, `UpdateOrder.php`
- `app/Listeners/SendOrderToExternalAPI.php`, `DeleteOrderApi.php`, `UpdateOrderApi.php`

**What it does:** Bridges POS and ERP via REST API + events.

### 2. Kashier Payment Gateway

**Files added:**
- `app/Http/Controllers/Payment/KashierController.php`
- `public/assets/img/cards/kashier.png`

**What it does:** Egyptian payment gateway with card, wallet, and installment support.

### 3. City Dropdown Cascade (9414ed1)

**Files modified:** 7 files

**What it does:** Replaces manual text input for city with a dynamic dropdown
(state → city AJAX cascade) in checkout and POS shipping forms.

### 4. Security Hardening (b9cd1d0)

**Scope:**
- SQL injection: parameterized raw queries in `SearchController`, `BlogController`, `AffiliateController`
- XSS: `strip_tags` on user content in support ticket views
- File upload: extension allowlists, dangerous type blocking, path traversal prevention
- `.htaccess` in `public/uploads/` blocks PHP execution
- Session `same_site=lax` for CSRF
- Cloudflare `TrustProxies` configuration
- Dangerous demo routes commented out

### 5. Cron Jobs

**Files added:**
- `app/Console/Commands/StockCron.php` — Push POS stock to ERP
- `app/Console/Commands/OrderCancelled.php` — Auto-cancel unpaid orders
- `app/Console/Commands/ShippingStatus.php` — Track Turbo shipping status

### 6. Custom Views

**Directory:** `resources/views/backend/newblades/`
- `pagesview.blade.php`
- `showproduct.blade.php`

### 7. Services

**Files added:**
- `app/Services/OrderService.php`
- `app/Services/ProductFlashDealService.php`
- `app/Services/ProductService.php`
- `app/Services/ProductStockService.php`
- `app/Services/ProductTaxService.php`

---

## ERP Customizations

### 1. Bosta Egyptian Shipping Integration

**Files added/modified:**
- `app/Utils/BostaUtil.php` (1,480 lines)
- `Modules/Website/Services/OrderSyncService.php` (750 lines — Bosta integration)

**What it does:** Auto-creates Bosta shipments when POS orders sync to ERP.
Handles Arabic address parsing, governorate/district ID resolution,
product descriptions in Bosta payload.

### 2. Website Module — Order Sync

**Files added:**
- `Modules/Website/Services/OrderSyncService.php`
- `Modules/Website/Services/ProductSyncService.php`
- `Modules/Website/Http/Controllers/WebsiteIntegrationController.php`

**What it does:** Full sync layer — webhooks for order receive/update/delete,
manual sync for orders and categories, product mapping.

### 3. Shipping Status Sheet Import

**Files added:**
- `app/Http/Controllers/UpdateShippingStatusController.php`
- `app/Http/Controllers/ShippingStatusSheetUpdate/InprogressSheetController.php`
- `app/Imports/ShippingImport.php`

**What it does:** Excel upload for bulk shipping status updates.

### 4. 2SellController

**File:** `app/Http/Controllers/2SellController.php` (2,297 lines)

**What it is:** A copy of `SellController` with `class SellController` inside a file named `2SellController.php`.
Likely an A/B test or backup of modified SellController.

### 5. Bug Fixes

| Commit | Fix |
|--------|-----|
| `67caec0` | Shipping status fallback when DB has non-standard values |
| `56054e1` | Dashboard returns showing gross instead of net |
| `c2d0746` | Remove pay terms from sell form causing overdue filter issues |
| `3d98786` | Disable `getPaymentStatus` overdue auto-conversion |
| `c0c83b7` | Opening balance ledger showing individual entries with correct dates |

### 6. Security Fixes

| Commit | Fix |
|--------|-----|
| `d09c543` | XSS in receipt templates and transaction notes |

### 7. Documentation

**File:** `docs/stock-report-deep-audit.md` (877 lines)

A full data-cycle audit of the stock report tracing:
```
Route → Controller → Util → SQL → View → JS → Widget
```

Includes:
- Two-engine problem analysis (POS stock vs ERP stock)
- Zero-value root cause analysis
- Dead code and bug documentation
- Key statistics
