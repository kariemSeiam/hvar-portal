# ERP Contract — What the ERP Expects

> The ERP is the authority. These are its rules. Break them and the operations team flies blind.

---

## Principle

The ERP does not care about your system's internal architecture. It cares about one thing:
**receiving correctly-formatted data through well-defined endpoints, and having its database
written to with the right field values.**

Every integration decision should start with "what does the ERP expect here?"

---

## 1. Order Webhook Contract (Storefront → ERP)

### Endpoint
```
POST /websiteintegration/webHooksyncOrdersGet
```

### When to Call
Immediately after a storefront order is created (customer placed order + payment confirmed or COD accepted).

### Payload Structure

The ERP's `OrderSyncService` expects this structure in the webhook body:

```json
{
  "orders": [
    {
      "id": 1234,
      "code": "20240601-143022-87",
      "user": {
        "id": 56,
        "name": "أحمد محمد",
        "email": "ahmed@example.com",
        "phone": "01012345678"
      },
      "payment_type": "kashier_card",
      "payment_status": "paid",
      "grand_total": 1250.00,
      "delivery_status": "pending",
      "shipping_address": {
        "name": "أحمد محمد",
        "phone": "01012345678",
        "address": "شارع 15 مايو",
        "city": "مدينة نصر",
        "state": "القاهرة",
        "country": "Egypt"
      },
      "order_details": [
        {
          "product_id": 88,
          "variation": "أحمر - L",
          "price": 625.00,
          "tax": 0,
          "shipping_cost": 0,
          "quantity": 2
        }
      ]
    }
  ]
}
```

### What the ERP Does With This

```
OrderSyncService.syncOrders(payload)
  │
  ├── Check: does transaction with website_order_id already exist?
  │   YES → skip (idempotent — safe to call twice)
  │   NO  → continue
  │
  ├── Resolve customer: find contact by phone in contacts table
  │   NOT FOUND → create new contact record
  │
  ├── Resolve products: find by website_product_id in products table
  │   NOT FOUND → log warning, skip line item
  │
  ├── Resolve shipping address:
  │   shipping_address.state → match to cities.name (Arabic governorate)
  │   shipping_address.city  → match to districts.district_name (Arabic district)
  │
  ├── Create transactions record:
  │   type = 'sell'
  │   status = 'draft'           ← IMPORTANT: always draft, MCRM confirms later
  │   website_order_id = order.id
  │   contact_id = resolved customer
  │   final_total = grand_total
  │   payment_status = paid/unpaid based on payment_status
  │   shipping_state = resolved city ID (governorate)
  │   shipping_city = resolved district ID
  │
  ├── Create transaction_sell_lines (one per order_detail)
  ├── Create transaction_payments (if paid)
  │
  └── If auto_bosta_for_website_orders = true:
      → Auto-create Bosta shipment
      → Save bill_code to transaction
```

### Critical Rules

- **Phone format:** `01XXXXXXXXX` (10 digits, no country code, no spaces)
  - ERP's address resolution uses this to match `contacts.mobile`
- **State field = governorate name in Arabic** — e.g. `"القاهرة"` not `"Cairo"`
- **City field = district/city within governorate in Arabic** — e.g. `"مدينة نصر"` not `"Nasr City"`
- **product_id in order_details** should map to `products.website_product_id` in the ERP
  - If the new system uses ERP product IDs directly, send `product_id` = ERP `products.id`

---

## 2. Order Update Webhook

```
POST /websiteintegration/webHooksyncOrdersUpdate
```

**When:** Order is modified (address correction, quantity change) before ERP confirms.
**Payload:** Same structure as creation webhook.
**ERP behavior:** Updates the existing draft transaction identified by `website_order_id`.

---

## 3. Order Delete Webhook

```
POST /websiteintegration/webHooksyncOrdersDelete
```

**When:** Order is cancelled by the customer or system.
**Payload:**
```json
{
  "order_id": 1234
}
```
**ERP behavior:** Removes the draft transaction with `website_order_id = 1234`.

**⚠ NEVER hard-delete a storefront order before firing this webhook.** The ERP draft will
remain open as a ghost transaction, cluttering the MCRM queue indefinitely.

---

## 4. POS Direct Write Contract

The POS terminal bypasses webhooks entirely — it writes directly to `hvar_erp` MySQL.

### transactions row (POS sale)

