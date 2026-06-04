# Cron Jobs & Scheduler

> Three cron jobs manage automated operations in the POS.

---

## 1. Stock Sync: `stock:cron`

**File:** `app/Console/Commands/StockCron.php`

**Command:** `php artisan stock:cron`

**Purpose:** Push POS product stock levels to the ERP.

**Logic:**
```php
$product = Product::whereNotNull('id_from_pos')->get();

foreach ($product as $p) {
    $stock = ProductStock::where('product_id', $p->id)->first();
    Http::post('https://pos.elamriaa.com/api/products/update_stock_from_active', [
        'product_id' => $p->id_from_pos,
        'qty' => $stock->qty
    ]);
}
```

**Only syncs products that have `id_from_pos` set** (meaning they're mapped to an ERP product).

---

## 2. Order Cancel: `order:cancel`

**File:** `app/Console/Commands/OrderCancelled.php`

**Command:** `php artisan order:cancel`

**Purpose:** Auto-cancel unpaid, non-COD orders older than 1 hour.

**Logic:**
```php
$Orders = Order::where('delivery_status', 'unpaid')
    ->where('created_at', '<=', Carbon::now()->subHour())
    ->where('payment_type', '!=', 'cash_on_delivery')
    ->get();

foreach ($Orders as $Order) {
    $Order->delete();  // HARD DELETE
    foreach ($Order->orderDetails as $detail) {
        $detail->delete();  // HARD DELETE
        
        // Restock
        $product_stock = ProductStock::where('product_id', $detail->product_id)
            ->where('variant', $variant)
            ->first();
        if ($product_stock != null) {
            $product_stock->qty += $detail->quantity;
            $product_stock->save();
        }
    }
}
```

**⚠️ This is destructive** — orders and details are hard-deleted, not soft-deleted.

---

## 3. Shipping Status: `shipping:status`

**File:** `app/Console/Commands/ShippingStatus.php`

**Command:** `php artisan shipping:status`

**Purpose:** Poll Turbo shipping API for delivery status updates.

**Logic:**
```php
$orders = Order::whereNotNull('shipping_barcode')
    ->where(function($query) {
        $query->whereNull('turbo_status')
              ->orWhere('turbo_status', '!=', 'تم التسليم');
    })
    ->get();

foreach ($orders as $order) {
    $response = Http::post(env('TURBO_Order_Search'), [
        'search_Key' => $order->shipping_barcode,
        'authentication_key' => env('TURBO_AUTHENTICATION_KEY'),
        'main_client_code' => env('TURBO_CLIENT_Code'),
    ]);
    
    if ($response['success'] == 1) {
        $order->turbo_status = $response['result']['status'];
        $order->save();
    }
}
```

**Config needed in `.env`:**
```
TURBO_AUTHENTICATION_KEY=
TURBO_CLIENT_Code=
TURBO_Order_Search=
```

---

## Kernel Configuration

**File:** `app/Console/Kernel.php`

The cron jobs need to be registered in the Kernel's `$commands` array and scheduled:

```php
protected $commands = [
    Commands\StockCron::class,
    Commands\OrderCancelled::class,
    Commands\ShippingStatus::class,
];

protected function schedule(Schedule $schedule)
{
    // These need to be defined for automation
    // $schedule->command('stock:cron')->everyMinute();
    // $schedule->command('order:cancel')->everyMinute();
    // $schedule->command('shipping:status')->hourly();
}
```

---

## ERP Cron Jobs (for context)

The ERP has its own stock sync:

| Command | Schedule | Purpose |
|---------|----------|---------|
| `php artisan pos:stock` | Daily (except Friday) | Push ERP stock levels to POS |
