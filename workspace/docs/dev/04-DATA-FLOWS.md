# Data Flows — Stock, Orders, Shipping, Phones

> The critical paths where getting it wrong causes production incidents.

---

## 1. Stock Authority

### The Rule

There is one source of truth for stock:

```
variation_location_details.qty_available
```

Do not read or write `product_stocks.qty`. That table belongs to the old system (Active eCommerce).
It drifts. It will eventually be incorrect. Treat it as if it does not exist.

### Why Two Tables Exist

```
product_stocks.qty           ← Active eCommerce / Dukan storefront
                               Decremented when the POS terminal (old) sells
                               Decremented by: PosController@order_store
                               Restocked by: OrderCancelled cron (hard-delete flow)
                               Synced from ERP: pos:stock cron (daily, skips Friday)

variation_location_details.qty_available  ← Hvar-ERP (Ultimate POS)
                               Decremented when ERP marks a transaction as final
                               Decremented by: ProductUtil.decreaseProductQuantity()
                               Used by: MCRM, stock reports, Bosta check
                               SOURCE OF TRUTH
```

The `product_stocks.qty` sync from ERP runs once daily and skips Friday. On any given
weekend, `product_stocks.qty` can be 48 hours stale. During high volume, it will show
stock that does not exist in the ERP. The new system reads `variation_location_details` directly.

### Stock Operations by System

| System | Read From | Write To | When |
|--------|-----------|----------|------|
| New POS terminal | `variation_location_details` | `variation_location_details` | Immediately on sale (status=final) |
| New storefront backend | `variation_location_details` | — | Only reads — ERP handles deduction |
| ERP | `variation_location_details` | `variation_location_details` | When transaction → final |
| MCRM | `variation_location_details` | — | Only reads |

---

## 2. Order Lifecycle — Full Journey

### Storefront Order (customer buys online)

```
PHASE 1 — INTAKE
  Customer builds cart on new storefront
  Customer enters phone, address (governorate + district)
  Customer selects payment method

PHASE 2 — PAYMENT (Kashier)
  Backend generates UUID orderId + HMAC hash
  Stores order + payment intent in DB (pending_payments)
  Redirects to Kashier HPP
  Kashier redirects back with x-kashier-signature
  Backend validates signature (MUST validate)
  On SUCCESS: marks payment as processed, order status = paid

PHASE 3 — ERP SYNC (automatic, same request or background job)
  Backend fires webhook: POST /websiteintegration/webHooksyncOrdersGet
  ERP creates transaction:
    type = 'sell', status = 'draft', website_order_id = our_order_id
    contact_id = customer (matched by phone)
    shipping_state = governorate ID (Arabic name match)
    shipping_city = district ID (Arabic name match)

PHASE 4 — CALL CENTER CONFIRMATION (MCRM)
  MCRM agent sees new draft transaction in queue
  Agent calls customer to confirm order details
  Agent approves → transaction.status = 'final'
  Stock deducted from variation_location_details
  SellCreatedOrModified event fires:
    → Accounting entries auto-created
    → If auto_bosta_for_website_orders = true: Bosta shipment auto-created

PHASE 5 — FULFILLMENT
  Bosta courier picks up from warehouse
  Hub tracks Bosta status via MCRM
  Customer receives order
  Hub marks ticket closed
```

### POS Terminal Order (cashier sells in person)

```
PHASE 1 — SALE
  Cashier scans/searches product
  Product added to cart
  Customer phone entered (optional — can be walk-in)
  Payment collected (cash / card via Kashier card-present or external terminal)

PHASE 2 — ORDER CREATION (immediate, direct DB write)
  INSERT transactions: type='sell', status='final' (not draft — cashier already confirmed)
  INSERT transaction_sell_lines
  INSERT transaction_payments
  UPDATE variation_location_details: qty_available -= quantity (atomic, guarded)

PHASE 3 — RECEIPT
  Print receipt via browser print dialog or thermal printer
  Clear cart
  Ready for next customer

PHASE 4 — FULFILLMENT (if shipping)
  If shipping address provided: ERP auto-creates Bosta shipment (triggered by status=final)
  Else: customer takes product at counter
```

### Key Difference

| Aspect | Storefront Order | POS Order |
|--------|-----------------|-----------|
| Initial ERP status | `draft` | `final` |
| Needs MCRM confirmation | YES | NO |
| Stock deducted when | After MCRM approval | Immediately at sale |
| Bosta auto-created | After MCRM approval | Immediately (if configured) |
| Payment handled by | Kashier HPP (online) | Cash / card-present |

---

## 3. Order Cancellation

### Storefront Cancellation

**Before MCRM confirmation (draft stage):**
```
1. Customer or system cancels order
2. Update order.status = 'cancelled' in our DB (soft delete — NEVER delete the row)
3. Fire: POST /websiteintegration/webHooksyncOrdersDelete with order_id
4. ERP removes the draft transaction
5. No stock impact (stock was never deducted in draft status)
6. If payment was taken: initiate Kashier refund via Kashier API
```

**After MCRM confirmation (final stage):**
```
— This path requires human intervention via MCRM —
— Do not automate post-final cancellation —
```

**Rule: Never hard-delete an order row.** Set a `cancelled_at` timestamp or `status='cancelled'`.
The ERP webhook must fire before the order disappears from our system. If the delete webhook fires
to ERP but our record is already gone, we lose the audit trail.

