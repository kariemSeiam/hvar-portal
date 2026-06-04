# Call Center — ERP, Bosta, Customer & Ticket Data Relations

> **What you have:** ERP rows (live API) → synced to `orders`; Bosta (API + cache); `customers`, `orders`, `calls`, `service_tickets` (DB). Relations by **phone** and **tracking**. See [calls-model.md](calls-model.md) for schema.

---

## 1. ERP data (what you really have)

**Source:** `GET /api/erp/drafts` → proxies to `ERP_BASE_URL/sells/draft-dt`. Response is **DataTables** JSON (whatever the ERP returns). **Not stored in our DB.**

### 1.1 ERP request columns (what we ask for)

The backend sends these column names to the ERP; the response rows are typically keyed by these or similar:

| Column key (request) | Used as / Frontend mapping |
|----------------------|----------------------------|
| `transaction_date`   | Order date (parsed as DD/MM/YYYY HH:MM AM/PM) |
| `invoice_no`         | Order number / id seed (e.g. DR2026/00000) |
| `contact_name`       | Customer name (frontend may see `contact_name_text`) |
| `contacts.mobile` → `mobile` | Customer phone — **link key to Bosta & customers** |
| `whatsapp`          | Optional second contact |
| `business_location`  | Branch |
| `total_items` / `total_quantity` | Items count |
| `added_by`           | Created by |
| `commission_agent`   | Sales rep |
| `shipping_state`     | Governorate |
| `shipping_city`       | City |
| `shipping_address`   | Full address |
| `shipping_details`   | Notes / description |

Frontend also uses (if present): `contact_id`, `final_total` / `total` / `amount`, `contact_name_text`.

### 1.2 ERP → frontend “order” (in-memory only)

`callCenterAPI.js` converts each ERP row to a **client-side order** with:

- `id` (derived from `invoice_no` hash), `order_number` = `invoice_no`
- `customer.name`, `customer.phone` from `contact_name_text`, `mobile`
- `address_governorate`, `address_city`, `address_full`, `shipping_details`
- `cod_amount`, `items_count`, `order_description`, `status: 'new'`, `attempt_count: 0`
- `bosta_tracking_number`, `bosta_status` (null until Bosta is used)

**Relation:** `mobile` (normalized to 01XXXXXXXXX) is the **link** to Bosta search and to `customers.phone`.

---

## 2. Bosta data (customer “orders” / deliveries)

**Source:** Bosta API → unified format via `app/utils/bosta_converter.py`. Stored in **cache** table `bosta_orders` (by tracking) and in **customers.bosta_orders** (JSON array).

### 2.1 Bosta unified order (one delivery)

After `convert_bosta_order()` each Bosta delivery looks like:

| Field | Content |
|-------|--------|
| `type` | SEND / RETURN TO ORIGIN / CUSTOMER RETURN PICKUP / EXCHANGE |
| `trackingNumber` | **Link key** to cache and to `service_tickets.original_tracking` |
| `status` | `{ confirmed, timeline }` |
| `customer` | `{ phone, secondPhone, name }` — **phone links to customers.phone** |
| `customerAddress` | `{ city, zone, district, fullAddress }` — Bosta `city` = governorate, `zone` = city |
| `package` | `{ type, description, itemsCount }` |
| `financial` | `{ cod, bostaFees }` |
| `communication` | `{ calls, sms, attempts, lastCall }` |
| `timestamps` | `{ created, updated, collected, collectedFromConsignee, scheduled }` |

Type 25 (Customer Return Pickup): address from `pickupAddress`, description from `returnSpecs.packageDetails`.

### 2.2 Where Bosta data lives

| Place | Content |
|-------|--------|
| **API only** | Search by phone/name/tracking; get by tracking (with optional cache bypass) |
| **Table `bosta_orders`** | `(tracking_number, order_data JSON)` — cache per tracking |
| **Column `customers.bosta_orders`** | JSON array of unified Bosta orders for that customer (synced by phone) |

**Relation:** Bosta `customer.phone` (normalized) = `customers.phone`. Bosta `trackingNumber` = `service_tickets.original_tracking` (and optionally `new_tracking_send` / `new_tracking_receive`).

---

## 3. Customer data (DB)

**Table:** `customers`

