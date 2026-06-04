# Origins — What POS and ERP Actually Are

## Hvar-POS: Active eCommerce CMS

**Upstream:** [Active eCommerce CMS](https://activeitzone.com/docs/active-ecommerce-cms/) by ActiveITzone

Confirmed by:
- Install view: `resources/views/installation/step5.blade.php` shows *"Active eCommerce CMS Settings"*
- Update view: `resources/views/update/step0.blade.php` shows *"Active eCommerce CMS Update Process"*
- Uses `mehedi-iitdu/core-component-repository` — the package used by Active eCommerce for admin components
- Footer: `© Hvar, Powered by Dokkan Agency 2024 v1.0.0 beta`

**What it is:** A multi-seller e-commerce CMS with:
- Admin panel + seller panel
- POS terminal feature
- Blog, coupons, flash deals, affiliate system
- 20+ payment gateways
- Multi-language, RTL support
- Flutter mobile app API (V2)

## Hvar-ERP: Ultimate POS

**Upstream:** [Ultimate POS](https://ultimatefosters.com/) by Ultimate Fosters (ultimatefosters.com)

Confirmed by:
- Install views reference `ultimatefosters.com` for license keys and docs
- `.env` has `APP_NAME="Ultimate POS"` and `ENVATO_PURCHASE_CODE=`
- Uses `nwidart/laravel-modules` for modular architecture
- Uses Laravel Passport for API auth (not Sanctum like the POS)

**What it is:** A full business management system:
- POS + inventory management
- Purchases, sales, stock transfers
- Full accounting ledger (auto-maps every transaction)
- HR/Payroll (Essentials module)
- CRM with proposals, campaigns, call logs
- Manufacturing with BOM/recipes
- Restaurant with table booking
- WooCommerce sync
- Website integration module (the bridge to Hvar-POS)

## Version History

### POS

```
188bcd3 Initial commit (base Active eCommerce)
78ed00b chore: ignore server-only paths
cd42284 chore: ignore junk paths
9414ed1 feat: city dropdown cascade, JSON responses, checkout UX
b9cd1d0 security: SQL injection, XSS, file upload hardening
7dce2e8 chore: untrack uploaded images
9a8b689 🐺 docs: add CONTRIBUTING.md for Hvar ecosystem
5bd74c1 docs: remove wolf signature, enforce Kariem Seiam voice
```

### ERP

```
a2ae0b4 feat: initial commit (base Ultimate POS)
5dae3e4 feat: auto-Bosta integration, shipping address, order sync improvements
0e2b86c chore: untrack assets, fix .gitignore
d09c543 security: XSS in receipt templates and transaction notes
67caec0 🐺 fix: shipping status fallback + bill code validation
56054e1 🐺 fix: dashboard returns, Bosta gap indicator
c2d0746 remove pay term from sell form and overdue filter
3d98786 🐺 fix: disable getPaymentStatus overdue conversion
c0c83b7 🐺 fix: opening balance ledger with correct dates
```

## Custom Hvar-Only Files (not in upstream)

### POS (not in Active eCommerce)
- `app/Http/Controllers/Api/V2/ERP/IntegrationController.php`
- `app/Http/Controllers/Payment/KashierController.php`
- `app/Console/Commands/StockCron.php`
- `app/Console/Commands/ShippingStatus.php`
- `app/Console/Commands/OrderCancelled.php`
- `app/Events/DeleteOrder.php`
- `app/Events/OrderCreated.php`
- `app/Events/UpdateOrder.php`
- `app/Listeners/DeleteOrderApi.php`
- `app/Listeners/SendOrderToExternalAPI.php`
- `app/Listeners/UpdateOrderApi.php`
- `app/Services/OrderService.php`
- `resources/views/backend/newblades/`

### ERP (not in Ultimate POS)
- `app/Utils/BostaUtil.php` (1,480 lines)
- `app/Http/Controllers/2SellController.php` (2,297 lines — extended SellController)
- `Modules/Website/Services/OrderSyncService.php` (750 lines)
- `Modules/Website/Services/ProductSyncService.php`
- `app/Http/Controllers/UpdateShippingStatusController.php`
- `app/Http/Controllers/ShippingStatusSheetUpdate/InprogressSheetController.php`
- `app/Imports/ShippingImport.php`
- `docs/stock-report-deep-audit.md` (877 lines)
