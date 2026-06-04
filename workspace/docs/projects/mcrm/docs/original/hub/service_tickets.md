# Service Tickets

> Core hub workflow. 4 types: R (Replacement) · M (Maintenance) · T (Return) · S (Sell)
> Files: `app/api/service_api.py` · `app/services/service_manager.py` · `app/models/service_ticket.py`

---

## Schema

```sql
service_tickets (
  id, ticket_number VARCHAR(50) UNIQUE,    -- HVR251020001
  customer_id INT → customers(id),
  service_type VARCHAR(20),                -- replacement|maintenance|return|sell
  status VARCHAR(30),
  priority VARCHAR(10) DEFAULT 'normal',   -- normal|high|urgent
  reason TEXT, notes TEXT,
  cost_adjustment DECIMAL(10,2) DEFAULT 0, -- cumulative
  original_tracking VARCHAR(100),          -- original Bosta order
  new_tracking_send VARCHAR(100),          -- sent TO customer
  new_tracking_receive VARCHAR(100),       -- received FROM customer
  customer_type VARCHAR(20) DEFAULT 'customer', -- customer|merchant (sell tickets)
  created_by, created_at, updated_at, completed_at
)

service_items (
  id, ticket_id → service_tickets,
  item_id → stock_items, quantity INT,
  direction VARCHAR(10),       -- SEND (stock out) | RECEIVE (stock in)
  condition VARCHAR(10),       -- valid | damaged
  price_customer DECIMAL       -- override; NULL = use stock_items base price
)

service_ticket_history (
  ticket_id, old_status, new_status, notes TEXT, created_by, created_at
)

ticket_sequences (service_type, sequence_date DATE, sequence_number INT)
-- PRIMARY KEY (service_type, sequence_date) — atomic daily counter
```

**Ticket number**: `HV{R|M|T|S}{YYMMDD}{NNN}` · daily per type · Example: `HVR251020001`

---

## Statuses

`PENDING → CONFIRMED → IN_PROCESS → READY_FOR_DISPATCH → SENT → [RETURNED →] COMPLETED`

`CANCELLED` available at any active state.

---

## State Machines

### Replacement (R)
```
PENDING   →[confirm]→   CONFIRMED   →[start_preparation]→   IN_PROCESS
IN_PROCESS →[ready_for_dispatch]→   READY_FOR_DISPATCH   →[scan_outbound]→   SENT
SENT      →[scan_inbound]→   RETURNED   →[validate_items]→   COMPLETED
Any active →[cancel]→ CANCELLED
```
Stock: RESERVE at `confirm`, COMMIT (→ on_hand ↓) at `scan_outbound`, RECEIVE at `validate_items`.

### Maintenance (M)
```
PENDING   →[confirm]→   CONFIRMED   →[scan_inbound]→   IN_PROCESS
IN_PROCESS →[start_maintenance]→   IN_PROCESS (logs start)
           →[complete_maintenance]→   IN_PROCESS (processes items)
           →[mark_ready]→   READY_FOR_DISPATCH   →[scan_outbound]→   SENT
SENT      →[mark_delivered]→   COMPLETED
```
Stock: NO reservation. `complete_maintenance` = manual stock ops (SEND items ↓ on_hand, RECEIVE items ↑ on_hand or ↑ damaged).

### Return (T)
```
PENDING   →[confirm]→   CONFIRMED   →[scan_inbound]→   IN_PROCESS
IN_PROCESS →[validate_items]→   COMPLETED
```
Stock: RECEIVE at `validate_items` (valid → ↑ on_hand, damaged → ↑ quantity_damaged).

### Sell (S)
```
PENDING   →[confirm]→   CONFIRMED   →[start_preparation]→   IN_PROCESS
IN_PROCESS →[ready_for_dispatch]→   READY_FOR_DISPATCH   →[scan_outbound]→   SENT
SENT      →[scan_inbound]→   RETURNED (optional)   →[validate_items]→   COMPLETED
         OR →[validate_items]→   COMPLETED (direct)
```
Stock: RESERVE parts at `confirm` (products = reference only, no stock), COMMIT at `scan_outbound`.

---

## Actions Reference

All actions via: `POST /api/tickets/{id}/action` · `{ action, user_id, ...params }`

| Action | Type | From → To | Required params |
|--------|------|-----------|-----------------|
| `confirm` | R/S | PENDING→CONFIRMED | R: `new_tracking_send` |
| `confirm` | M/T | PENDING→CONFIRMED | optional `new_tracking_receive` |
| `start_preparation` | R/S | CONFIRMED→IN_PROCESS | — |
| `scan_inbound` | M/T | CONFIRMED→IN_PROCESS | `tracking_number` |
| `scan_inbound` | R | SENT→RETURNED | `tracking_number` |
| `start_maintenance` | M | IN_PROCESS→IN_PROCESS | — (logs "بدأت") |
| `complete_maintenance` | M | IN_PROCESS→IN_PROCESS | `items` array |
| `mark_ready` | M | IN_PROCESS→READY_FOR_DISPATCH | `new_tracking_send` |
| `ready_for_dispatch` | R/S | IN_PROCESS→READY_FOR_DISPATCH | — |
| `scan_outbound` | R/M/S | READY_FOR_DISPATCH→SENT | `tracking_number` |
| `validate_items` | R/T | RETURNED or IN_PROCESS→COMPLETED | `item_validations` |
| `mark_delivered` | M | SENT→COMPLETED | — |
| `complete` | — | Any→COMPLETED | — (legacy) |
| `cancel` | — | Any active→CANCELLED | — (use legacy endpoint) |

