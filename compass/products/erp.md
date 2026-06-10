# ERP Direction — هفار

> What every developer and designer reads before touching anything that connects to `hvar_erp`. The ERP is not ours — it is Ultimate POS. We read from it, feed into it through defined endpoints, and stay out of everything else. This compass defines the mental model, the hard constraints, and every production trap we have already found.

---

## The Single Mental Model

```
CUSTOMERS
    │
    ▼
hvarstore.com  ◄── THIS IS WHAT WE BUILD
(New Hvar Site)
    │
    │  HTTP webhooks (orders)
    │  Direct MySQL (products, stock, contacts, tickets)
    ▼
┌─────────────────────────────────────────────────────┐
│              hvar_erp  (MySQL 8)                    │
│            THE SINGLE DATABASE                      │
│                                                     │
│  transactions / contacts / products / variations /  │
│  variation_location_details / service_tickets /     │
│  cities / districts / categories / brands           │
└─────────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
   HVAR-ERP                      MCRM
   (Laravel 10)            (Flask + React)
   Inventory, accounting,  Call center, hub tickets,
   order management        customer 360°

   ← STAFF-FACING SYSTEMS — NOT TOUCHED IN THIS PROJECT →
```

`hvar_erp` is the single database. Both HVAR-ERP (the Laravel application) and MCRM (our Flask application) read and write it. The new storefront also reads and writes it directly — there is no middle API layer between us and the database for reads. For order intake, we speak to the ERP application via webhook.

---

## What the New Site Reads from the DB

All reads are raw parameterized SQL against `hvar_erp`. Not ORM, not string concatenation.

| Data | Tables | API Route |
|------|--------|-----------|
| Product catalog | `products`, `variations`, `variation_location_details`, `categories` | `GET /api/products` |
| Single product + stock | Same, joined on `location_id` | `GET /api/products/:slug` |
| Governorates list | `cities` | `GET /api/locations/governorates` |
| Districts by governorate | `districts` | `GET /api/locations/districts/:govId` |
| Customer lookup | `contacts WHERE mobile = :phone AND type = 'customer'` | Internal, called at auth |
| Order history | `transactions WHERE website_order_id IS NOT NULL AND contact_id = :id` | `GET /api/orders` |
| Order detail + tracking | `transactions.bill_code` | `GET /api/orders/:id` |
| Ticket list | `service_tickets WHERE contact_id = :id` | `GET /api/tickets` |
| Ticket detail | `service_tickets`, `products`, `transactions` | `GET /api/tickets/:id` |

## What the New Site Writes to the DB

| Data | Table(s) | When |
|------|---------|------|
| New customer | `contacts` (INSERT) | First checkout with unknown phone |
| New order | Our own `orders` table (new, in `hvar_site`) | On checkout confirmation |
| New service ticket | `service_tickets` (INSERT into `hvar_erp`) | On service request form submit |
| Payment intent | `pending_payments` (new, in `hvar_site`) | Before Kashier redirect |

## What the New Site NEVER Writes

| Table | Owner | Why |
|-------|-------|-----|
| `transactions` | ERP | ERP creates these via webhook from our order |
| `transaction_sell_lines` | ERP | Created by ERP alongside the transaction |
| `transaction_payments` | ERP | Created by ERP on order sync |
| `variation_location_details` | ERP | Stock is ERP territory for storefront orders |
| `account_transactions` | ERP | Auto-created by ERP accounting on status→final |

For POS terminal sales only: the POS writes directly to `transactions`, `transaction_sell_lines`, `transaction_payments`, and `variation_location_details` (atomically, inside a DB transaction). The storefront does not.

---

## The Five Absolutes

Violating any of these produces wrong behavior in production — wrong stock counts, phantom orders, security holes, or data corruption. They apply to every line of code that touches `hvar_erp`.

### Absolute 1: Stock Truth is `variation_location_details.qty_available` — Nothing Else

The ERP tracks stock per variation per location:

```sql
SELECT qty_available
FROM variation_location_details
WHERE variation_id = :variation_id
  AND location_id = :location_id
```

`location_id` comes from config (`ERP_LOCATION_ID=1`). Never hardcode it.

**Do not use `product_stocks.qty`.** That table belongs to Active eCommerce (the old storefront). It is synced from `variation_location_details` once daily by the `pos:stock` cron, which skips Friday. By Saturday afternoon it can be 48 hours stale. During high volume it will show stock that does not physically exist. Treat `product_stocks` as if it does not exist for all new code.

