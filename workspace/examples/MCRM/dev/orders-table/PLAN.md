# Orders Table — Vision, Schema, Relations, Implementation Plan

> **Eat-ready.** One document: what the orders table is, how it relates to Bosta/tickets/calls/customers/ERP, and the concrete steps to add it.

---

## 1. Vision (what we're building)

### 1.1 One table for all call-center “orders”

- **`orders`** = the call-center working record for every **actionable** request:
  - **PATH A:** From ERP (`/sells/draft-dt`) — sell order needing confirmation; we persist it with `source='erp'`, `service_type='sell'`, optional Bosta data after enrich.
  - **PATH B:** From direct/inbound — agent creates order when they reclassify from ASK to sell/R/M/T and confirm; `source='direct'`, `service_type` set at confirm.
- **ASK-only calls** do **not** create an order (call log only; no row in `orders`).

### 1.2 Bosta: optional on the order

- An order **may or may not** have a Bosta tracking:
  - **ERP:** After sync we do Bosta lookup by phone (or ERP tracking if we have it); we store `bosta_tracking` (and optionally `bosta_order_id`) on the order when we get a match.
  - **Direct:** Agent may search Bosta and attach a tracking to the order, or leave it null (e.g. new sell with no prior delivery).
- So: **“all orders of Bosta”** = we don’t duplicate Bosta deliveries into `orders`. We **reference** Bosta by storing one tracking (and optional id) on the order when relevant. Full Bosta data stays in `bosta_orders` cache and `customers.bosta_orders`.

### 1.3 One ticket per order (when converted)

- When an order is **confirmed** and leader **approves**, we create **one** `service_tickets` row.
- That ticket is **“the ticket applied to this order”** — linked back via `service_tickets.created_from_order_id = orders.id`.
- The ticket **may or may not** have `original_tracking`:
  - ERP sell: usually we set `original_tracking` = order’s `bosta_tracking` (same delivery we confirmed).
  - Direct R/M/T/S: may have a Bosta tracking (if agent picked one) or none (e.g. new sell with no tracking yet).

So: **orders table holds all call-center orders; each order has 0 or 1 Bosta tracking reference; each order has 0 or 1 resulting ticket, and that ticket may or may not have a Bosta tracking.**

---

## 2. Entity relationship (high level)

```
ERP (external)                    Bosta (API + bosta_orders cache)
     │                                      │
     │ mobile / invoice_no                  │ trackingNumber, customer.phone
     ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ORDERS (new)                                                            │
│  id, source (erp|direct|bosta), service_type (R|M|T|S), status,         │
│  erp_order_id, bosta_tracking, bosta_order_id (optional),               │
│  customer_id, customer_phone, customer_name, governorate, city,         │
│  delivery_address, cod_amount, attempt_count, next_action_at,             │
│  scheduled_callback_at, last_attempt_at, cancellation_reason,            │
│  converted_to_ticket_id (optional reverse link)                          │
└─────────────────────────────────────────────────────────────────────────┘
     │                                      │
     │ 1 ──────────── *                    │ 0..1
     ▼                                      ▼
┌─────────────────┐                  ┌─────────────────────────────────────┐
│  CALLS (new)    │                  │  SERVICE_TICKETS (existing)          │
│  linked_to_     │                  │  created_from_order_id (new column) │
│  order_id       │                  │  original_tracking (optional)       │
└─────────────────┘                  └─────────────────────────────────────┘
     │
     │ ASK-only: linked_to_order_id NULL, no order row
     ▼
  CUSTOMERS (existing)  ←──  orders.customer_id, tickets.customer_id
```

- **orders** is the single place for “this is a call-center order we’re working or have worked.”
- **Bosta** is referenced by `orders.bosta_tracking` (and optionally `bosta_order_id`), not by copying all Bosta fields.
- **Tickets “applied” to an order** = the at-most-one ticket with `created_from_order_id = order.id`; that ticket may have `original_tracking` or not.

---

## 3. Orders table schema (canonical)

Aligned with `docs/call-center/calls-model.md` and frontend `callCenterAPI` order shape. `service_type` stored as single char (R/M/T/S) or 'sell' for compatibility; backend can normalize.

