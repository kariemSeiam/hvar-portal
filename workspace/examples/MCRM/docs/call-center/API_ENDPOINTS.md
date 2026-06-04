# API ENDPOINTS — CALL CENTER

> **Version**: 3.0 | **Status**: CANONICAL
> Base URL: `/api/call-center` (unless otherwise noted)

---

## ERP Integration

### GET /api/erp/drafts

Fetches sell orders from the ERP system that are awaiting call-center confirmation.

> ⚠ **Important naming clarification**: Despite the route saying "drafts", this endpoint returns **sell orders** — specifically orders placed on the ERP that have not yet been confirmed with the customer. The word "draft" refers to their state in the ERP, not their type. These are NOT type=NULL orders.

**Internal proxy target**: `ERP_BASE_URL/sells/draft-dt`

**Response format**:
```json
{
  "data": [
    {
      "erp_order_id": "ERP-2024-XXXXX",
      "customer_phone": "01XXXXXXXXX",
      "bosta_tracking": "BT-XXXXXXXXXXXX",
      "items": [
        { "product_id": 1, "product_name": "...", "quantity": 2, "unit_price": 150.00 }
      ],
      "cod_amount": 300.00,
      "created_at": "2026-02-25T10:00:00Z"
    }
  ]
}
```

**What happens after this call**:
1. Each ERP order is stored as: `orders(source='erp', service_type='sell', status='new')`
2. Bosta auto-enrich triggered using `customer_phone` or `bosta_tracking`
3. Order appears in call center queue with "مبيعات" type badge

---

## Bosta Integration

### GET /api/bosta/customer

Lookup customer data from Bosta by phone number. Used for both auto-enrich (ERP orders) and manual lookup (direct calls).

**Query params**: `?phone=01XXXXXXXXX`

**Response**:
```json
{
  "found": true,
  "customer": {
    "name": "أحمد محمد",
    "phone": "01XXXXXXXXX",
    "address": "123 شارع النيل",
    "district": "المعادي",
    "city": "القاهرة",
    "governorate": "القاهرة"
  },
  "orders": [
    {
      "bosta_order_id": "BO-XXXXXXXX",
      "tracking_number": "BT-XXXXXXXXXXXX",
      "status": "IN_TRANSIT",
      "cod": 300.00,
      "created_at": "2026-02-20T09:00:00Z",
      "items": [...]
    }
  ]
}
```

**Used in**:
- PATH A (ERP): auto-called after ERP sync to enrich order
- PATH B (Direct): called when agent searches by phone

---

### GET /api/bosta/order/:tracking

Lookup a specific Bosta order by tracking number.

**Response**: Same order structure as above (single order object).

---

## Orders Queue

### GET /api/call-center/orders

Returns the call center order queue.

**Query params**:
```
status=new|scheduled|confirmed|all
service_type=sell|R|M|T|S|ask
source=erp|direct|bosta
page=1
per_page=25
search=01XXXXXXXXX       (phone search)
date_from=2026-02-01
date_to=2026-02-28
today=2026-02-26       (optional; when present, backlog rolls into "today", future uses scheduled_callback_at)
governorate=Cairo
```

**Response**:
```json
{
  "data": [
    {
      "id": 42,
      "source": "erp",
      "service_type": "sell",
      "status": "new",
      "attempt_count": 0,
      "next_action_at": null,
      "scheduled_callback_at": null,
      "customer_name": "أحمد محمد",
      "customer_phone": "01XXXXXXXXX",
      "governorate": "القاهرة",
      "cod_amount": 300.00,
      "created_at": "2026-02-25T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 150,
    "pages": 6
  }
}
```

---

### GET /api/call-center/orders/counts

Returns counts by status for QueueStatusBar day chips.

**Query params**: `date=YYYY-MM-DD`, `today=YYYY-MM-DD` (optional; when present, backlog rolls into "today", future uses `scheduled_callback_at`).

**Response**: `{ "new": N, "scheduled": N, "confirmed": N, "completed": N, "canceled": N, ... }`

---

### GET /api/call-center/orders/:id

Get a single order with full detail including:
- Customer info
- Bosta order data
- ERP order data
- Product/item list
- Full call history
- Linked service ticket (if converted)

---

### POST /api/call-center/orders

Create a new direct order (PATH B: direct call, non-ERP).

**Request body**:
```json
{
  "source": "direct",
  "call_type": "ask",
  "customer_phone": "01XXXXXXXXX",
  "customer_name": "...",
  "notes": "..."
}
```

Note: `service_type` is not set at creation for direct calls (agent fills during call).

---

### PATCH /api/call-center/orders/:id

Update order data during a call session (address corrections, COD changes, etc.).

**Request body** (any updatable fields):
```json
{
  "customer_name": "...",
  "delivery_address": "...",
  "governorate": "...",
  "city": "...",
  "cod_amount": 350.00
}
```

---

## Call Actions

### POST /api/call-center/orders/:id/confirm-by-customer

**Agent confirms with customer. All types (Sell, R, M, T) go to leader queue — no ticket yet.**

Used when:
- Agent confirms an ERP sell order with the customer (PATH A)
- Agent confirms a direct order (PATH B, any type)

**Request body**:
```json
{
  "call_type": "sell",
  "notes": "...",
  "customer_name": "...",
  "delivery_address": "...",
  "governorate": "...",
  "city": "...",
  "cod_amount": 300.00,
  "items": [
    { "product_id": 1, "quantity": 2 }
  ]
}
```