**At order creation:** re-validate `qty_available >= requested_quantity` inside the same DB transaction as the INSERT, using `SELECT ... FOR UPDATE` to guard against concurrent overselling. The stock shown on the product page was read at page load — it may be wrong by the time the customer clicks "تأكيد الطلب".

```sql
-- Inside BEGIN ... COMMIT
SELECT qty_available FROM variation_location_details
WHERE variation_id = ? AND location_id = ?
FOR UPDATE;
-- If qty_available < quantity → roll back and return error
-- Else → INSERT order, proceed
```

For the **storefront**, we do not deduct stock ourselves — we fire the webhook and the ERP deducts on confirmation. For the **POS terminal**, stock is deducted atomically at the point of sale with the guard above.

### Absolute 2: The ERP is Authority — We Display and Feed, Never Parallel

We do not maintain parallel copies of ERP tables. We do not attempt to keep a local cache of products and sync it. When the ERP has a contact, a product, or an order — that is the canonical record. Our system displays it and feeds new data through defined integration points. If there is any discrepancy between what our system thinks and what the ERP says, the ERP is correct.

Read-through, not replicate. Cache with explicit short TTLs (product list: 5 minutes max, stock: never cached — always live). If a cache is absolutely required for performance, the cache key must include a timestamp and there must be an invalidation path.

### Absolute 3: Phone is Identity — Normalize to `01XXXXXXXXX` Before Any DB Touch

The ERP's `contacts.mobile` field stores `01XXXXXXXXX` — 10 digits, no country code, no spaces. Every phone number that enters our system must be normalized to this format before any DB write or lookup.

```python
import re

def normalize_egypt_phone(phone: str) -> str | None:
    if not phone:
        return None
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('20'):
        digits = digits[2:]
    if len(digits) == 9 and digits.startswith('1'):
        digits = '0' + digits
    if re.match(r'^01[0125]\d{8}$', digits):
        return digits
    return None  # Invalid — reject at the boundary
```

Valid Egyptian mobile prefixes: `010` (Vodafone), `011` (e&/Etisalat), `012` (Orange), `015` (WE). Any other is invalid.

Normalize before: storing to DB, querying contacts by phone, building Kashier payload, building Bosta payload. A lookup that sends `+201012345678` will find nothing — the ERP stores `01012345678`. They are the same person, but different strings in MySQL.

### Absolute 4: Filter by `business_id` AND `location_id` on Every Query

Ultimate POS is multi-tenant — the same database schema can serve multiple businesses. Forgetting the tenant filter returns rows from all businesses on the installation:

```sql
-- Every product, transaction, contact, category query must include:
WHERE business_id = ? AND location_id = ?
```

Values: `ERP_BUSINESS_ID=1`, `ERP_LOCATION_ID=1` from `.env`. Build these into query helpers at the infrastructure layer. Never let an individual query skip them.

### Absolute 5: Soft-Delete Orders — Never Hard-Delete Before Firing the Cancel Webhook

When a storefront order is cancelled:

1. Fire `POST /websiteintegration/webHooksyncOrdersDelete { "order_id": N }` to the ERP **first**
2. Only after the ERP acknowledges: set `orders.cancelled_at = NOW()` and `orders.status = 'cancelled'` in our DB

Never delete the order row from our DB. Never fire the webhook after deleting. If you delete our record first and the webhook call fails, you have an ERP draft transaction with no corresponding storefront order — it will sit in the MCRM queue indefinitely with no resolution path.

For orders that have already moved to `status = 'final'` in the ERP: do not automate cancellation. That path requires human intervention via MCRM.

---

## Order Webhook Contract

### New Order

```
POST /websiteintegration/webHooksyncOrdersGet
```

Fire this immediately after a storefront order is created (payment confirmed or COD accepted). The endpoint is idempotent — if the ERP already has a transaction with `website_order_id = N`, it skips and returns success.

**Payload:**

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

**What the ERP does with it:**

