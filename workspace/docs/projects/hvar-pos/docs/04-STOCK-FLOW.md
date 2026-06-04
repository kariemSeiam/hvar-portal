# Stock Flow — POS ↔ ERP

> **This is the most critical data flow in the system.** Understanding stock correctly is essential
> because the POS and ERP have **two independent stock tables** that sync bidirectionally.

---

## Two Stock Systems

### POS Stock Table: `product_stocks`

**File:** `app/Models/ProductStock.php`

```php
protected $fillable = ['product_id', 'variant', 'sku', 'price', 'qty', 'image', 'wholesale_price', 'suits'];
```

- The POS tracks stock in a **single `qty` column** per product/variant
- Simple, flat, no location awareness
- Tied to the e-commerce storefront — when a customer buys, `qty` decreases
- When stock runs out, products are hidden (scope `InStock()`)

### ERP Stock Table: `variation_location_details`

**File:** `app/VariationLocationDetails.php`

```php
protected $guarded = ['id'];
```

- The ERP tracks stock **per variation per location** (`variation_id` + `location_id`)
- Uses `qty_available` column
- Multi-warehouse capable — each business location has its own stock count
- Products must have `enable_stock = 1` for stock tracking

---

## The Stock Problem

Because they're **two independent databases** with different table structures, stock must sync:

```
┌─────────────┐                    ┌──────────────────────┐
│ POS Stock   │                    │ ERP Stock            │
│ product_stocks.qty  ◄───────►   │ variation_location_details.qty_available │
└─────────────┘                    └──────────────────────┘
         │                                  │
         │  Direction 1: POS → ERP          │
         │  php artisan stock:cron          │
         │                                  │
         │  Direction 2: ERP → POS          │
         │  php artisan pos:stock           │
         │  (runs daily, skips Friday)      │
```

---

## Direction 1: POS → ERP (`StockCron`)

**File:** `app/Console/Commands/StockCron.php`

```php
protected $signature = 'stock:cron';

public function handle()
{
    $product = Product::whereNotNull('id_from_pos')
        ->select('id_from_pos', 'id')->get();

    foreach ($product as $product) {
        $stock = ProductStock::where('product_id', $product->id)->first();
        $qty = $stock->qty;

        $response = Http::withoutVerifying()->post(
            'https://pos.elamriaa.com/api/products/update_stock_from_active',
            [
                'product_id' => $product->id_from_pos,
                'qty' => $qty
            ]
        );
    }
}
```

