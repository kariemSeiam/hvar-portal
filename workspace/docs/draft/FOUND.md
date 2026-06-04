# What We Found — POS Codebase Analysis

> **Action:** Your Hvar-POS Laravel backend is the core of hvarstore.com operations.
> We extracted what fills the research gaps.

## Gaps Filled ✅

| Gap | What We Found | Source |
|-----|--------------|--------|
| #1 Brand design tokens | Default `#d43533` (deep red) / hover `#9d1b1a` / CSS vars `--primary`, `--hov-primary`, `--soft-primary` | `pos-clone/app.blade.php` |
| #2 Dukan API/export capabilities | Website module with 3 webhooks + 4 manual syncs: syncOrdersGet, syncCategoriesGet, syncProductsGet, syncAttributesGet | `live/Modules/Website/Routes/web.php` |
| #3 Real order data structure | `Transaction` model — `website_order_id`, `type='sell'`, `status='draft'`, `payment_status`, shipping payload with city/district resolution via `buildTransactionShippingPayload()` | `live/app/Transaction.php`, `OrderSyncService.php` |
| #4 Brand color | `#d43533` (deep red) — close to Catalog/OLD but NOT matching our existing design tokens | `pos-clone/app.blade.php` CSS vars |
| #5 Fonts | IBM Plex Sans Arabic + Montserrat Arabic (WebFont) + Amiri | `pos-clone/app.blade.php` |
| #6 Analytics/tracking | TikTok Pixel + Microsoft Clarity | `pos-clone/app.blade.php` |

## Data Flow — How hvarstore.com Works

```
hvarstore.com (Dukan / pos-clone)
        │
        │ Order placed by customer
        ▼
   Website API (webhook)
        │
        ├── POST /WebHooksyncOrdersGet   → OrderSyncService.syncOrders()
        ├── POST /WebHooksyncOrdersUpdate → OrderSyncService.updateOrders()
        └── POST /WebHooksyncOrdersDelete → OrderSyncService.deleteOrders()
        │
        ▼
   Ultimate POS Database (hvar_erp)
   ┌──────────────────────────────────────┐
   │ transactions (type='sell')           │
   │   website_order_id (Dukan order ID)  │
   │   shipping_state → governorate ID    │
   │   shipping_city → district ID        │
   │   shipping_address → street          │
   │   auto_bosta → Bosta API shipment    │
   │ transaction_sell_lines (line items) │
   │ transaction_payments (COD/card)      │
   │ contacts (customers)                 │
   └──────────────────────────────────────┘
        │
        ▼
   Bosta API (delivery tracking)
   bill_code → trackingNumber
   shipping_status → "Pickup requested"
```

## Architecture — Two Systems

```
┌───────────────────────────────┐     ┌──────────────────────────────┐
│    pos-clone (E-commerce)     │     │    live (Ultimate POS)       │
│                               │     │                              │
│   Dukan/6valley platform      │     │   Admin dashboard + POS      │
│   Customer-facing storefront  │◄───►│   Order management           │
│   RTL Bootstrap theme         │     │   Inventory / Stock          │
│   TikTok + Clarity tracking   │     │   Accounting                 │
│   Product catalog display     │     │   Customer management        │
│                               │     │   Bosta shipping integration │
│   DB: hvar_erp (shared)       │     │   DB: hvar_erp (shared)      │
└───────────────────────────────┘     └──────────────────────────────┘
                                            │
                                      ┌─────┴──────┐
                                      │ Website    │
                                      │ Module     │
                                      │ (sync glue)│
                                      └────────────┘
```

## What REMAINS Missing

| Gap | Why | How to Fill |
|-----|-----|-------------|
| Actual live base_color in DB | Default is #d43533 but store could differ via get_setting() | Check DB `settings` table manually |
| HVAR logo SVG/PNG | Not in assets under that name | Screenshot hvarstore.com or extract from Dukan admin |
| Real product catalog from DB | Product/SKU list with prices | Run SQL query or check admin panel |
| Live CSS customizations | The aiz-core.css may be customized | Fetch live site's compiled CSS |
| WhatsApp integration code | Not obvious in the codebase | Search for WhatsApp API integration |
| ValU/Souhoola/Aman payment modules | Installment gateways | Check payment controller classes |
