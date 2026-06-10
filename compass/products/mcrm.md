# mCRM Direction — هفار
> Updated 2026-06-06 from absorbed MCRM docs (~/Projects/hvar-mcrm/, 9 files ~80KB).
> `mcrm.hvarstore.com` — internal staff tool, not customer-facing.

---

## System Architecture

```
ERP  ──→  erp_sync_worker  ──→  orders (source=erp)
                                      │
Client Portal  ──→  POST /api/call-center/orders  (source=direct)
                                      │
                              Call Center Queue
                              (CustomerServicePage)
                                      │
                          Agent calls → confirms
                                      │
                          Leader approves
                                      │
                          service_tickets (Hub)
                              │        │        │        │
                             HVR      HVM      HVT      HVS
                         Replacement  Maint.  Return   Sell
```

**Stack:** React 18 + Vite 6 + TailwindCSS (RTL Arabic-first) / Flask Python port 5050 / MySQL / Bosta API (shipping) / JWT auth

**Live base:** `https://mcrm.hvarstore.com/api/`

---

## mCRM's Role

mCRM is the staff window into the same operations the customer touches through hvarstore.com. The customer submits a service request → it lands in mCRM. An ERP sell order is placed → it lands in mCRM. Everything flows through here before anything physically happens.

**mCRM's four jobs:**
1. **Call center queue** — agents work through orders, call customers, confirm or cancel
2. **Leader approval gate** — team leaders approve confirmed orders before tickets are created
3. **Hub execution** — Hub technicians execute the 4 ticket types (R/M/T/S) with stock operations
4. **Customer 360°** — lookup any customer by phone to see all orders, tickets, and call history

**What mCRM is NOT:**
- Not a product management interface (ERP handles that)
- Not a financial system (ERP + Kashier handle that)
- Not the customer portal (hvarstore.com is the customer-facing layer)
- Not a reporting dashboard (reports exist but are not the primary use)

---

## Roles

| Role | Internal name | Access level |
|------|--------------|--------------|
| Agent | `call_center` | Order queue, call actions, customer lookup |
| Team Leader | `team_leader` | Agent access + leader approval queue |
| Accounts | `accounts` | Financial view |
| Admin | `admin` | Full access + user management |

**Enforcement:** JWT Bearer tokens. Roles enforced at API layer — not just UI. An agent-scoped JWT rejected at the API endpoint is security. The UI hiding the button is UX convenience. Both must exist.

---

## Design System (mCRM ≠ Portal)

mCRM has its own design token layer, intentionally different from hvarstore.com:

```css
Primary:   bg-brand-red-600   (#e11d48)   ← slightly different from portal red
Secondary: bg-brand-blue-600  (#0284c7)   ← blue accent (portal doesn't use blue)
Font H:    font-cairo                      ← same as portal
Font B:    font-tajawal                    ← Tajawal body, NOT Inter (portal uses Inter for numbers)
Direction: dir="rtl"
Card:      rounded-lg shadow-sm border border-gray-200 p-6
```

**What does not belong in mCRM:**
- Grain texture overlay
- Ambient glow (ember red, warm amber radial gradients)
- Wilson motion patterns (scroll reveals, card shine)
- Warm ivory `#F5EDD8` background — use neutral gray instead
- Editorial photography or chef content
- Marketing copy of any kind

**What stays:**
- Hvar red for primary CTA actions (confirm, approve, submit)
- Cairo for all Arabic headings and labels
- RTL-first layout throughout
- Brand mark in header — this is recognizably Hvar, not a generic admin panel

---

## Design Principles for Internal Tools

### Density Over Beauty

Agents have tasks to complete. Every extra scroll, every unnecessary whitespace, every modal that requires two clicks to dismiss costs time across hundreds of daily operations.

- Table rows can be denser than customer portal cards
- Font size can drop to 14px (portal minimum is 16px)
- Spacing: `--space-3` rather than `--space-6` between list items
- Multiple fields on one row: order ID + customer name + phone + status + action button — all visible

### Clarity Over Delight

Every visual element must serve a function. Animation only for state feedback (not decoration). No scroll reveals. No hover shimmer.

### Workflow Over Discovery

The customer portal is built for discovery — the user doesn't know what they want. mCRM is built for workflow — the agent knows exactly what they are doing. Design gets out of the way.

- Land on the primary work queue, not a dashboard
- Default sort: most urgent first (scheduled callbacks due → new orders → retry queue)
- Keyboard shortcuts for common actions
- Bulk actions where applicable