**Flow:**
1. Finds all products that have `id_from_pos` (meaning they're mapped to an ERP product)
2. Gets the current `qty` from `product_stocks`
3. Pushes it to the ERP endpoint: `POST /api/products/update_stock_from_active`
4. The ERP endpoint (`IntegrationController.storeProductStock`) updates `product_stocks.qty_available`

**What it syncs:** Only products with `id_from_pos !== null`

---

## Direction 2: ERP → POS (`pos:stock`)

**File:** `app/Console/Commands/PosStock.php`

```php
protected $signature = 'pos:stock';  // Runs every day except Friday
```

**Flow:**
1. Gets the business and location settings from `website_api_settings`
2. Loops through all products in batches of 10
3. For **single** products: checks if `website_product_id !== null`, gets stock from `variation_location_details`
4. For **variable** products: loops through each variation, checks `website_variation_id !== null`
5. Dispatches `ProcessPosStock` jobs (one per product chunk)
6. `ProcessPosStock` job sends the data to the `website_product_id` endpoint on the POS

**What it syncs:** stock + price (`qty_available`, `sell_price_inc_tax`)

**Mapping:**
```
ERP Product: website_product_id  ────→  POS Product: id_from_pos
ERP Variation: website_variation_id  ──→  POS ProductStock: (via product_id)
```

---

## What Happens When a Client Places an Order

### In the POS (storefront checkout)

**File:** `CheckoutController.php` → `checkout()` method

```
1. Customer selects products → Cart
2. Checkout: shipping info → delivery info → payment
3. CombinedOrder + Order records created
4. Payment processed (Kashier, PayPal, COD, etc.)
5. OrderController@store saves the order
```

**Stock impact in POS:**
- POS does **NOT** decrease stock at checkout time
- Stock is only decreased in the **POS terminal** (`PosController@order_store`):

```php
if ($cartItem['quantity'] > $product_stock->qty) {
    $order->delete();
    return array('success' => 0, 'message' => 'Stock outs.');
} else {
    $product_stock->qty -= $cartItem['quantity'];  // ← STOCK DECREASED HERE
    $product_stock->save();
}
```

### In the ERP (when orders sync from POS)

**File:** `Modules/Website/Services/OrderSyncService.php`

```
1. POS order becomes available via Integration API
2. ERP Website Module pulls it (webhook or manual sync)
3. Creates a Transaction with status = 'draft' in ERP
4. Stock is NOT decreased yet — draft status means pending
5. User reviews the draft in SellController
6. When draft is converted to 'final', stock decreases:
   SellPosController@store → productUtil.decreaseProductQuantity()
```

**The Draft system is the bridge:**
```
POS Order ──sync──► ERP Draft (Transaction.status = 'draft')
                        │
                        ▼
              Admin reviews draft
                        │
                        ▼
              Draft → Final (status = 'final')
                        │
                        ▼
              Stock deducted from variation_location_details
                        │
                        ▼
              Accounting auto-mapped (SellCreatedOrModified event)
```

---

## The Full Order-to-Stock Cycle (end to end)

```
┌──────────────┐
│ Customer     │
│ places order │
│ on POS       │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────────┐
│ POS: Order   │     │ POS: Stock       │
│ created      │     │ NOT decreased    │
│ (storefront) │     │ (e-commerce)     │
└──────┬───────┘     └──────────────────┘
       │
       ▼
┌──────────────┐
│ ERP: Webhook │
│ syncs order  │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────────┐
│ ERP: Draft   │     │ Stock NOT        │
│ created      │     │ decreased        │
│ (status=draft)│     │ (draft)          │
└──────┬───────┘     └──────────────────┘
       │
       ▼
┌──────────────┐
│ Admin views  │
│ draft, adds  │
│ shipping,    │
│ confirms     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────────────────┐
│ ERP: Final   │     │ ERP: Stock decreased     │
│ sell created │────►│ variation_location_details│
│ (status=final)│    │ .qty_available -= qty     │
└──────┬───────┘     └──────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────────────────┐
│ POS: Stock   │◄────│ ERP: pos:stock cron      │
│ updated      │     │ pushes stock back to POS │
└──────────────┘     └──────────────────────────┘
```

**Total sync delay:** Depends on cron schedule. POS stock → ERP happens via `stock:cron` (manual/poorly scheduled).
ERP stock → POS happens via `pos:stock` (daily, except Friday).

---

## The Order Cancellation Stock Flow

**File:** `app/Console/Commands/OrderCancelled.php`

```
POS orders with payment_status = 'unpaid' AND created > 1 hour ago are auto-cancelled:
  1. Order and OrderDetails are DELETED (not just status change)
  2. Stock is RESTOCKED: product_stock.qty += orderDetail.quantity
  3. Only applies to non-COD orders (COD = cash on delivery is kept)
```

⚠️ **Important:** This is destructive — orders are hard-deleted, not soft-deleted.
This means the ERP will never see these orders since they're gone before the webhook fires.

---

## The `id_from_pos` / `website_product_id` Mapping

### POS side (`Product` model)

The POS product table has an `id_from_pos` column — this stores the **ERP's product ID**.

**ProductController.php — custom methods for ERP sync:**

| Method | Purpose |
|--------|---------|
| `product_store_from_pos($productData)` | Creates product on POS, stores `id_from_pos` |
| `update_from_pos($productData)` | Updates product by `id_from_pos` |
| `update_status_from_pos()` | Activate/deactivate by `id_from_pos` |
| `delete_from_pos()` | Delete by `id_from_pos` |

### ERP side (`Product` model)

The ERP product table has a `website_product_id` column — this stores the **POS's product ID**.

**Single products:** `Product.website_product_id` maps directly
**Variable products:** Each `Variation.website_variation_id` maps to a POS product/variant

---

## The Two-Engine Stock Problem

Because both systems track stock independently, **drift is inevitable**:

1. POS sells a product → POS stock decreases
2. ERP has NOT received the sync yet → ERP stock still shows old count
3. If someone fulfills from the ERP stock count, they'll oversell
4. Eventually cron syncs, but there's always a window

**Mitigations:**
- ERP creates POS orders as **drafts** (stock not decreased until manual confirmation)
- But the POS already decreased stock at terminal sale time (Not at storefront checkout though — only POS terminal)

**Best practice:** The ERP should be the **source of truth** for stock. The POS `id_from_pos` sync should be one-way (ERP → POS) to avoid drift.