```
OrderSyncService.syncOrders(payload)
  │
  ├── Check: transaction with website_order_id exists?
  │   YES → skip (idempotent)
  │   NO  → continue
  │
  ├── Resolve customer:
  │   Find contact by phone in contacts table
  │   NOT FOUND → create new contact record
  │
  ├── Resolve products:
  │   Find by website_product_id in products table
  │   NOT FOUND → log warning, skip that line item
  │
  ├── Resolve shipping address:
  │   shipping_address.state → match cities.name (Arabic governorate)
  │   shipping_address.city  → match districts.district_name (Arabic district)
  │   No match → store NULL ID, keep raw text in order_addresses JSON
  │
  ├── Create transactions record:
  │   type            = 'sell'
  │   status          = 'draft'   ← ALWAYS draft — MCRM confirms later
  │   website_order_id = order.id
  │   contact_id      = resolved customer
  │   final_total     = grand_total
  │   payment_status  = 'paid' or 'due' (based on payment_status field)
  │   shipping_state  = cities.id (governorate)
  │   shipping_city   = districts.id
  │
  ├── Create transaction_sell_lines (one per order_detail)
  ├── Create transaction_payments (if paid)
  │
  └── If auto_bosta_for_website_orders = true:
      → Auto-create Bosta shipment
      → Save bill_code to transaction
```

**Critical field rules:**

- `phone`: normalized `01XXXXXXXXX` — the ERP matches this against `contacts.mobile`
- `state`: Arabic governorate name exactly as it appears in `cities.name` — e.g. `"القاهرة"` not `"Cairo"`
- `city`: Arabic district name exactly as it appears in `districts.district_name` — e.g. `"مدينة نصر"` not `"Nasr City"`
- `product_id` in `order_details`: must map to `products.id` in the ERP (or `products.website_product_id` depending on which ID system is used — confirm from existing integration)

### Order Update

```
POST /websiteintegration/webHooksyncOrdersUpdate
```

When an order is modified before ERP confirmation (address correction, quantity change). Same payload structure as creation. ERP updates the existing draft transaction identified by `website_order_id`.

### Order Cancel

```
POST /websiteintegration/webHooksyncOrdersDelete
{ "order_id": 1234 }
```

ERP removes the draft transaction. See Absolute 5 above for the sequencing rule.

---

## Stock Model

```
variation_location_details
├── variation_id      FK to variations.id
├── location_id       FK to business_locations.id
├── qty_available     Current sellable stock  ← THE ONLY NUMBER THAT MATTERS
├── qty_reserved      Committed but not yet deducted
└── qty_adj           Manual adjustment log
```

`on_hand = qty_available + qty_reserved`

For storefront display and order validation, use `qty_available` only. `qty_reserved` exists as an ERP internal concept — storefront orders are drafted first, so stock is not physically reserved until the MCRM agent confirms.

**Stock display thresholds:**

| `qty_available` | Display state | Arabic label |
|----------------|---------------|--------------|
| > 5 | In stock | متاح |
| 1–5 | Low stock | كمية محدودة |
| 0 | Out of stock | غير متاح |

Do not display the exact count to customers unless the business explicitly decides otherwise. Showing "آخر 3 قطع" reveals inventory intelligence to competitors scraping the storefront.

**The storefront drift window:** Even reading `variation_location_details` directly, a concurrent POS sale between page load and checkout will show available stock that has already been sold. Mitigate by re-checking at checkout inside a `SELECT ... FOR UPDATE` lock.

---

## Order Lifecycle (ERP Perspective)

### Storefront Order

```
Customer places order
        │
        ▼
Our storefront creates orders record (hvar_site)
        │
        ▼
Webhook fires → ERP creates transaction:
  type = 'sell', status = 'draft', website_order_id = our id
  Stock NOT deducted yet
        │
        ▼
MCRM agent sees draft in queue
Agent calls customer to confirm
Agent approves → status = 'final'
        │
        ▼
Stock deducted from variation_location_details
SellCreatedOrModified event fires:
  → Accounting entries auto-created (account_transactions)
  → If auto_bosta_for_website_orders: Bosta shipment created
  → bill_code saved to transactions row
        │
        ▼
Customer tracks via bill_code on bosta.co
```

### POS Terminal Order

```
Cashier scans / searches product
        │
        ▼
Item added to cart
Payment collected (cash or card)
        │
        ▼
Direct DB write — all atomic, same transaction:
  INSERT transactions: type='sell', status='final' (not draft)
  INSERT transaction_sell_lines
  INSERT transaction_payments
  UPDATE variation_location_details: qty_available -= quantity
  (guarded: WHERE qty_available >= quantity — roll back if insufficient)
        │
        ▼
Receipt printed
Session cleared
```

