# ERP Integration — Full Reference

> The bridge between Hvar-POS (Active eCommerce) and Hvar-ERP (Ultimate POS).

---

## Architecture

```
POS (Active eCommerce)                    ERP (Ultimate POS)
──────────────────────                    ────────────────────

┌────────────────────┐                  ┌─────────────────────┐
│ Integration API    │◄──── HTTP ──────►│ Website Module      │
│ (passive: serves   │                  │ (active: pulls via  │
│  data on request)  │                  │  webhooks & syncs)  │
└────────────────────┘                  └─────────────────────┘
         ↕                                        ↕
┌────────────────────┐                  ┌─────────────────────┐
│ Cron: stock:cron   │──── pushes ─────►│ Endpoint:            │
│ (pushes POS stock  │                  │ update_stock_from_  │
│  to ERP endpoint)  │                  │ active               │
└────────────────────┘                  └─────────────────────┘
                                                  ↕
                                         ┌─────────────────────┐
                                         │ Cron: pos:stock     │
                                         │ (pushes ERP stock   │
                                         │  to POS)            │
                                         └─────────────────────┘
```

---

## POS Side: IntegrationController

**File:** `app/Http/Controllers/Api/V2/ERP/IntegrationController.php`

**Route prefix:** `/api/v2/erp_integration`

| Endpoint | Method | Returns | Purpose |
|----------|--------|---------|---------|
| `/all-categories` | GET | JSON array | Categories without translations |
| `/all-attributes` | GET | JSON with `attribute_values` | Product attributes + their values |
| `/all-brands` | GET | JSON array | All brands |
| `/all-products` | GET | JSON with relations | Products with category, brand, stocks, thumbnail |
| `/all-orders` | GET | JSON | Orders from last hour + their details + products + stocks |
| `/products-stocks` | GET | JSON | Stock for products ordered in last hour |
| `/update-product-stock` | POST | JSON | Update stock on POS side |

### GET /all-orders — Cleanup Logic

```php
$orders = Order::where('created_at', '>=', Carbon::now()->subHour())
    ->with(['user', 'orderDetails', 'orderDetails.product', 'orderDetails.product.stocks'])
    ->get();

// Cleanup: delete order details referencing non-existent products
foreach ($orders as $order) {
    foreach ($order->orderDetails as $orderDetails) {
        if (!in_array($orderDetails->product_id, $products)) {
            $orderDetails->delete();
        }
    }
    // If no details left, delete the whole order + combined order
    if ($order->orderDetails->count() == 0) {
        CombinedOrder::where('id', $order->combined_order_id)->delete();
        $order->delete();
    }
}
```

### POST /update-product-stock

**Request body:** JSON array of stock updates

```json
[
    {
        "website_product_id": 123,
        "qty_available": 50
    }
]
```

**Logic:** Updates `product_stocks.qty_available` where `product_id = website_product_id`

---

## POS Side: Events & Listeners

When orders change in the POS, events fire listeners that notify the ERP:

| Event | Listener | Trigger |
|-------|----------|---------|
| `OrderCreated` | `SendOrderToExternalAPI` | New order placed |
| `UpdateOrder` | `UpdateOrderApi` | Order modified |
| `DeleteOrder` | `DeleteOrderApi` | Order deleted |

These listeners make HTTP calls to the ERP's webhook endpoints.

---

## ERP Side: Website Module

**Base path:** `Modules/Website/`

### Key Files

| File | Purpose |
|------|---------|
| `Services/OrderSyncService.php` (750 lines) | Main order sync logic |
| `Services/ProductSyncService.php` | Product sync from ERP → POS |
| `Http/Controllers/WebsiteIntegrationController.php` | Webhook + sync endpoints |
| `Entities/WebsiteProduct.php` | Product mapping model |
| `Entities/WebsiteSyncLog.php` | Sync log |

### Webhook Endpoints

| Route | Method | Handler | Purpose |
|-------|--------|---------|---------|
| `/websiteintegration/webHooksyncOrdersGet` | POST | `OrderSyncService->syncOrders()` | Receive new POS order |
| `/websiteintegration/webHooksyncOrdersUpdate` | POST | Updates existing | Update POS order in ERP |
| `/websiteintegration/webHooksyncOrdersDelete` | POST | Removes order | Delete/cancel POS order |
| `/websiteintegration/syncOrdersGet` | GET | Manual sync | Pull orders from POS |
| `/websiteintegration/syncCategoriesGet` | GET | Manual sync | Pull categories from POS |

