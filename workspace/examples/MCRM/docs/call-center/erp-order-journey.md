# The Journey of an ERP Order — From Draft to `orders` Row

> A creative walkthrough: what happens when an order leaves ERP and lands in our database.

---

## The Big Picture

```
     ERP (erp.hvarstore.com)              HUB-MCRM
┌─────────────────────────────┐    ┌─────────────────────────────────────┐
│  /sells/draft-dt            │    │  sync-from-erp                       │
│  Draft sell orders          │───▶│  Transform → Enrich → Store          │
│  (HTML, JSON, chaos)        │    │  One row per order                   │
└─────────────────────────────┘    └─────────────────────────────────────┘
            │                                    │
            │ 67 rows                            │ 67 rows in orders
            │ invoice_no, mobile,                │ id, erp_order_id, phone,
            │ contact_name, final_total...       │ bosta_tracking, status=new
```

---

## Act 1 — The Fetch

**Where:** `POST /api/call-center/orders/sync-from-erp`  
**Request body:** `{ username, password, start_date, end_date }`

1. **Login to ERP** — CSRF token from `/login`, POST credentials, session stored
2. **Call draft-dt** — `GET https://erp.hvarstore.com/sells/draft-dt` with DataTables params
3. **Response** — `{ draw, recordsTotal, recordsFiltered, data: [ ... ] }`

Each row in `data` is a **raw draft** — HTML snippets, nested objects, Egyptian phone numbers in every format. Example:

```json
{
  "invoice_no": "DR2026/30809",
  "contact_name": "<a href=\"https://erp.hvarstore.com/contacts/49865\">يسري الحصري</a>",
  "contact_name_text": "يسري الحصري",
  "mobile": "01555512082",
  "shipping_state": "الاسكندريه",
  "shipping_city": "المنشيه",
  "shipping_address": "العنوان: ٣ شارع الشوربجي...",
  "final_total": "<span class=\"final-total\" data-orig-value=\"1850.0000\">EGP 1,850.00</span>"
}
```

---

## Act 2 — The Transformation (`_erp_row_to_order`)

We turn that raw object into a **clean order payload** our system understands.

### Field Mapping

| ERP (raw) | Our Field | What We Do |
|-----------|-----------|------------|
| `invoice_no` | `erp_order_id` | `"DR2026/30809"` — keeps identity across systems |
| `mobile` or `whatsapp` | `customer_phone` | Strip, validate — will be normalized next |
| `contact_name_text` | `customer_name` | Plain text (avoid HTML) |
| `shipping_address` | `delivery_address` | Copy |
| `shipping_state` | `governorate` | Copy |
| `shipping_city` | `city` | Copy |
| `final_total` (HTML) | `cod_amount` | Regex: `data-orig-value="1850.0000"` → `1850.0` |

### Fixed Values (we decide)

- `source` = `'erp'`
- `service_type` = `'sell'`
- `status` = `'new'`
- `attempt_count` = `0`

### Example: Before → After

```
BEFORE (ERP)                    AFTER (order_data)
────────────────────────────────────────────────────────
invoice_no: "DR2026/30809"  →   erp_order_id: "DR2026/30809"
mobile: "01555512082"       →   customer_phone: "01555512082"
contact_name_text: "يسري"   →   customer_name: "يسري الحصري"
final_total: "<span...>"    →   cod_amount: 1850.0
(shipping_*)                →   delivery_address, governorate, city
(nothing)                   →   source: "erp", status: "new"
```

---

## Act 3 — The Gates (Skip or Continue)

Before any insert, three checks:

| Gate | Condition | Outcome |
|------|-----------|---------|
| **1. Missing data** | No `customer_phone` or no `erp_order_id` | Skip — can't work without identity and contact |
| **2. Already exists** | `SELECT * FROM orders WHERE erp_order_id = ?` returns a row | Skip — already synced, no duplicate |
| **3. Pass** | Both present, not in DB | Continue to enrichment |

---

## Act 4 — Bosta Enrichment (`_bosta_enrich_order`)

