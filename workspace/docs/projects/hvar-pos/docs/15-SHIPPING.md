# Shipping

> Hvar-POS integrates with two shipping carriers: **Turbo** (Egyptian courier)
> for the POS storefront, and **Bosta** (another Egyptian courier) via the ERP.

---

## Turbo Shipping (POS)

**File:** `app/Console/Commands/ShippingStatus.php`

### Order Tracking

Orders with a `shipping_barcode` are tracked via the Turbo API:

```php
$data = [
    "search_Key" => $order->shipping_barcode,
    'authentication_key' => env('TURBO_AUTHENTICATION_KEY'),
    'main_client_code' => env('TURBO_CLIENT_Code'),
];

$response = Http::post(env('TURBO_Order_Search'), $data);

if ($response['success'] == 1) {
    $order->turbo_status = $response['result']['status'];
    $order->save();
}
```

### Status Values

The `turbo_status` column stores Arabic status values from Turbo:
- `تم التسليم` (Delivered) — when this is reached, tracking stops
- Other values: pending, in-transit, etc. (Arabic from Turbo API)

### Cron

`php artisan shipping:status` polls the Turbo API for all orders with a barcode
that haven't been delivered yet.

---

## Bosta Shipping (ERP)

**File:** `app/Utils/BostaUtil.php` (1,480 lines, in the ERP)

Bosta is an Egyptian courier service. The integration lives in the ERP,
not the POS. When a POS order syncs to the ERP and `auto_bosta_for_website_orders`
is enabled, a Bosta shipment is automatically created.

### Bosta Shipment Types

```php
// Deliver          → 10
// Cash Collection  → 15
// Exchange         → 30
// Customer Return  → 25
```

### Bosta Tracking URL

```
https://bosta.co/ar-eg/tracking-shipments?shipment-number=24782834
```

### Auto-Bosta Flow (in OrderSyncService)

```
1. POS order arrives via webhook
2. Order created as draft in ERP
3. If auto_bosta is enabled:
   a. Parse shipping address
   b. Resolve governorate ID (cities table)
   c. Resolve district ID (districts table)
   d. Build Bosta payload with product descriptions
   e. POST to Bosta API
   f. Save tracking number
```

---

## Shipment Status Excel Import (ERP)

**File:** `app/Http/Controllers/UpdateShippingStatusController.php`

Allows bulk updating shipping statuses by uploading an Excel file:

```
POST / (Upload endpoint)
Format: .xlsx, .xls, .csv
```

The `ShippingImport` class processes the file and updates `shipping_status`
on transactions.

---

## Carrier System (POS)

The POS has a `carriers` table for defining shipping carriers:

```sql
carriers: id, name, logo, transit_time, free_shipping, Zip_codes, country, tax, status
carrier_ranges: id, carrier_id, billing_type, delimeter_1, delimeter_1, shelve_plan, shelve_plan
carrier_range_prices: id, carrier_range_id, price
```

Carriers can be assigned to orders and used for shipping cost calculation.

---

## Shipping Configuration Views

- `backend/setup_configurations/shipping_configuration/index.blade.php`
- `backend/setup_configurations/carriers/` (create, edit, index)
- `frontend/shipping_info.blade.php` — Checkout shipping form