### Order Sync Service (orderSyncService)

**How it works:**

```
Receive order data array
    │
    ▼
For each order in data:
    │
    ├── Check if website_order_id already exists
    │   └── If exists → skip (prevent duplicates)
    │
    ├── Map products:
    │   ├── Find product by website_product_id
    │   └── Find variation by website_variation_id
    │
    ├── Resolve shipping address:
    │   ├── Parse Arabic governorate text → match cities.id
    │   ├── Parse Arabic district text → match districts.id
    │   └── Store in order_addresses JSON field
    │
    ├── Create Transaction:
    │   ├── type = 'sell'
    │   ├── status = 'draft'  (← NOT final!)
    │   ├── website_order_id = POS order ID
    │   ├── contact_id = resolved customer
    │   ├── location_id = from api settings
    │   └── invoice_no = generated draft number
    │
    ├── Create TransactionSellLines (order items)
    │
    ├── Create TransactionPayment (if payment data present)
    │
    └── Optional: Auto-create Bosta shipment
        └── If auto_bosta_for_website_orders is enabled
```

### Address Resolution (Arabic Text → DB IDs)

The OrderSyncService has sophisticated logic to match POS free-text address fields
to the ERP's structured city/district tables:

```
POS sends: "القاهرة, مصر الجديدة, شارع 15"
               │              │
               ▼              ▼
ERP matches: Cities.name   Districts.district_name
             (Arabic)      (Arabic, with zone prefix)
```

This handles:
- Arabic name variants
- Zone-with-district format (e.g., *"مدينة نصر — الحي السابع"*)
- Fallback to text if no match found

---

## ERP Side: Stock Sync Command

**File:** `app/Console/Commands/PosStock.php`

```
php artisan pos:stock
```

**Skipped on Friday** (Islamic weekend).

**Process:**
1. Get business's `website_api_settings` (contains location_id + API URL)
2. Batch products in groups of 10
3. For each product:
   - Single: check `website_product_id !== null`, get stock from `variation_location_details`
   - Variable: loop variations, check `website_variation_id !== null`
4. Build payload with `website_product_id`, `price`, `qty_available`
5. Dispatch `ProcessPosStock` job per product

---

## ERP Side: PosStock Job

**File:** `app/Jobs/ProcessPosStock.php`

```php
$sync_id = $productToSync['website_product_id'];
$website_product = WebsiteProduct::where('website_product_id', $sync_id)->first();

// Updates POS product stock via API
Http::post($website_api_url, [
    'product_id' => $sync_id,
    'qty' => $productToSync['qty_available'],
    'price' => $productToSync['price'],
]);
```

---

## Mapping Reference

### Product Mapping

```
POS (orders.product_id)          ERP (TransactionSellLines.product_id)
         │                                    │
         │    id_from_pos ────────────────────┤
         │         │                          │
         │         └── Product.id             │
         │               = ERP's product PK   │
         │                                    │
         └────────────────────────────────────┘
                       │
                 website_product_id
                 (when ERP pushes stock back)
```

```
ERP Product.website_product_id = POS Product.id_from_pos
                  ⇅
POS Product.id_from_pos = ERP Product.id
```

### Order Mapping

```
POS Order.id ──────────────────────────────────► ERP Transaction.website_order_id
                                                      (the link back to POS)
```

---

## API Settings (ERP Business Config)

Stored as JSON in `business.website_api_settings`:

```json
{
    "location_id": 1,
    "api_url": "https://pos.example.com",
    "api_key": "...",
    "auto_bosta_for_website_orders": true
}
```

---

## Data That Does NOT Sync

| Data | Why |
|------|-----|
| Customers | Each system manages contacts independently |
| Coupons / Flash Deals | POS marketing features not in ERP |
| Affiliate / Club Points | POS-specific loyalty features |
| Reviews | POS-specific |
| Delivery Boy assignments | POS-specific |
| Seller commission structures | POS multi-seller feature |
| ERP accounting entries | ERP-only |
| ERP HR/payroll data | Essentials module |
| ERP manufacturing BOM | Manufacturing module |
| ERP restaurant data | Restaurant module |
