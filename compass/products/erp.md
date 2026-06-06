# ERP Direction — هفار

> Direction for every Hvar-built system that touches or exposes `hvar_erp` data. We do not build the ERP — it is Ultimate POS. But every interface that reads from it, writes to it, or webhooks into it must follow this compass.

---

## ERP's Role in the Hvar Ecosystem

`hvar_erp` is a MySQL database running under Ultimate POS. It is the single source of truth for:

- Product catalog (products, variations, pricing)
- Stock availability
- Orders (transactions)
- Customer contacts
- Service types
- Geographic data (governorates/cities as `cities`, districts as `districts`)

Everything Hvar builds that touches this data has exactly two permitted relationships with it:

1. **Display:** read the data, present it to a user (customer, agent, manager)
2. **Feed:** write to it through defined webhook/API patterns that Ultimate POS exposes

We never ORM over the ERP schema. We never assume the schema is stable. We never cache ERP data without a defined freshness window. We never run unparameterized queries against it.

---

## The Five Absolutes

These are the non-negotiables. Violating any one of them produces incorrect behavior in production — wrong stock, wrong orders, security vulnerabilities, or data corruption. They apply to every piece of code that touches `hvar_erp`.

### Absolute 1: Stock Truth = `variation_location_details.qty_available` Only

**Do not use `product_stocks.qty`.** This table drifts — it is updated on a batch process that can lag up to 48 hours on weekends. Any stock check, any inventory display, any "in stock / out of stock" determination uses `variation_location_details.qty_available` where `location_id = 1` (the primary location, `ERP_LOCATION_ID=1` from `.env`).

At order creation: re-validate `qty_available` inside a DB transaction with `SELECT ... FOR UPDATE`. The stock shown on the product page was valid when the page loaded; it may not be valid 10 minutes later. The lock at order creation is the authoritative check.

### Absolute 2: ERP Is Authority — Display and Feed Only

We do not own ERP data. We do not modify ERP schema. We do not hold parallel copies of ERP tables and try to keep them in sync. When the ERP has a contact, a product, an order — that is the canonical record. Our system reads it, displays it, and feeds it through defined integration points. If there is a discrepancy between what our system thinks and what the ERP says, the ERP is correct.

Corollary: never cache ERP-sourced data without a defined freshness window and a clear invalidation strategy. Stale stock, stale pricing, stale order status — all of these are worse than an extra database read.

### Absolute 3: Phone Is Identity — Normalize to `01XXXXXXXXX`

The ERP's `contacts.mobile` field uses `01XXXXXXXXX` format (10 digits, starts with 01). Every phone number that enters our system — from registration, from checkout, from the mCRM agent interface — must be normalized to this format before any DB write or lookup.

**Normalization rules:**
- Accept: `+201XXXXXXXXX`, `00201XXXXXXXXX`, `01XXXXXXXXX`, `1XXXXXXXXX`
- Strip non-digits
- Drop leading `20`
- Prefix `0` to a 9-digit number starting with `1`
- Validate against `^01[0125]\d{8}$` (Egyptian mobile operators: 010, 011, 012, 015)

A phone lookup that doesn't normalize first will miss existing contacts because `+201012345678` and `01012345678` are the same person in the ERP and different strings in MySQL.

### Absolute 4: Always Filter by `business_id` AND `location_id`

The ERP installation is multi-tenant: Ultimate POS can serve multiple businesses on one database. Forgetting the tenant filter returns rows from all businesses. Every product query, transaction query, category query, contact query must include:

```sql
WHERE business_id = ? AND location_id = ?
```

Values from `.env`: `ERP_BUSINESS_ID=1`, `ERP_LOCATION_ID=1`.

Build this into query helpers at the infrastructure level so that no individual query can forget it.

### Absolute 5: Service Tickets Live in `mcrm_hvar_hub`, Not `hvar_erp`

Service tickets (`service_tickets`, `service_ticket_history`, `service_items`, `ticket_sequences`) are in the `mcrm_hvar_hub` database, not in `hvar_erp`. The ERP has only `types_of_services` as a lookup table.