```sql
CREATE TABLE orders (
    id                      INT PRIMARY KEY AUTO_INCREMENT,

    -- Source & type
    source                  ENUM('erp', 'bosta', 'direct') NOT NULL,
    service_type            VARCHAR(20) NULL COMMENT 'R|M|T|S|sell; NULL only for direct before reclassify; erp always sell',

    -- Lifecycle
    status                  ENUM('new', 'scheduled', 'confirmed', 'converted', 'canceled') NOT NULL DEFAULT 'new',
    attempt_count           INT NOT NULL DEFAULT 0,
    next_action_at          DATETIME NULL,
    scheduled_callback_at   DATETIME NULL,
    last_attempt_at         DATETIME NULL,
    cancellation_reason     VARCHAR(100) NULL,

    -- External refs (optional)
    erp_order_id            VARCHAR(100) NULL COMMENT 'e.g. invoice_no DR2026/00000',
    bosta_tracking          VARCHAR(100) NULL COMMENT 'Bosta tracking when known',
    bosta_order_id          VARCHAR(100) NULL COMMENT 'Bosta API id if needed',

    -- Customer (denormalized + FK for consistency)
    customer_id             INT NULL,
    customer_phone          VARCHAR(20) NOT NULL COMMENT '01XXXXXXXXX normalized',
    customer_name           VARCHAR(200) NULL,
    delivery_address         TEXT NULL,
    governorate              VARCHAR(100) NULL,
    city                     VARCHAR(100) NULL,
    cod_amount               DECIMAL(10,2) NULL,

    -- Resulting ticket (when converted)
    converted_to_ticket_id   INT NULL,

    -- Audit
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_orders_status_next_action (status, next_action_at),
    INDEX idx_orders_source_type (source, service_type),
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_phone (customer_phone),
    INDEX idx_orders_erp (erp_order_id),
    INDEX idx_orders_bosta (bosta_tracking),
    INDEX idx_orders_converted (converted_to_ticket_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (converted_to_ticket_id) REFERENCES service_tickets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Call-center working record; one row per actionable order (ERP or direct)';
```

- **ERP:** `source='erp'`, `service_type='sell'`, `erp_order_id` = invoice_no; after Bosta enrich set `bosta_tracking` (and optionally `bosta_order_id`).
- **Direct:** `source='direct'`, `service_type` NULL until reclassify, then R/M/T/S or sell.
- **Bosta:** Optional; only `bosta_tracking` (+ optional `bosta_order_id`) on the order; no “all Bosta orders” stored in `orders` — Bosta stays in its cache and in `customers.bosta_orders`.

---

## 4. Calls table schema (canonical)

From `docs/call-center/calls-model.md`. Each call attempt links to one order **or** one ticket **or** neither (ASK-only).

```sql
CREATE TABLE calls (
    id                    INT PRIMARY KEY AUTO_INCREMENT,
    linked_to_order_id    INT NULL,
    linked_to_ticket_id   INT NULL,
    call_type             ENUM('ask','sell','replacement','maintenance','return') NOT NULL,
    status                ENUM('confirmed','scheduled','no_answer','canceled') NOT NULL,
    attempt_number        INT NOT NULL DEFAULT 1,
    agent_id              INT NULL COMMENT 'FK users when we have users table',
    customer_phone        VARCHAR(20) NULL,
    scheduled_callback_at DATETIME NULL,
    next_action_at        DATETIME NULL,
    notes                 TEXT NULL,
    cancellation_reason   VARCHAR(100) NULL,
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME NULL,

    INDEX idx_calls_order (linked_to_order_id),
    INDEX idx_calls_ticket (linked_to_ticket_id),
    INDEX idx_calls_phone (customer_phone),
    INDEX idx_calls_created (created_at),
    FOREIGN KEY (linked_to_order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (linked_to_ticket_id) REFERENCES service_tickets(id) ON DELETE SET NULL,
    CONSTRAINT chk_call_link CHECK (
        (linked_to_order_id IS NOT NULL AND linked_to_ticket_id IS NULL)
        OR (linked_to_order_id IS NULL AND linked_to_ticket_id IS NOT NULL)
        OR (linked_to_order_id IS NULL AND linked_to_ticket_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. service_tickets change (add link from ticket to order)

Current `service_tickets` has no `created_from_order_id`. Add it so that the **ticket** points to the order it was created from (and order can point back with `converted_to_ticket_id`).

```sql
ALTER TABLE service_tickets
  ADD COLUMN created_from_order_id INT NULL AFTER customer_id,
  ADD INDEX idx_service_tickets_created_from_order (created_from_order_id),
  ADD FOREIGN KEY (created_from_order_id) REFERENCES orders(id) ON DELETE SET NULL;