---

## Speed Standards

| Metric | Target |
|--------|--------|
| Order list page load | < 500ms |
| Phone search | < 300ms after keypress stop |
| Ticket detail page | < 400ms |
| Order confirm action | < 1s round trip |
| Table pagination | < 300ms per page |

25 records per page for queues. Not 100 (slow), not 10 (too many page flips).

Phone search fires a query on `customer_phone`. **Index this column.** A LIKE query on an unindexed column on a live dataset will never hit 300ms.

---

## Call Center Flow (The Core Loop)

### Two Entry Points

| Path | How it enters | `source` field |
|------|--------------|----------------|
| **ERP** | ERP sell order auto-synced by `erp_sync_worker.py` | `erp` |
| **Direct** | Agent creates OR client portal submits | `direct` |

### Five Call Types

| `call_type` | Arabic label | Creates ticket? |
|-------------|-------------|----------------|
| `ask` | استفسار | No — call log only |
| `sell` | مبيعات | Yes (after leader approves) |
| `replacement` | استبدال | Yes (after leader approves) |
| `maintenance` | صيانة | Yes (after leader approves) |
| `return` | إرجاع | Yes (after leader approves) |

### Order State Machine

```
new
 ├── [confirm-by-customer]  → confirmed → [leader-approve] → converted (ticket created)
 ├── [schedule]             → scheduled → (returns to new at callback time)
 ├── [no-answer]            → new (unchanged, attempt_count++)   4h lockout
 └── [cancel]               → canceled

confirmed
 ├── [leader-approve]       → converted (ticket created)
 ├── [leader-reject]        → new (back to agent)
 └── [leader-request-info]  → new (with info_request_message in snapshot)
```

**No-answer rule:** 3+ attempts do NOT auto-escalate. Order stays in queue. Agent manually acts.

**Queue priority order:**
1. Scheduled callbacks due now (`scheduled_callback_at ≤ NOW()`)
2. New orders (`status=new`, `attempt_count=0`)
3. Retry queue (`no_answer`, `next_action_at ≤ NOW()`)
4. Others (by `created_at`)

### Key Endpoints

```
GET  /api/call-center/orders                         — agent queue
GET  /api/call-center/orders/:id                     — single order detail
POST /api/call-center/orders                         — create direct order
POST /api/call-center/orders/:id/confirm-by-customer — agent confirms
POST /api/call-center/orders/:id/schedule            — schedule callback
POST /api/call-center/orders/:id/no-answer           — log no answer
POST /api/call-center/orders/:id/cancel              — cancel
POST /api/call-center/calls/ask-only                 — log ask with no order
GET  /api/call-center/pending                        — leader approval queue
POST /api/call-center/orders/:id/leader-approve      — approve → ticket created
POST /api/call-center/orders/:id/reject              — reject → back to agent
POST /api/call-center/orders/:id/request-info        — request more info
GET  /api/call-center/customers/:phone               — customer 360° view
```

---

## Hub: 4 Ticket Types and Their State Machines

After leader approves → ticket created → Hub executes.

### Ticket Number Format

```
HV{R|M|T|S}{YYMMDD}{NNN}

HVR260606001  — Replacement, 2026-06-06, #1 of day
HVM260606001  — Maintenance
HVT260606001  — Return
HVS260606001  — Sell
```

Daily counter resets per type per day. Atomic via `ticket_sequences` table.

---

### Replacement (HVR — استبدال)

Customer has a defective product. Hvar sends a new one, receives the defective back.

```
PENDING
  → [confirm + new_tracking_send required]
CONFIRMED
  → [start_preparation]
IN_PROCESS
  → [ready_for_dispatch]
READY_FOR_DISPATCH
  → [scan_outbound: tracking_number]
SENT
  → [scan_inbound: tracking_number]     ← customer ships back defective
RETURNED
  → [validate_items: item_validations]
COMPLETED
```

**Stock ops:**
- `confirm` → RESERVE (`quantity_reserved ↑`)
- `scan_outbound` → COMMIT (`quantity_reserved ↓`, `quantity_on_hand ↓`)
- `validate_items` → RECEIVE (valid: `on_hand ↑` | damaged: `damaged ↑`)
- `cancel` → release reservation only

---

### Maintenance (HVM — صيانة)

Customer sends product for repair. Most complex flow.