| Column | Purpose |
|--------|--------|
| `id` | PK |
| `name`, `phone` (unique), `phone_secondary` | Identity; **phone** = 01XXXXXXXXX normalized |
| `governorate`, `city`, `address_details` | Address (Bosta: city→governorate, zone→city) |
| `bosta_orders` | JSON array of unified Bosta orders |
| `customer_services` | JSON (e.g. service history) |
| `created_by`, `updated_by`, `created_at`, `updated_at` | Audit |

**Filled by:** Manual create/update (API) or **Bosta sync** (`sync_customer_data(phone)` → search Bosta by phone, upsert customer, set `bosta_orders`).

**Relation:** Same phone can appear in ERP (`mobile`), Bosta (`receiver.phone`), and `customers.phone` — that is the **customer link** across systems.

---

## 4. Service tickets (DB)

**Table:** `service_tickets`

| Column | Purpose |
|--------|--------|
| `id`, `ticket_number` | PK, display id (e.g. HVR-…) |
| `customer_id` | **FK → customers.id** |
| `service_type` | replacement / maintenance / return / sell |
| `status` | PENDING → … → COMPLETED / CANCELLED |
| `original_tracking` | **Bosta tracking** (delivery that triggered the ticket) |
| `new_tracking_send`, `new_tracking_receive` | Bosta trackings for send/return legs |
| … | reason, notes, timestamps, etc. |

**Relation:** Ticket belongs to one **customer**. Ticket is linked to Bosta via **original_tracking** (and optionally new_tracking_*). Orders link to tickets via `orders.converted_to_ticket_id` when leader approves.

---

## 5. How they relate

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ERP (external, not stored)                                                  │
│  /sells/draft-dt → rows with mobile, contact_name, shipping_*, invoice_no   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                     mobile (01XXXXXXXXX) = link key
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BOSTA (API + cache)                                                         │
│  Search by phone → deliveries (unified). By tracking → single order.          │
│  customer.phone matches mobile/customers.phone                               │
│  trackingNumber → bosta_orders cache + service_tickets.original_tracking     │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                     phone → upsert; bosta_orders JSON
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  CUSTOMERS (DB)                                                              │
│  id, name, phone, governorate, city, address_details, bosta_orders (JSON)   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                     customer_id FK
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SERVICE_TICKETS (DB)                                                        │
│  customer_id, service_type, status, original_tracking, new_tracking_*        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Link keys summary

| Link | From | To | Key |
|------|------|----|-----|
| ERP → Bosta | ERP row | Bosta search | `mobile` (normalized) = Bosta search phone |
| ERP → Customer | ERP row | customers | `mobile` (normalized) = `customers.phone` (after Bosta sync or manual) |
| Bosta → Customer | Bosta order | customers | `customer.phone` → upsert; orders stored in `bosta_orders` |
| Bosta → Ticket | Bosta delivery | service_tickets | `trackingNumber` = `original_tracking` (or new_tracking_*) |
| Customer → Tickets | customers | service_tickets | `customers.id` = `service_tickets.customer_id` |

### 5.2 What does not exist (yet)

- **`orders` table** — would store ERP sync rows or direct “call-center orders”; would have `customer_id`, `source` (erp/direct), `status`, etc. **Not in DB.**
- **`calls` table** — would store per-attempt call outcomes linked to order or ticket. **Not in DB.**
- **Stored link ERP → Bosta** — today the frontend gets ERP rows, then can call Bosta search by `mobile`; nothing is persisted that says “this ERP invoice_no is this Bosta tracking.”

---

## 6. Quick reference: same customer across systems

| System | Identifier | Typical use |
|--------|------------|-------------|
| ERP | `mobile`, `contact_name`, `invoice_no` | Draft sell orders; phone used to find Bosta/customer |
| Bosta | `receiver.phone`, `trackingNumber` | Deliveries; phone → customer sync; tracking → ticket |
| Our DB | `customers.phone` (01XXXXXXXXX), `customers.id` | Single customer record; `bosta_orders` cached |
| Our DB | `service_tickets.customer_id`, `service_tickets.original_tracking` | Ticket tied to customer and one Bosta delivery |

All relations that exist today are: **phone** (ERP ↔ Bosta ↔ customer) and **tracking** (Bosta ↔ bosta_orders cache, Bosta ↔ service_tickets).