**Backend actions**:
1. Creates `calls` record: `{call_type='sell', status='confirmed', ...}`
2. Stores `confirmation_snapshot` (items, address, notes) on order
3. Updates `order.status = 'confirmed'` — **awaits leader approval**
4. Does NOT create ticket — leader approves later

**Response**:
```json
{
  "success": true,
  "call_id": 89,
  "order_status": "confirmed",
  "message": "تم التأكيد. بانتظار موافقة المشرف."
}
```

---

### GET /api/call-center/pending

**Leader queue: orders awaiting approval** (status=confirmed, converted_to_ticket_id IS NULL).

**Query params**: `source`, `service_type`, `page`, `per_page`

**Response**: `{ data: [...], pagination: { page, per_page, total, pages } }`

---

### POST /api/call-center/orders/:id/leader-approve

**Leader approves order → creates ticket, status=converted.**

**Request body**: `{ "leader_notes": "..." }` (optional)

**Backend actions**:
1. Reads `confirmation_snapshot` from order
2. Creates `service_ticket` (sell/R/M/T via service_manager)
3. Updates order: `status=converted`, `approved_by`, `approved_at`, `converted_to_ticket_id`

**Response**: `{ "success": true, "ticket_id": 12, "ticket_number": "HVS-0012", "order_status": "converted" }`

---

### POST /api/call-center/orders/:id/reject

**Leader rejects → returns to agent** (status=new).

**Request body**: `{ "rejection_reason": "..." }`

---

### POST /api/call-center/orders/:id/request-info

**Leader requests more info.** Order returns to agent queue: `status=new`. Leader message is stored in `confirmation_snapshot.info_request_message`. Agent sees it in the call session, edits data/notes, then confirms again (confirm-by-customer) → back to مؤكدة. No separate `info_requested` state.

---

### POST /api/call-center/orders/:id/schedule

Schedule a callback for the order.

**Request body**:
```json
{
  "call_type": "sell",
  "callback_at": "2026-02-26T14:00:00",
  "notes": "العميل طلب الاتصال بعد الظهر"
}
```

**Backend actions**:
1. Creates `calls` record: `{status='scheduled', scheduled_callback_at=callback_at, ...}`
2. Updates `order.status = 'scheduled'`
3. Updates `order.scheduled_callback_at = callback_at`

---

### POST /api/call-center/orders/:id/no-answer

Log a no_answer attempt.

**Request body**:
```json
{
  "call_type": "sell",
  "notes": "..."
}
```

**Backend actions**:
1. Creates `calls` record: `{status='no_answer', attempt_number=N, ...}`
2. Updates `order.attempt_count++`
3. Updates `order.next_action_at = NOW() + 4h`
4. Status unchanged; `attempt_count` increments; 3+ attempts stay in queue until agent acts

---

### POST /api/call-center/orders/:id/cancel

Cancel the order.

**Request body**:
```json
{
  "call_type": "sell",
  "cancellation_reason": "customer_refused",
  "notes": "..."
}
```

**Backend actions**:
1. Creates `calls` record: `{status='canceled', ...}`
2. Updates `order.status = 'canceled'`
3. Updates `order.cancellation_reason`

---

### POST /api/call-center/calls/ask-only

Log an ASK call (no order linked). Used for inquiry-only calls that don't result in an order.

**Request body**:
```json
{
  "call_type": "ask",
  "customer_phone": "01XXXXXXXXX",
  "customer_name": "...",
  "notes": "استفسر العميل عن سياسة الاستبدال"
}
```

**Backend actions**:
1. Creates `calls` record: `{call_type='ask', status='confirmed', linked_to_order_id=NULL, linked_to_ticket_id=NULL, ...}`

---

## Direct Call / Non-ERP Ticket Creation

All confirmations (Sell, R, M, T) use `confirm-by-customer` → status=confirmed → leader approves via `leader-approve`. See leader endpoints above.

---

## Customer 360° View

### GET /api/call-center/customers/:phone

Returns the full customer 360° view by phone number.

**Response**:
```json
{
  "customer": {
    "id": 5,
    "name": "أحمد محمد",
    "phone": "01XXXXXXXXX"
  },
  "bosta_orders": [...],
  "service_tickets": [...],
  "call_history": [
    {
      "id": 89,
      "call_type": "sell",
      "status": "confirmed",
      "agent_name": "...",
      "created_at": "...",
      "notes": "..."
    }
  ],
  "orders": [...]
}
```

---

## call_type Field Reference

The `call_type` field is included in every call-creation request body:

| Value | Use Case |
|-------|----------|
| `ask` | Inquiry only — PATH B, no order |
| `sell` | Sell confirmation — ERP PATH A or direct sell |
| `replacement` | Defective product swap |
| `maintenance` | Repair service |
| `return` | Product return |

---

## Error Responses

```json
{
  "success": false,
  "error": "ORDER_NOT_FOUND",
  "message": "No order with id 999",
  "status_code": 404
}
```

Common error codes:

| Code | Meaning |
|------|---------|
| `ORDER_NOT_FOUND` | Order ID doesn't exist |
| `ORDER_ALREADY_CONVERTED` | Order already has a ticket |
| `ORDER_CANCELED` | Cannot act on a canceled order |
| `ORDER_LOCKED` | Order in no_answer lockout period (next_action_at in future) |
| `MISSING_REQUIRED_FIELDS` | Required fields for call type not provided |
| `INVALID_CALL_TYPE` | call_type not in allowed enum |
| `BOSTA_LOOKUP_FAILED` | Bosta API returned error for phone/tracking lookup |

---

*Version 3.0 | 2026-02-25*