```

- When we create a ticket from an order (confirm-by-customer or leader approve after direct confirm), set `service_tickets.created_from_order_id = order.id` and `orders.converted_to_ticket_id = ticket.id`, `orders.status = 'converted'`.
- **Each ticket may or may not have Bosta tracking:** `original_tracking` stays optional; for ERP sell we usually set it from `order.bosta_tracking`.

---

## 6. Relations summary (reference)

| From          | To           | Key / meaning |
|---------------|--------------|----------------|
| orders        | customers    | `orders.customer_id` → `customers.id`; `orders.customer_phone` matches `customers.phone` when synced |
| orders        | Bosta        | Optional: `orders.bosta_tracking` = one Bosta delivery; full data in `bosta_orders` / Bosta API |
| orders        | service_tickets | 0..1: `orders.converted_to_ticket_id` = `service_tickets.id`; ticket has `created_from_order_id` = order.id |
| calls         | orders       | `calls.linked_to_order_id` = order when call was about an order |
| calls         | service_tickets | `calls.linked_to_ticket_id` = ticket when call was follow-up on a ticket |
| ERP           | orders       | We create order from ERP row; `orders.erp_order_id` = invoice_no; no ERP table in our DB |

---

## 7. Migration order (implementation steps)

1. **Create `orders`** (no FK to service_tickets yet).
2. **Create `calls`** (FK to orders; FK to service_tickets — service_tickets already exists).
3. **Alter `service_tickets`:** add `created_from_order_id`, index, FK to orders.
4. **Alter `orders`:** add `converted_to_ticket_id`, index, FK to service_tickets (so both directions are explicit).

Single migration file can do: create orders → create calls → alter service_tickets → alter orders (add converted_to_ticket_id). Run after backup.

---

## 8. API alignment (what backend must expose)

- **Queue:** `GET /api/call-center/orders` — list from `orders` with filters (status, source, service_type, search by phone, date range, governorate), pagination.
- **Single order:** `GET /api/call-center/orders/:id` — order + customer + Bosta data (from `bosta_tracking` lookup) + call history (from `calls` where `linked_to_order_id` = id).
- **Create order (direct):** `POST /api/call-center/orders` — insert order with source=direct, optional Bosta fields.
- **ERP sync:** Either backend calls ERP and inserts/updates `orders` (and triggers Bosta enrich), or frontend keeps calling ERP and a separate `POST /api/call-center/orders/sync` persists + enriches (design choice).
- **Call outcomes:** `POST /api/call-center/orders/:id/confirm-by-customer`, `schedule`, `no-answer`, `cancel` — each creates a `calls` row and updates `orders` (and on confirm creates ticket, sets `created_from_order_id` and `converted_to_ticket_id`).
- **ASK-only:** `POST /api/call-center/calls/ask-only` — insert `calls` with `linked_to_order_id` and `linked_to_ticket_id` NULL.
- **Customer 360°:** `GET /api/call-center/customers/:phone` — customer + orders (where customer_phone = normalized) + tickets (customer_id) + call history (calls where customer_phone or linked order/ticket).

Frontend `callCenterAPI.js` already expects these shapes; once backend has `orders` and `calls`, endpoints can return DB-backed data instead of in-memory.

---

## 9. Frontend fields → orders columns (mapping)

| Frontend (convertERPResponseToOrder / existing order) | orders column |
|------------------------------------------------------|---------------|
| id                                                   | id (real PK from DB) |
| order_number                                          | erp_order_id (for ERP) |
| customer.phone                                        | customer_phone |
| customer.name                                         | customer_name |
| address_governorate, address_city, address_full       | governorate, city, delivery_address |
| shipping_details                                      | can store in notes or separate column if we add it |
| cod_amount, items_count                               | cod_amount; items in order_items if we add that table later |
| status, attempt_count, next_action_at, scheduled_callback_date | status, attempt_count, next_action_at, scheduled_callback_at |
| last_call_at                                          | last_attempt_at |
| cancellation_reason                                   | cancellation_reason |
| bosta_tracking_number, bosta_status                    | bosta_tracking; bosta_status can come from live Bosta lookup |
| customer_id                                           | customer_id (after resolve from phone) |
| source_data (erp row)                                 | not stored; erp_order_id is enough |

---

## 10. What “all orders of Bosta” means (clarification)

- We do **not** create one `orders` row per Bosta delivery. Bosta deliveries stay in Bosta API + `bosta_orders` cache + `customers.bosta_orders`.
- We **do** create one `orders` row per **call-center order** (ERP draft we’re confirming, or direct request agent created). That order **may** reference **one** Bosta delivery via `bosta_tracking` (and optionally `bosta_order_id`).
- So: **orders table holds all call-center orders;** some of those orders have a Bosta tracking attached; each such order can result in **one** ticket, and that ticket may or may not have `original_tracking` set.

This gives a single place (orders) that “holds” the call-center view of work, with optional Bosta and optional ticket, and keeps Bosta as the source of truth for delivery data.

---

*Plan version: 1.0 | 2026-02-25 | Ready for implementation.*