### Key Difference

| Aspect | Storefront | POS Terminal |
|--------|-----------|-------------|
| ERP initial status | `draft` | `final` |
| Needs MCRM confirmation | YES | NO |
| Stock deducted when | After MCRM confirms | Immediately at sale |
| Payment | Kashier HPP online | Cash / card-present |
| Bosta auto-created | After MCRM confirms | Immediately if configured |

---

## Order Tracking via Bosta

After MCRM confirms a storefront order (status → final), the ERP auto-creates a Bosta shipment and stores the tracking number:

```sql
SELECT bill_code FROM transactions WHERE website_order_id = :our_order_id
```

- `bill_code IS NULL` → order not yet confirmed by MCRM → show "طلبك قيد التأكيد"
- `bill_code IS NOT NULL` → show tracking link:
  `https://bosta.co/ar-eg/tracking-shipments?shipment-number={bill_code}`

We do not integrate with Bosta API directly. We read `bill_code` from the ERP and hand the customer to Bosta's tracking page.

---

## Address Resolution (Storefront → ERP)

The ERP resolves Arabic free-text address fields to database IDs when it receives an order. Use dropdown selectors backed by the actual `cities` and `districts` tables — not free-text input. Send the exact values as stored in the DB to maximize match rate:

- `cities.name` for the governorate (the `state` field in our webhook payload)
- `districts.district_name` for the district/city (the `city` field in our webhook payload)

If the ERP cannot match, it stores `NULL` for the ID and retains the raw text in `order_addresses` JSON. The MCRM agent must then manually resolve the address — this is expensive and error-prone.

**The 27 Egyptian governorates** (Arabic names as stored in `cities.name`):

القاهرة، الجيزة، الإسكندرية، الشرقية، الدقهلية، القليوبية، المنوفية، الغربية، كفر الشيخ، الإسماعيلية، بورسعيد، السويس، شمال سيناء، جنوب سيناء، مطروح، الوادي الجديد، البحر الأحمر، الفيوم، بني سويف، المنيا، أسيوط، سوهاج، قنا، الأقصر، أسوان، دمياط، البحيرة

---

## Customer Contact Sync

Phone is the primary key for customer identity in the ERP. Flow for any new checkout:

```sql
SELECT id, name, mobile, email, type, customer_group_id
FROM contacts
WHERE mobile = :normalized_phone
  AND type = 'customer'
  AND business_id = :business_id
LIMIT 1
```

- Found → use existing `contact_id`, send it in the webhook payload
- Not found → create the contact (INSERT into `contacts`) before or let the ERP create it from the webhook payload

Never create duplicate contacts for the same normalized phone.

---

## Product Query Pattern

Standard product search (used by POS and storefront):

```sql
SELECT
  v.id                  AS variation_id,
  v.name                AS variation_name,
  v.sub_sku             AS sku,
  p.id                  AS product_id,
  p.name                AS product_name,
  p.type                AS product_type,
  v.sell_price_inc_tax  AS price,
  v.dpp_inc_tax         AS compare_at_price,
  vld.qty_available     AS stock
FROM variations v
JOIN products p ON p.id = v.product_id
JOIN variation_location_details vld
  ON vld.variation_id = v.id
  AND vld.location_id = :location_id
WHERE p.business_id = :business_id
  AND p.enable_stock = 1
  AND p.status = 'active'
  AND (
    p.name    LIKE :query
    OR v.sub_sku LIKE :query
    OR v.name   LIKE :query
  )
ORDER BY p.name ASC
```

Even single-variation products have one row in `variations`. `sub_sku` is the barcode used for scanner input in the POS terminal.

For compare-at pricing: show `dpp_inc_tax` as strikethrough only when it is genuinely higher than `sell_price_inc_tax`. Never construct a false compare-at.

---

## Naming Traps

These field and table names have caused bugs in every new integration. Know them before writing any query.