**Cancel**: use legacy `POST /api/tickets/{id}/cancel` (releases reservations).

**confirm** can also update: `city`, `governorate`, `address_details`, `phone`, `phone_secondary`, `items`, `cost_adjustment`.
Cannot update: `original_tracking`, `service_type`, `customer_id`, customer `name`.

**complete_maintenance** available actions logic (reads history reverse):
- Last IN→IN entry with "بدأت" → show `complete_maintenance`
- Last IN→IN entry with "اكتملت" → show `mark_ready`
- No such entry → show `start_maintenance`

---

## Stock Operations

| Operation | When | Effect |
|-----------|------|--------|
| `reserve_stock()` | R/S confirm | `quantity_reserved ↑`, movement_type=RESERVE |
| `commit_reservation()` | R/S scan_outbound | `quantity_reserved ↓`, `quantity_on_hand ↓`, movement_type=SEND |
| `process_return(valid)` | validate_items | `quantity_on_hand ↑`, movement_type=RECEIVE |
| `process_return(damaged)` | validate_items | `quantity_damaged ↑`, movement_type=RECEIVE |
| `cancel_reservation()` | cancel | `quantity_reserved ↓` only (on_hand unchanged) |
| M: SEND item in complete_maint | M complete_maintenance | `quantity_on_hand ↓`, movement_type=SEND |
| M: RECEIVE item in complete_maint | M complete_maintenance | `quantity_on_hand ↑` or `quantity_damaged ↑` |

Movement types: `RESERVE` · `SEND` · `RECEIVE` · `MANUAL`

---

## Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/tickets/create` | Create ticket |
| GET | `/api/tickets/` | List + filter + paginate |
| GET | `/api/tickets/{id}` | Get with full context |
| GET | `/api/tickets/{id}/history` | Status change log |
| GET | `/api/tickets/{id}/actions` | Available actions array |
| POST | `/api/tickets/{id}/action` | Execute action |
| POST | `/api/tickets/{id}/confirm` | Legacy confirm (use action) |
| POST | `/api/tickets/{id}/cancel` | Cancel + release reservations |

### Create Ticket

```
POST /api/tickets/create
{
  "type": "replacement|maintenance|return",
  "customer_id": INT,          -- OR provide name+phone for new/existing by phone
  "user_id": INT,
  "items": [...],              -- required for replacement
  "original_tracking": "...",  -- optional; falls back to generated ticket_number
  "priority": "normal|high|urgent",
  "notes": "...", "reason": "...", "cost_adjustment": 0
}
```

Items format: `[{ "item_id", "quantity", "direction": "send|receive", "condition": "valid|damaged" }]`

Returns 201 with full ticket. Errors: 400 validation, 500 creation.

### List Tickets

```
GET /api/tickets/?status=PENDING&customer_id=123&limit=20&offset=0&include_bosta=true&force_sync=false
```

Always returns `{ data: [...], pagination: { total, limit, offset, has_more } }`.
Batch-enriched: items (JOIN), Bosta (parallel ThreadPoolExecutor max 5), history, movements, scans.

---

## Bosta Integration

Tickets enriched with Bosta data via `original_tracking`, `new_tracking_send`, `new_tracking_receive`.

Cache strategy: `bosta_orders` table → API fallback → `force_sync=true` to bypass.

Perf targets:
- Single ticket: <100ms (cached) / <500ms (API)
- List 20 tickets: <300ms (cached) / <2000ms (mixed)

Tracking lookup: `WHERE original_tracking=? OR new_tracking_send=? OR new_tracking_receive=?`
Index: `idx_service_tickets_all_tracking`

---

## Customer Integration

Update during create or confirm:
- `city`, `governorate`, `address_details`, `phone`, `phone_secondary`

`customers.customer_services` JSON auto-updated on: create, confirm, complete.

---

## Pricing (Sell tickets)

```
service_items.price_customer → ticket-specific override
  NULL → use stock_items.price_customer or stock_items.price_merchant
         based on service_tickets.customer_type (customer|merchant)
```

---

## Error Handling

`ServiceManagerException` — business logic violations:
- Invalid state transition: `"Invalid state transition from 'PENDING' to 'SENT'"`
- Missing fields, insufficient stock, invalid condition

HTTP: 400 validation · 404 not found · 500 system

---

## ⚠️ Known Gaps

- `cancel` action not implemented in `/action` endpoint — use `POST /api/tickets/{id}/cancel`
- `original_tracking` cannot be updated after creation