Any code that queries for service tickets needs a **third DB pool** — not the ERP pool, not the site pool. See `MCRM_DB_*` environment variables. This is one of the most common sources of incorrect behavior in new code that hasn't accounted for the three-database architecture.

---

## Data Display Standards

### Product Pricing

Always display `variations.sell_price_inc_tax` — this is the final customer-facing price, tax-inclusive. Do not calculate tax on top of this. Do not display `variations.default_sell_price` (pre-tax) to customers.

For strike-through "compare at" pricing: `variations.dpp_inc_tax`. Show this only when it is genuinely higher than `sell_price_inc_tax`. Never construct a false compare-at price.

### Stock States

| `qty_available` | Display state | Arabic label |
|----------------|--------------|--------------|
| > 5 | In stock | متاح |
| 1–5 | Low stock | كمية محدودة |
| 0 | Out of stock | غير متاح |

Do not show the exact quantity to customers ("only 3 left") unless the business has explicitly decided this. The states above are sufficient and do not reveal inventory intelligence to competitors who might monitor the storefront.

### Order States

Transactions in `hvar_erp.transactions` flow through these statuses:

| ERP status | Customer-facing label (Arabic) | mCRM label |
|-----------|-------------------------------|-----------|
| `draft` | قيد المراجعة | Draft — pending agent confirmation |
| `final` | تم التأكيد | Confirmed |
| — (Bosta created) | تم الشحن | Shipped |
| — (Bosta delivered) | تم التسليم | Delivered |

Note: Bosta's delivery status is not stored in the ERP directly — it is derived from the `bill_code` tracking lookup. The ERP status moves: draft → final when the agent confirms. Bosta status is a separate read.

### Ticket States (in mCRM `service_tickets`)

| Status constant | Arabic label | Visual treatment |
|-----------------|-------------|-----------------|
| `PENDING` | في الانتظار | Slate/gray |
| `HUB_RECEIVED` | وصل المركز | Blue |
| `IN_WORKSHOP` | في الورشة | Amber |
| `DISPATCHED` | في الطريق | Purple |
| `INSPECTED` | تم الفحص | Blue |
| `READY` | جاهز للاستلام | Green |
| `REFUNDED` | تم الاسترداد | Green |
| `CLOSED` | مغلق | Emerald |
| `CANCELLED` | ملغي | Red |
| `FAILED` | فشل | Red |

Display these labels to customers. Never display raw status constants. The customer-facing text should be in the warm authority voice: "وصل مركز الصيانة وجاري المعالجة" rather than just "HUB_RECEIVED."

---

## ERP Integration Patterns

### Webhook Pattern (Our Order → ERP)

When an order is confirmed (COD placed or Kashier payment verified):

1. `POST /websiteintegration/webHooksyncOrdersGet` on the ERP
2. Payload includes: customer contact info, shipping address with Arabic governorate name (from `cities.nameAr`) and Arabic district name (from `districts.nameAr`), product/variation IDs, quantities, prices
3. ERP creates a `transactions` record with `status='draft'` and `website_order_id` set to our order ID
4. mCRM agent sees the draft, confirms it → ERP moves to `status='final'` → stock is deducted → Bosta shipment is created

**The `website_order_id` link is critical.** This is how we find our order's ERP transaction. Store both IDs.

### Cancel Webhook Pattern

When an order is cancelled by the customer (before final status):

1. Fire `POST /websiteintegration/webHooksyncOrdersDelete { order_id: N }` FIRST
2. Only after the ERP acknowledges the deletion, soft-delete our `orders` record (`cancelled_at` timestamp)

Never soft-delete first. If the ERP deletion fails and we've already marked the order cancelled in our DB, we have a phantom ERP transaction with no corresponding customer record.

### Read Pattern (Raw Parameterized SQL)

All reads from `hvar_erp` use raw parameterized SQL through the DB pool. Not Drizzle ORM — Drizzle manages only our `hvar_site` tables. Not string concatenation.

```typescript
// Correct
const [rows] = await erpDb.query(
  'SELECT p.id, p.name, v.sell_price_inc_tax FROM products p ...'
  + ' WHERE p.business_id = ? AND p.location_id = ?',
  [ERP_BUSINESS_ID, ERP_LOCATION_ID]
);

// Never
const query = `SELECT * FROM products WHERE business_id = ${bizId}`;
```