| Name in ERP | What you expect | What it actually is |
|-------------|----------------|---------------------|
| `cities` | Cities | Egyptian governorates (محافظات). "القاهرة" is a `cities` row. |
| `districts` | Districts | Cities and neighborhoods. "مدينة نصر" is a `districts` row. `districts.city_id` FK → `cities.id` (the governorate). |
| `transactions.status = 'draft'` | Pending/unconfirmed | Yes — storefront order not yet confirmed by MCRM |
| `transactions.status = 'final'` | Completed/delivered | No — "confirmed by agent, ready for fulfillment." Delivery is tracked via Bosta separately. |
| `variations.sell_price_inc_tax` | Gross price | The actual customer price — display this |
| `variations.dpp_inc_tax` | Unknown | Compare-at (was) price for strikethrough display |
| `variations.default_sell_price` | Display price | Pre-tax price — do not show to customers |
| `products.image` | Full image URL | Filename only. Prepend `PUBLIC_MEDIA_BASE` from `.env`. |
| `products.product_description` | `description` | The product description column is named `product_description`, not `description`. |
| `bill_code` on `transactions` | Unknown | Bosta tracking number — appears after MCRM confirms |

**The Bosta naming trap appears twice:** in the ERP and directly in Bosta's own API:

```
Bosta API field   What it actually means
─────────────    ──────────────────────
city             Egyptian governorate (e.g. "Cairo", "Giza")
zone             Egyptian city/district (e.g. "Nasr City", "Dokki")
```

Bosta uses `city` for governorate and `zone` for city. Match the wrong field and the shipment is created with a wrong address — silently, with no API error.

---

## Bosta Shipment Types

| Code | Type | Notes |
|------|------|-------|
| 10 | SEND (standard delivery) | `dropOffAddress` + `specs` |
| 15 | CASH_COLLECTION | Same structure as SEND |
| 25 | CUSTOMER_RETURN_PICKUP | `pickupAddress` + `returnSpecs` — completely different payload structure |
| 30 | EXCHANGE | `dropOffAddress` + `specs` + `returnSpecs` |

Type 25 is structurally different from all others. Using a SEND payload for a Type 25 will silently create a malformed shipment with the wrong pickup address.

---

## ERP Business Configuration

These are stored in `hvar_erp` and affect our integration. At build time, read them from the DB and store in application config — do not hardcode.

| Setting | Table | Key | What it controls |
|---------|-------|-----|-----------------|
| Location ID | `business_locations` | `id` | Which warehouse stock to read and write |
| Auto-Bosta | `business` | `website_api_settings.auto_bosta_for_website_orders` | Whether ERP auto-creates Bosta on order receipt |
| Walk-in contact ID | `contacts` | `type='customer'`, `name='Walk-in Customer'` | POS fallback when no customer is assigned |

---

## Service Tickets

The `service_tickets` table lives in `hvar_erp` and is shared between the storefront and MCRM:

- **New storefront** creates tickets (`status = 'PENDING'`) when a customer submits a service request — INSERT + SELECT WHERE `contact_id = current customer`
- **MCRM** reads and processes tickets, advances their state — full CRUD on all tickets
- No API calls between the two systems. Same table, same database, different permission scope.

Ticket statuses and customer-facing labels:

| Status constant | Arabic label | Visual |
|-----------------|-------------|--------|
| `PENDING` | في الانتظار | Gray |
| `HUB_RECEIVED` | وصل المركز | Blue |
| `IN_WORKSHOP` | في الورشة | Amber |
| `DISPATCHED` | في الطريق | Purple |
| `INSPECTED` | تم الفحص | Blue |
| `READY` | جاهز للاستلام | Green |
| `REFUNDED` | تم الاسترداد | Green |
| `CLOSED` | مغلق | Emerald |
| `CANCELLED` | ملغي | Red |
| `FAILED` | فشل | Red |

Never display raw status constants to customers. Write the label in full voice — "وصل مركز الصيانة وجاري المعالجة" rather than "HUB_RECEIVED."

---

## Scale Reality

**~250,000 transactions. ~120,000 contacts.**

These are not estimates. They are the floor. Every query pattern, every API response, every index decision must be made in that context.

### Per-Table Constraints

**`contacts` (~120k rows)**
- `mobile` is the primary customer identity. It must be indexed. Phone lookup without an index is a full-table scan on every auth, every checkout, every order webhook.
- Name search (`LIKE '%…%'`) is always slow on this table. Enforce minimum 3 characters before querying. Add a 300ms debounce on the client. Never auto-search on keystroke-1.
- Do not expose unfiltered contact dumps. Every contact query must have a `WHERE` clause.

