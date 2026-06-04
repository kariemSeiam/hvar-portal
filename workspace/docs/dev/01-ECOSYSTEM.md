# Ecosystem Map — All Systems, All Connections

---

## The Single Mental Model

```
CUSTOMERS
    │
    ▼
hvarstore.com  ←──────────────── THIS IS WHAT WE BUILD
(New Hvar Site)
    │
    │  HTTP webhooks (orders)
    │  Direct MySQL (products, stock, contacts, tickets)
    ▼
┌──────────────────────────────────────────────────────────────┐
│                   hvar_erp  (MySQL 8)                        │
│                  THE SINGLE DATABASE                         │
│                                                              │
│  transactions / contacts / products / variations /           │
│  variation_location_details / service_tickets /              │
│  cities / districts / categories / brands                    │
└──────────────────────────────────────────────────────────────┘
    │                           │
    ▼                           ▼
HVAR-ERP                      MCRM
(Laravel 10)                  (Flask + React)
Inventory, accounting,        Call center, hub tickets,
order management              customer 360°

    ← STAFF-FACING SYSTEMS — NOT TOUCHED IN THIS PROJECT →
```

---

## System Registry

| System | Tech | URL | Purpose | Touched? |
|--------|------|-----|---------|---------|
| **New Hvar Site** | Flask + React | hvarstore.com | Customer portal | **BUILDING** |
| MCRM | Flask 3 + React 18 | mcrm.hvarstore.com | Staff operations | Read patterns. Don't modify. |
| Hvar-ERP | Laravel 10 | internal | Business management | Fire webhooks to it. Read DB. |
| Old hvarstore.com | Active eCommerce/Dukan | hvarstore.com | → REPLACED | — |

---

## What the New Site Reads from the DB

All reads are direct SQL against `hvar_erp`:

| What | Tables | API Endpoint |
|------|--------|-------------|
| Product catalog | `products`, `variations`, `variation_location_details`, `categories` | `GET /api/products` |
| Single product + stock | Same + join on `location_id` | `GET /api/products/:slug` |
| Governorates list | `cities` | `GET /api/locations/governorates` |
| Districts list | `districts` | `GET /api/locations/districts/:govId` |
| Customer lookup | `contacts WHERE mobile=:phone` | (internal, called on auth) |
| Order history | `transactions WHERE website_order_id IS NOT NULL AND contact_id=:id` | `GET /api/orders` |
| Order tracking | `transactions.bill_code` (Bosta number) | Inside `GET /api/orders/:id` |
| Ticket list | `service_tickets WHERE contact_id=:id` | `GET /api/tickets` |
| Ticket detail | `service_tickets`, `products`, `transactions` | `GET /api/tickets/:id` |

---

## What the New Site Writes to the DB

| What | Table(s) | When |
|------|---------|------|
| New customer | `contacts` (INSERT) | First checkout with unknown phone |
| New order | Our own `orders` table (new) | On checkout confirmation |
| New service ticket | `service_tickets` (INSERT) | On service request form submit |
| Payment intent | `pending_payments` (new) | Before Kashier redirect |

**Note on orders:** We maintain our own `orders` table (separate from ERP's `transactions`). Our order is the source for `website_order_id` that goes to the ERP. See `02-ERP-CONTRACT.md`.

---

## What the New Site DOES NOT Write

| Table | Owner | Reason |
|-------|-------|--------|
| `transactions` | ERP | ERP creates these via webhook |
| `transaction_sell_lines` | ERP | Created alongside transaction |
| `transaction_payments` | ERP | Created by ERP on order sync |
| `variation_location_details` | ERP | Stock is ERP territory |
| `account_transactions` | ERP | Accounting — auto-created by ERP |

---

## Integration: New Site → ERP (Order Sync)

When customer places an order, fire this webhook to ERP:

```
POST /websiteintegration/webHooksyncOrdersGet
```

ERP creates `transactions` row: `type='sell'`, `status='draft'`, `website_order_id=our_id`.

MCRM call center confirms → `status='final'` → Bosta auto-created → stock deducted.

Full contract in `02-ERP-CONTRACT.md`.

---

## Integration: New Site → ERP (Order Cancel)

When customer or system cancels:

```
1. Set our order: status='cancelled', cancelled_at=NOW()
2. Fire: POST /websiteintegration/webHooksyncOrdersDelete { order_id: our_id }
3. ERP removes the draft transaction
```

NEVER delete our order row. NEVER fire the webhook AFTER deleting our record.

---

## Integration: New Site ↔ Kashier

Kashier (kashier.io) handles card, installments, wallet payments.

1. We generate HPP URL + HMAC hash → redirect customer to Kashier
2. Kashier processes payment → redirects back → sends `x-kashier-signature` header
3. We validate signature → confirm payment → finalize order

Full spec in `03-KASHIER.md`.

---

## Integration: Order Tracking via Bosta

Bosta tracking number (`bill_code`) is stored on ERP's `transactions` row after MCRM creates the shipment.

The new site reads it:
```sql
SELECT bill_code FROM transactions WHERE website_order_id = :our_order_id
```

If `bill_code IS NULL`: order not yet confirmed by MCRM. Show "طلبك قيد التأكيد".
If `bill_code IS NOT NULL`: show tracking link to `https://bosta.co/ar-eg/tracking-shipments?shipment-number={bill_code}`

We don't integrate with Bosta API directly. We just read the tracking number from the ERP DB and point the customer to Bosta's tracking page.

---

## Service Tickets: New Site ↔ MCRM

The `service_tickets` table in `hvar_erp` is shared:

- **New site** creates tickets (PENDING) when customer submits service request
- **MCRM hub** reads and processes tickets, advances their state
- **New site** reads current ticket state and shows it to the customer

No API calls between the two systems. Direct DB access. Same table. Different permissions:
- New site: INSERT + SELECT WHERE contact_id = current_customer
- MCRM: full CRUD on all tickets

---

## Ports & Domains

| Service | Domain | Port | Notes |
|---------|--------|------|-------|
| New Hvar Site | hvarstore.com | 5000 | Flask serves React dist/ |
| MCRM | mcrm.hvarstore.com | 5050 | Already deployed |
| ERP | erp.hvarstore.com (internal) | 80/443 | Laravel, Nginx proxy |
| MySQL | 127.0.0.1 | 3306 | Never `localhost` |

---

## CORS Policy

The Flask backend must allow:
```python
CORS_ORIGINS = [
    "https://hvarstore.com",
    "https://mcrm.hvarstore.com",  # Keep for inter-system calls
    "http://localhost:5173",        # Dev frontend
]
```
