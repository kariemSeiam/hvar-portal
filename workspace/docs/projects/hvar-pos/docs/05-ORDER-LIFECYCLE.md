# Order Lifecycle

> How an order travels from the customer's cart to a fulfilled shipment,
> including every state, status, and sync between POS and ERP.

---

## Two Separate Order Systems

The POS and ERP have **completely separate order tables** with different structures:

| Aspect | POS Order | ERP Transaction (sell) |
|--------|-----------|----------------------|
| Table | `orders` | `transactions` |
| Type column | — | `type = 'sell'` |
| Status column | `delivery_status` + `payment_status` | `status` + `sub_status` + `shipping_status` + `payment_status` |
| Key field | `id` (auto) | `website_order_id` (links to POS order) |
| Items table | `order_details` | `transaction_sell_lines` |
| Payments table | (part of order) | `transaction_payments` |

---

## Order States in the POS

### Delivery Statuses

The `orders.delivery_status` column tracks fulfillment progress:

```
pending → confirmed → picked_up → on_the_way → delivered
                                                     │
                                          ┌──────────┴──────────┐
                                          ▼                     ▼
                                     payment_status =     shipped + delivered
                                     'paid'
```

Also: `cancelled` (when order is deleted by cron)

### Payment Statuses

The `orders.payment_status` column:
- `unpaid` — default when COD or offline payment
- `paid` — when payment confirmed (Kashier, PayPal, Stripe, etc.)

---

## Order Flow: Storefront (Web Checkout)

```
┌──────────┐
│ Cart     │
└────┬─────┘
     │
     ▼
┌──────────────┐
│ Shipping     │
│ Info         │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Delivery     │
│ Info         │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Payment      │
│ Selection    │
└────┬─────────┘
     │
     ├──→ Kashier → redirect → callback → OrderController@store
     ├──→ PayPal  → redirect → callback → OrderController@store
     ├──→ COD     → immediate → OrderController@store
     └──→ Wallet  → immediate → OrderController@store
```

**Key files in the flow:**

| Step | File | Method |
|------|------|--------|
| Cart management | `CartController.php` / API V2 | add, changeQuantity, getList |
| Shipping info | `CheckoutController.php` | `get_shipping_info`, `store_shipping_info` |
| Delivery info | `CheckoutController.php` | `store_delivery_info` |
| Payment & order creation | `CheckoutController.php` | `checkout()` |
| Order storage | `OrderController.php` | `store()` |

---

## Order Creation (CheckoutController@checkout)

**File:** `app/Http/Controllers/CheckoutController.php`

```php
public function checkout(CheckoutRequest $request)
{
    // 1. Check minimum order amount
    // 2. Check payment_option:
    //    - Kashier → redirect to KashierController@initiatePayment
    //    - Other gateways → process immediately
    // 3. Create CombinedOrder
    // 4. For each cart: create Order with:
    //    - order.code = date('Ymd-His').rand(10,99)
    //    - order.payment_type = $request->payment_option
    //    - order.payment_status = 'unpaid' | 'paid'
    // 5. Redirect to order_confirmed
}
```

---

## Order Flow: POS Terminal

**File:** `app/Http/Controllers/PosController.php`

```
┌──────────────┐
│ Search       │
│ products     │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Add to cart  │
│ (session)    │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Set:         │
│ - discount   │
│ - shipping   │
│ - customer   │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Set shipping │
│ address      │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Order        │
│ Summary      │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ order_store  │
│ → Stock      │
│   deducted   │
│ → Email      │
│   invoice    │
│ → Session    │
│   cleared    │
└──────────────┘
```

**Key difference from storefront:** In the POS terminal, stock IS deducted immediately
at order placement (see `PosController@order_store`).

---

## Order Flow: Mobile App (API V2)

**File:** `app/Http/Controllers/Api/V2/OrderController.php`

```
Authentication required (Sanctum)
    │
    ▼
POST /api/v2/order/store
    │
    ├── Cart items converted to OrderDetails
    ├── CombinedOrder + Order created
    └── Returns order details
```