```sql
INSERT INTO transactions (
  business_id,          -- 1 (Hvar's single business)
  location_id,          -- From config (default location)
  type,                 -- 'sell'
  status,               -- 'final'  ← NOT draft! POS sales are already confirmed
  contact_id,           -- Customer contact.id (or walk-in contact ID)
  invoice_no,           -- 'POS-{YYYYMMDD}-{sequence}'
  final_total,          -- Total amount in EGP
  tax_amount,           -- 0 for most Hvar products
  discount_amount,      -- Applied discount
  shipping_charges,     -- Shipping cost if applicable
  payment_status,       -- 'paid' (card) or 'due' (COD)
  website_order_id,     -- NULL for POS (not a storefront order)
  created_by,           -- Logged-in cashier user.id
  created_at,
  updated_at
)
```

### transaction_sell_lines rows

```sql
INSERT INTO transaction_sell_lines (
  transaction_id,       -- FK to transactions.id
  product_id,           -- products.id
  variation_id,         -- variations.id (NULL if single product)
  quantity,             -- Quantity sold
  unit_price,           -- Selling price per unit
  item_tax,             -- 0 for most
  unit_price_inc_tax,   -- Same as unit_price if no tax
  line_total            -- quantity × unit_price_inc_tax
)
```

### transaction_payments row

```sql
INSERT INTO transaction_payments (
  transaction_id,       -- FK to transactions.id
  amount,               -- Amount paid
  method,               -- 'cash', 'card', 'cheque'
  paid_on,              -- NOW()
  payment_for,          -- 'product' (not 'purchase' which is supplier payments)
  created_by
)
```

### Stock deduction (immediately on POS sale)

```sql
UPDATE variation_location_details
SET qty_available = qty_available - :quantity
WHERE variation_id = :variation_id
  AND location_id = :location_id
  AND qty_available >= :quantity  -- guard against negative stock
```

**⚠ This must be atomic.** Use a transaction. Check qty_available before deducting.
If stock is insufficient, roll back the entire order.

---

## 5. Product Catalog Read Contract

The new systems read products from the ERP database directly.

### Product Search Query (used by POS and storefront)

```sql
SELECT
  v.id            AS variation_id,
  v.name          AS variation_name,
  v.sub_sku       AS sku,
  p.id            AS product_id,
  p.name          AS product_name,
  p.type          AS product_type,
  v.sell_price_inc_tax AS price,
  vld.qty_available AS stock
FROM variations v
JOIN products p ON p.id = v.product_id
JOIN variation_location_details vld
  ON vld.variation_id = v.id
  AND vld.location_id = :location_id
WHERE p.enable_stock = 1
  AND (
    p.name LIKE :query
    OR v.sub_sku LIKE :query
    OR v.name LIKE :query
  )
ORDER BY p.name ASC
```

For single products (no variations), `variations` still has one row per product.
The `sub_sku` on the variation is the barcode/SKU used for barcode scanning.

---

## 6. Customer Lookup Contract

```sql
SELECT
  id,
  name,
  mobile,
  email,
  type,
  customer_group_id
FROM contacts
WHERE mobile = :normalized_phone
  AND type = 'customer'
LIMIT 1
```

Phone must be normalized to `01XXXXXXXXX` format before querying.
See `04-DATA-FLOWS.md` → Phone Normalization.

---

## 7. What the ERP Does NOT Expect From Us

The following are **ERP-internal** and should never be set by the new systems:

| Field/Table | Why We Don't Touch It |
|-------------|----------------------|
| `transactions.invoice_no` sequence for ERP sells | Auto-generated by ERP's invoice number system |
| Accounting entries (`account_transactions`) | Auto-created by ERP on final sell |
| `SellCreatedOrModified` event | Fires automatically when status→final |
| Bosta shipment creation | Triggered by ERP's `OrderSyncService` automatically |
| HR/payroll, manufacturing, restaurant data | Unrelated modules |
| `commission_histories` | Multi-seller feature, not used |

---

## 8. Business Configuration (ERP Settings We Depend On)

These live in `hvar_erp` and affect our integration:

| Setting | Table | Key | What It Controls |
|---------|-------|-----|-----------------|
| Location ID | `business_locations` | `id` | Which warehouse stock to read/write |
| Auto-Bosta | `business` | `website_api_settings.auto_bosta_for_website_orders` | Whether ERP auto-creates Bosta on order receipt |
| Contact ID for walk-in | `contacts` | type='customer', name='Walk-in Customer' | POS fallback when no customer is set |

**At build time:** Query these from DB and store in config. Do not hardcode.