**`transactions` (~250k rows)**
- `contact_id` must be indexed — order history for a customer is the most common query.
- `website_order_id` must be indexed — webhook idempotency checks and order lookup both hit this column.
- Never `SELECT *` from transactions. Name the columns you need.
- Paginate from the first query. Never load all orders for a contact then slice in Python.

**`variation_location_details`**
- Composite index on `(location_id, product_id)` — stock queries always filter by both.
- Isolation: `SELECT … FOR UPDATE` at checkout. No cached stock at payment time.

### Pagination Contract

Every list endpoint returns this envelope:

```json
{
  "data": [...],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

Default page sizes and hard caps:

| Endpoint type | Default limit | Max allowed |
|---------------|--------------|-------------|
| Product catalog | 20 | 40 |
| Customer order history | 10 | 20 |
| MCRM queue | 25 | 50 |
| Service tickets | 10 | 25 |

Never accept `limit=0` or `limit=-1`. Clamp at validation. A missing limit parameter gets the default.

### Caching Rules

**Product catalog (~100 SKUs):** Cache aggressively. 5-minute TTL is acceptable — products change rarely. Filter and sort client-side after the first load.

**Stock (`qty_available`):** Never cache. Always live. A 5-second stale stock reading is enough to sell out-of-stock at checkout.

**Prices:** Follow ERP update frequency. If prices change daily, use a 1-minute TTL. If prices are stable, treat like catalog.

**Order status:** No cache. Customer-facing order state must reflect ERP truth. Polling acceptable; eventual consistency is not.

---

## Read Pattern — Raw Parameterized SQL Only

All reads from `hvar_erp` use raw parameterized SQL through the ERP DB connection pool. Not ORM (Drizzle/SQLAlchemy manage only our `hvar_site` tables). Not string concatenation. Not f-strings with user-supplied values.

```python
# Correct
cursor.execute(
    "SELECT p.id, p.name, v.sell_price_inc_tax "
    "FROM products p "
    "JOIN variations v ON v.product_id = p.id "
    "WHERE p.business_id = %s AND p.location_id = %s",
    (ERP_BUSINESS_ID, ERP_LOCATION_ID)
)

# Never
query = f"SELECT * FROM products WHERE business_id = {biz_id}"
```

Use `db.query()` (not `.execute()` — see the mysql2 quirk in DB-GOTCHAS). Always.

---

## UX Direction for ERP-Sourced Data

**Loading states:** Skeleton screens shaped like the content — product card skeletons for product lists, order row skeletons for order history. Never a blank screen while waiting for ERP data.

**Error states:** Human Arabic error message with a retry option. Never a raw DB error, SQL error, or stack trace. Example: "في مشكلة في تحميل المنتجات — جرب تاني" with retry button. For staff-facing tools (MCRM), error messages can be more specific: "DB connection failed — check ERP_DB_HOST in .env."

**Stock freshness:** The qty shown at page load is stale by definition. Re-validate at checkout. If a customer has been on a PDP for more than a few minutes, the add-to-cart action must re-check stock — not assume the displayed number is still valid.

**Out of stock handling:** CTA changes from "أضيف للسلة" to a WhatsApp contact path — "تواصل معنا لمعرفة موعد التوافر." No disabled button with no forward path.

**Order tracking:** Bosta tracking appears only after MCRM confirms. Before that, show "طلبك قيد التأكيد" with a clear explanation that the team will call to confirm.

---

## Columns That Break Everything If Removed

Ultimate POS is third-party software that can upgrade without warning. After any ERP version update, check these first:

| Column | Table | Breaks if removed |
|--------|-------|-------------------|
| `qty_available` | `variation_location_details` | All stock display and order validation |
| `sell_price_inc_tax` | `variations` | All product pricing |
| `dpp_inc_tax` | `variations` | Compare-at pricing |
| `website_order_id` | `transactions` | Order ↔ ERP link |
| `bill_code` | `transactions` | Bosta tracking |
| `mobile` | `contacts` | Customer identification |
| `name` | `cities` | Address resolution (Arabic governorate name) |
| `district_name` | `districts` | Address resolution (Arabic district name) |
| `product_description` | `products` | Product detail pages |
| `image` | `products` | Product images |

Write a schema health-check script that verifies these columns exist with the expected data types before declaring any ERP upgrade successful.