```
PENDING
  → [confirm] (new_tracking_receive optional)
CONFIRMED
  → [scan_inbound: tracking_number]     ← receive product FROM customer
IN_PROCESS
  → [start_maintenance]                 → logs "بدأت"
  → [complete_maintenance: items]       → logs "اكتملت", processes stock
  → [mark_ready + new_tracking_send]
READY_FOR_DISPATCH
  → [scan_outbound: tracking_number]
SENT
  → [mark_delivered]
COMPLETED
```

**Action availability logic** (reads history in reverse — important for UI):
- Last IN→IN entry says "بدأت" → show `complete_maintenance`
- Last IN→IN entry says "اكتملت" → show `mark_ready`
- No such entry → show `start_maintenance`

**Stock ops:** No reservation for maintenance.
- `complete_maintenance` SEND items → `quantity_on_hand ↓`
- `complete_maintenance` RECEIVE items → `on_hand ↑` (valid) or `damaged ↑`

---

### Return (HVT — مرتجع)

Customer returns a product.

```
PENDING
  → [confirm]
CONFIRMED
  → [scan_inbound: tracking_number]     ← receive FROM customer
IN_PROCESS
  → [validate_items: item_validations]
COMPLETED
```

Simplest flow. No outbound shipping from Hub. No stock reservation.

**Stock ops:** `validate_items` → RECEIVE (valid: `on_hand ↑`, damaged: `damaged ↑`)

---

### Sell (HVS — مبيعات)

Confirmed sell order being shipped to customer.

```
PENDING
  → [confirm] (new_tracking_send required)
CONFIRMED
  → [start_preparation]
IN_PROCESS
  → [ready_for_dispatch]
READY_FOR_DISPATCH
  → [scan_outbound: tracking_number]
SENT
  → [validate_items] → COMPLETED              (no return path)
  OR [scan_inbound] → RETURNED → [validate_items] → COMPLETED
```

**Stock ops:**
- `confirm` → RESERVE parts only (products = reference, no stock)
- `scan_outbound` → COMMIT
- `validate_items` → RECEIVE if returned

---

### Common Status Colors (for UI state badges)

| Status | Color | Arabic label for agent |
|--------|-------|------------------------|
| `PENDING` | Slate | قيد الانتظار |
| `CONFIRMED` | Blue | مؤكد |
| `IN_PROCESS` | Amber | قيد التنفيذ |
| `READY_FOR_DISPATCH` | Purple | جاهز للشحن |
| `SENT` | Indigo | تم الشحن |
| `RETURNED` | Orange | مرتجع |
| `COMPLETED` | Emerald | مكتمل |
| `CANCELLED` | Red | ملغي |

**Arabic labels for customer-facing display** (when showing ticket status on hvarstore.com portal):

| Status | Customer-facing Arabic |
|--------|----------------------|
| `PENDING` | قيد المراجعة |
| `CONFIRMED` | تم التأكيد |
| `IN_PROCESS` | قيد التنفيذ |
| `READY_FOR_DISPATCH` | جاهز للشحن |
| `SENT` | تم الشحن |
| `COMPLETED` | مكتمل |
| `CANCELLED` | ملغي |

---

### Hub Actions Reference

All actions via `POST /api/tickets/:id/action`

| Action | Types | Transition |
|--------|-------|-----------|
| `confirm` | R/S | PENDING→CONFIRMED (`new_tracking_send` required) |
| `confirm` | M/T | PENDING→CONFIRMED (`new_tracking_receive` optional) |
| `start_preparation` | R/S | CONFIRMED→IN_PROCESS |
| `scan_inbound` | M/T | CONFIRMED→IN_PROCESS |
| `scan_inbound` | R | SENT→RETURNED |
| `start_maintenance` | M | IN_PROCESS→IN_PROCESS (logs "بدأت") |
| `complete_maintenance` | M | IN_PROCESS→IN_PROCESS (logs "اكتملت") |
| `mark_ready` | M | IN_PROCESS→READY_FOR_DISPATCH |
| `ready_for_dispatch` | R/S | IN_PROCESS→READY_FOR_DISPATCH |
| `scan_outbound` | R/M/S | READY_FOR_DISPATCH→SENT |
| `validate_items` | R/T | RETURNED/IN_PROCESS→COMPLETED |
| `mark_delivered` | M | SENT→COMPLETED |
| `cancel` | all | any active→CANCELLED (via `POST /api/tickets/:id/cancel`) |