**Why:** The agent will need Bosta tracking to confirm delivery. We try to fetch it **once** at sync time.

1. Call `get_customer_orders_unified(customer_phone)` → Bosta API search by phone
2. Take first order's `trackingNumber` and `id`
3. If found → add to `order_data`:
   - `bosta_tracking` = tracking number
   - `bosta_order_id` = Bosta order ID
4. If not found → no error, order still created (enrichment is best-effort)

```
order_data (before)     order_data (after Bosta)
─────────────────────  ─────────────────────────────
customer_phone: 01...  customer_phone: 01...
erp_order_id: DR...    erp_order_id: DR...
                       bosta_tracking: "BOS123..."   ← if match
                       bosta_order_id: "xyz"        ← if match
```

---

## Act 5 — Phone Normalization (`create_order`)

**Where:** `app/models/order.py` → `create_order()`

Egyptian numbers arrive as `01XXXXXXXXX`, `+201XXXXXXXXX`, `201XXXXXXXXX`, etc. We standardize to **`01XXXXXXXXX`** (11 digits).

| Input | Output |
|-------|--------|
| `01555512082` | `01555512082` |
| `+201555512082` | `01555512082` |
| `201555512082` | `01555512082` |
| `1555512082` | `01555512082` |

Uses `normalize_phone_safe()` — on failure returns original; never blocks insert.

---

## Act 6 — The Insert

**SQL:**
```sql
INSERT INTO orders (
  source, service_type, status, attempt_count,
  erp_order_id, bosta_tracking, bosta_order_id,
  customer_phone, customer_name, delivery_address,
  governorate, city, cod_amount
) VALUES (
  'erp', 'sell', 'new', 0,
  'DR2026/30809', 'BOS123...', 'xyz',
  '01555512082', 'يسري الحصري', 'العنوان: ...',
  'الاسكندريه', 'المنشيه', 1850.00
)
```

**Auto-set by MySQL:** `id` (AUTO_INCREMENT), `created_at` (CURRENT_TIMESTAMP), `updated_at` (ON UPDATE)

**Defaults we add:** `source='direct'` overwritten to `'erp'`, `status='new'`, `attempt_count=0`

---

## What Gets Stored (orders table)

| Column | Example | From |
|--------|---------|------|
| `id` | 1 | MySQL AUTO_INCREMENT |
| `source` | `erp` | Fixed |
| `service_type` | `sell` | Fixed |
| `status` | `new` | Fixed |
| `attempt_count` | 0 | Fixed |
| `erp_order_id` | `DR2026/30809` | ERP invoice_no |
| `bosta_tracking` | `BOS123...` or NULL | Bosta API |
| `bosta_order_id` | `xyz` or NULL | Bosta API |
| `customer_phone` | `01555512082` | ERP mobile → normalized |
| `customer_name` | `يسري الحصري` | ERP contact_name_text |
| `delivery_address` | Full address text | ERP shipping_address |
| `governorate` | `الاسكندريه` | ERP shipping_state |
| `city` | `المنشيه` | ERP shipping_city |
| `cod_amount` | 1850.00 | ERP final_total (parsed) |
| `created_at` | 2026-02-26 19:44:19 | MySQL |
| `converted_to_ticket_id` | NULL | Set when agent confirms → ticket |

**Not stored from ERP (yet):** `transaction_date`, `contact_id`, `shipping_details`, `business_location`, `added_by`, `commission_agent`, etc. — available in raw if we need them later.

---

## What Happens Next (Order Lifecycle)

```
orders.status = 'new'
       │
       │  Agent calls customer
       ├──▶ confirmed  → Leader approves → Ticket created (converted_to_ticket_id set)
       ├──▶ scheduled  → Callback date set
       ├──▶ canceled   → Reason stored
       └──▶ no_answer×3 → status unchanged; stays in queue
```

See [order-lifecycle.md](order-lifecycle.md) for the full state machine.

---

## One-Line Summary

> **ERP draft → map fields → skip if dup → Bosta enrich → normalize phone → INSERT orders.**