---

## 4. Bosta Shipping

**Bosta is handled by MCRM.** New systems do not integrate directly with Bosta.
The ERP auto-creates Bosta shipments when transactions go final (if `auto_bosta_for_website_orders = true`).

### The Naming Trap

This trap has bitten every developer who touched this codebase:

```
Bosta API field   What it actually means
──────────────    ─────────────────────
city              Egyptian governorate  (e.g. "Cairo", "Giza", "Alexandria")
zone              Egyptian city/district  (e.g. "Nasr City", "Dokki")
```

The name `city` intuitively means city, but Bosta uses it for governorate.
The name `zone` intuitively means region, but Bosta uses it for city.

**Always double-check Bosta payloads against this table. Always.**

### Bosta Shipment Types

| Code | Type | Payload Difference |
|------|------|------------------|
| 10 | SEND (standard delivery) | `dropOffAddress` + `specs` |
| 15 | CASH_COLLECTION | Same as SEND |
| 25 | CUSTOMER_RETURN_PICKUP | `pickupAddress` + `returnSpecs` (completely different!) |
| 30 | EXCHANGE | `dropOffAddress` + `specs` + `returnSpecs` |

**Type 25 is structurally different.** Using SEND payload structure for a Type 25 will silently fail or create a malformed shipment.

### Phone for Bosta

Bosta requires Egyptian phone format: `01XXXXXXXXX` (10 digits, no country code).
Always normalize before building Bosta payload. See Phone Normalization below.

---

## 5. Phone Normalization

Egypt phone numbers arrive in many formats. Always normalize before storing or querying.

### Input Variants

```
+201012345678   (international with +)
00201012345678  (international with 00)
201012345678    (international without prefix)
01012345678     (standard Egyptian format)
1012345678      (missing leading 0)
```

### Normalization Rule

```python
import re

def normalize_egypt_phone(phone: str) -> str | None:
    if not phone:
        return None

    # Strip everything except digits
    digits = re.sub(r'\D', '', phone)

    # Handle 20 country code
    if digits.startswith('20'):
        digits = digits[2:]

    # Add leading 0 if missing (9 digits starting with 1)
    if len(digits) == 9 and digits.startswith('1'):
        digits = '0' + digits

    # Validate: must be 01[0125][0-9]{8}
    if re.match(r'^01[0125]\d{8}$', digits):
        return digits

    return None  # Invalid phone
```

### Valid Egyptian Operators

```
010 → Vodafone
011 → Etisalat (now e&)
012 → Orange
015 → WE (Telecom Egypt)
```

Any other combination is invalid for a mobile number.

### Usage

- Normalize BEFORE storing to DB
- Normalize BEFORE querying contacts by phone
- Normalize BEFORE building Bosta payload
- Normalize BEFORE displaying in Kashier callback URL

---

## 6. Arabic Address Resolution (Storefront → ERP)

When the storefront sends an order to the ERP, the ERP resolves the shipping address
from Arabic text to database IDs.

**ERP lookup logic:**
```
shipping_address.state (Arabic governorate name)
  → SELECT id FROM cities WHERE name LIKE '%{state}%'
  → If found: transaction.shipping_state = cities.id
  → If not found: transaction.shipping_state = NULL, text stored in order_addresses JSON

shipping_address.city (Arabic district name)
  → SELECT id FROM districts WHERE district_name LIKE '%{city}%'
  → If found: transaction.shipping_city = districts.id
  → If not found: transaction.shipping_city = NULL
```

**Best practice for the new storefront:** Use dropdown selectors backed by the actual
`cities` and `districts` tables, not free-text fields. Send the `cities.name` and
`districts.district_name` values exactly as they appear in the DB — this maximizes the
chance of a successful ERP match.

**The 27 Egyptian governorates** (Arabic names as stored in `cities.name`):

القاهرة، الجيزة، الإسكندرية، الشرقية، الدقهلية، القليوبية، المنوفية،
الغربية، كفر الشيخ، الإسماعيلية، بورسعيد، السويس، شمال سيناء، جنوب سيناء،
مطروح، الوادي الجديد، البحر الأحمر، الفيوم، بني سويف، المنيا، أسيوط،
سوهاج، قنا، الأقصر، أسوان، دمياط، البحيرة

---

## 7. The Stock Drift Window

Even with the new system reading `variation_location_details` directly, there is still
a window where stock can appear available but is already committed:

```
Time 0:00  Cashier 1 reads stock: 3 units available
Time 0:01  Cashier 2 reads stock: 3 units available
Time 0:02  Cashier 1 completes sale: qty_available = 2
Time 0:03  Cashier 2 completes sale: qty_available = 1
→ Fine, handled by the atomic UPDATE guard

BUT:

Time 0:00  Customer on storefront adds to cart: 3 units shown
Time 0:01  POS cashier sells the last unit: qty_available = 0
Time 0:02  Customer on storefront tries to checkout: shows 3 units (cached)
→ Storefront must re-check stock at checkout time, not just at add-to-cart
```

**Rule:** Always re-validate `qty_available >= quantity` at the moment of order creation,
inside the same DB transaction. Never rely on the stock level displayed during product browsing.