`confirm` can also update: `city`, `governorate`, `address_details`, `phone`, `phone_secondary`, `items`, `cost_adjustment`.

---

## Stock Model

```
stock_items:
  quantity_on_hand   — physically in stock, available to ship
  quantity_reserved  — committed to a ticket, not yet shipped
  quantity_damaged   — received back damaged

stock_movements:
  movement_type  RESERVE | SEND | RECEIVE | MANUAL
  direction      SEND | RECEIVE
  condition      valid | damaged
```

**Item types:** `product` (reference only, no stock tracking for sells) | `part` (tracked, reserved, committed)

**Pricing logic:**
```
service_items.price_customer (not NULL) → use this
  NULL → stock_items.price_customer (if customer_type=customer)
       → stock_items.price_merchant  (if customer_type=merchant)
```

---

## Client Portal Bridge

This is how hvarstore.com customer service requests enter mCRM.

### The Flow

```
Client on hvarstore.com
  → selects service type
  → submits form
  → Portal backend POSTs to mCRM
  → appears in call center queue
  → agent calls client
  → leader approves → ticket created
  → client tracks by phone
```

### Portal → MCRM Request

```js
POST https://mcrm.hvarstore.com/api/call-center/orders
Authorization: Bearer {PORTAL_SERVICE_TOKEN}   // server-side only, never browser

{
  source: 'direct',
  call_type: 'ask' | 'sell' | 'replacement' | 'maintenance' | 'return',
  customer_phone: '01XXXXXXXXX',   // normalized Egyptian mobile
  customer_name: '...',
  notes: '...'
}
// Returns: { data: { id: 99 } }  — save this order ID for tracking
```

### Service Type Mapping (Portal UI → MCRM)

| Portal Arabic label | `call_type` |
|--------------------|-------------|
| استفسار | `ask` |
| شراء منتج | `sell` |
| استبدال (منتج معيب) | `replacement` |
| صيانة | `maintenance` |
| إرجاع | `return` |

**Recommendation: pre-classify** at the portal. Agent opens the order already knowing the service type → faster call, right team routing.

### Client Status Tracking

```js
GET /api/call-center/customers/{phone}
// Returns: orders[], service_tickets[], call_history[]

GET /api/tickets/{ticket_id}
// Returns: status, service_type, ticket_number, updated_at, ...
```

### Auth Rules

- Portal uses a **dedicated service account** (`portal_service`) — not a user login
- Token stored **server-side only** — never exposed to the browser
- Request chain: `Portal client → Portal backend → MCRM API`
- Implement retry-on-401 with re-login (tokens expire)

### Key Integration Rules

1. **Phone normalization:** send `01XXXXXXXXX` (10 digits, starts with 01). MCRM normalizes internally but send clean numbers.
2. **No duplicate check:** call `GET /api/call-center/customers/:phone` before creating if you want to prevent duplicate requests.
3. **ASK calls never create tickets:** if `call_type=ask` and agent doesn't reclassify, no ticket is ever created. Only a call log.

---

## Error Handling Standards

### For Agents

Show what happened + what to do next + a reference code for escalation. Never raw stack traces.

```
تعذّر تأكيد الطلب — مشكلة في الاتصال بالـ ERP.
جرب مرة ثانية. لو المشكلة استمرت، تواصل مع الدعم الفني وأشر إلى: ERR-ERP-TIMEOUT.
```

### Key Error Codes

| Code | Meaning |
|------|---------|
| `ORDER_NOT_FOUND` | ID doesn't exist |
| `ORDER_ALREADY_CONVERTED` | Already has a ticket |
| `ORDER_CANCELED` | Cannot act on canceled |
| `ORDER_LOCKED` | In 4h no-answer lockout |
| `MISSING_REQUIRED_FIELDS` | Required fields missing |
| `INVALID_CALL_TYPE` | call_type not in enum |
| `BOSTA_LOOKUP_FAILED` | Bosta API error |

---

## Data Rules

- `original_tracking`, `service_type`, `customer_id`, customer `name` are **immutable after ticket creation**
- `calls.call_type` ≠ `orders.service_type` — same values, different semantics, different tables
- `erp_order_id` is the ERP link; `bosta_tracking_number` is the shipping link — both on the order
- `customer_services` JSON on the customer record auto-updates when ticket is created/confirmed/completed
- All state changes go into `service_ticket_history` — append-only, no deletes, no edits