Supporting endpoints:
```
GET  /api/v2/purchase-history         → list user orders
GET  /api/v2/purchase-history-details → single order details
GET  /api/v2/purchase-history-items   → order line items
POST /api/v2/payments/pay/cod         → COD payment
POST /api/v2/payments/pay/wallet      → Wallet payment
```

---

## Order Sync: POS → ERP

The integration controller exposes POS orders to the ERP:

```
GET /api/v2/erp_integration/all-orders
```

Returns orders created in the last hour, with:
- Order details (user, products, quantities, prices)
- Product stock info
- **Cleans up orphaned orders** — if a product referenced by an order was deleted,
  the order detail is also deleted. If all details are gone, the combined order is deleted too.

### ERP Side: Webhook Sync

The ERP Website module has 3 webhook endpoints:

```php
POST /websiteintegration/WebHooksyncOrdersGet     → Receive new order
POST /websiteintegration/WebHooksyncOrdersUpdate   → Update existing order
POST /websiteintegration/WebHooksyncOrdersDelete   → Delete/cancel order
```

The `OrderSyncService` (750 lines) handles:
1. Checks if order already exists (by `website_order_id`)
2. Creates Transaction with `status = 'draft'`
3. Resolves shipping addresses (Arabic text → DB city/district IDs)
4. Optionally creates Bosta shipment (if auto-Bosta is enabled)
5. Maps products by `website_product_id`/`website_variation_id`
6. Saves shipping details as JSON in `order_addresses` field

---

## Order Flow: ERP Draft → Final

```
┌────────────────────┐
│ ERP Transaction    │
│ status = 'draft'   │
│ website_order_id = │
│   POS order ID     │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Admin views draft  │
│ in SellController  │
│ (drafts list)      │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Admin processes:   │
│ - Edits items/qty  │
│ - Sets shipping    │
│ - Sets location    │
│ - Confirms payment │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ status = 'final'   │
│                    │
│ → Stock deducted   │
│ → Event fired:     │
│   SellCreatedOrModified │
│ → Accounting auto- │
│   mapped           │
│ → Invoice generated│
└────────────────────┘
```

---

## Order Cancellation

### POS-side: Cron job

**File:** `app/Console/Commands/OrderCancelled.php`

Runs via: `php artisan order:cancel`

```
Criteria:
- payment_status = 'unpaid'
- NOT cash_on_delivery
- created > 1 hour ago

Action:
- Order HARD DELETED
- OrderDetails HARD DELETED
- Stock restocked: product_stock.qty += orderDetail.quantity
```

### ERP-side: Via delete webhook

```php
POST /websiteintegration/WebHooksyncOrdersDelete
```

When POS sends a delete notification, the ERP removes the corresponding Transaction.

---

## Email Notifications

On order placement, the system sends emails:

```php
// To customer
Mail::to($shipping_info['email'])->queue(new InvoiceEmailManager($array));

// To admin
Mail::to(User::where('user_type', 'admin')->first()->email)
    ->queue(new InvoiceEmailManager($array));

// To each seller (for multi-seller orders)
foreach($seller_products as $key => $seller_product){
    Mail::to(User::find($key)->email)->queue(new InvoiceEmailManager($array));
}
```

Template: `resources/views/emails/invoice.blade.php`

---

## Shipping Integration

**File:** `app/Console/Commands/ShippingStatus.php`

Runs via: `php artisan shipping:status`

```
For all orders with shipping_barcode NOT null
AND turbo_status != 'تم التسليم' (Delivered):

1. POST to Turbo API with order barcode + auth keys
2. If API returns success=1, update order.turbo_status
3. Orders remain in the list until delivered
```

The ERP also has a **Bosta** integration (Egyptian courier) that auto-creates shipments:
- Triggered when a draft is converted to final with `bosta_order = 1`
- Creates shipment via Bosta API
- Tracks shipping status

Additionally, there's an Excel-based shipping status update system:
- `UpdateShippingStatusController@upload` — upload `.xlsx/.xls/.csv` file
- Bulk updates shipping statuses via import