The `db.query()` helper (not `.execute()` — see the mysql2 quirk in CONTEXT.md) wraps this pattern. Use it.

### Contact Sync Pattern

When a customer registers or places an order, their contact record is created or updated in `hvar_erp.contacts`. Phone is the primary key for lookup. The sync flow:

1. Normalize phone number
2. `SELECT id FROM contacts WHERE mobile = ? AND business_id = ?`
3. If exists: use the existing `contact_id`, optionally update name if blank
4. If not exists: create the contact via the ERP API or a direct insert (if direct insert is the established pattern — follow what mCRM does)

Never create duplicate contacts for the same phone number.

---

## Naming Traps

These are naming decisions in the ERP schema that are not intuitive. Every new developer working with this codebase needs to know these before writing their first ERP query.

| ERP Table / Field | What you'd expect | What it actually is |
|------------------|------------------|---------------------|
| `cities` | Cities | Governorates (محافظات). Cairo, Alexandria, Giza are `cities` records. |
| `districts` | Districts | Cities and neighborhoods. The thing you'd normally call a city (Nasr City, Zamalek, Maadi) is a `districts` record. `districts.city_id` → `cities.id` (governorate). |
| `transactions.status` | Order status | `'draft'` = unconfirmed. `'final'` = confirmed. Not "pending" and "completed." |
| `variations.sell_price_inc_tax` | Gross price | The actual customer price. This is the one to display. |
| `products.image` | Image URL | Only the filename. Prepend `PUBLIC_MEDIA_BASE` from `.env` to get the full URL. |
| `products.product_description` | `description` | The product description column is named `product_description`, not `description`. |

The cities/districts naming trap also appears in Bosta's API: Bosta `city` field = governorate, Bosta `zone` field = city/district. These names are confusing in both places and for the same reason — different conventions for what constitutes a "city" in Egypt.

---

## ERP UX Direction

### When Showing ERP Data in Customer Portal

- **Loading states:** skeleton screens for product lists and order lists. Never a blank screen while waiting for ERP data. The skeleton should be shaped like the content (product card shape, order row shape).
- **Error states:** If the ERP query fails, show a human error message with a retry option. Never show a raw database error message, an SQL error, or a stack trace. Example: "في مشكلة في تحميل المنتجات — جربي تاني." with a retry button.
- **Data freshness:** Stock availability shown on the product page was valid at page load. If a customer has been on a PDP for 10+ minutes, the add-to-cart action should re-validate stock before proceeding — not assume the page-load data is still current.
- **Out of stock handling:** When a product is out of stock, the CTA changes from "أضيفي للسلة" to a WhatsApp contact option ("تواصلي معانا لمعرفة موعد التوافر"). Do not show a disabled button with no path forward.

### When Showing ERP Data in mCRM

- ERP errors can be more verbose for staff: "DB connection failed — check ERP_DB_HOST in .env" is useful for an agent who has access to the support team. Still do not expose raw stack traces.
- Data freshness is less critical in mCRM because agents are working in near-realtime — but make it clear when data was last fetched on views that show potentially stale information (order lists that are cached for performance).

---

## What Changes When ERP Changes

Ultimate POS is third-party software. When it is upgraded, schema changes can occur without warning. The columns we depend on most critically:

| Column | Table | Risk if removed/renamed |
|--------|-------|------------------------|
| `qty_available` | `variation_location_details` | Stock display and order creation break entirely |
| `sell_price_inc_tax` | `variations` | All pricing breaks |
| `dpp_inc_tax` | `variations` | Compare-at pricing breaks |
| `website_order_id` | `transactions` | Order → ERP link breaks |
| `bill_code` | `transactions` | Bosta tracking breaks |
| `mobile` | `contacts` | Customer identification breaks |
| `nameAr` | `cities`, `districts` | Arabic address display breaks |

After any ERP (Ultimate POS) version update: test these columns first before declaring the upgrade successful. Write a schema health-check script that verifies these columns exist and contain expected data types.
