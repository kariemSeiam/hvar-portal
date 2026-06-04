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
status=new|scheduled|escalated|all
service_type=sell|R|M|T|S|ask
source=erp|direct|bosta
page=1
per_page=25
search=01XXXXXXXXX       (phone search)
date_from=2026-02-01
date_to=2026-02-28
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

**The primary "confirm sell" endpoint.** Used when:
- Agent confirms an ERP sell order with the customer (PATH A)
- Agent confirms a direct sell order (PATH B, type=sell)

**Request body**:
```json
{
  "call_type": "sell",
  "notes": "...",
  "customer_name": "...",   // final confirmed customer data
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
2. Creates `service_ticket`: `{service_type='sell', status='PENDING', source='call_center', created_from_order_id=id}`
3. Updates `order.status = 'converted'`
4. Notifies leader dashboard (PENDING queue)

**Response**:
```json
{
  "success": true,
  "call_id": 89,
  "ticket_id": 12,
  "ticket_number": "HVS-0012",
  "order_status": "converted"
}
```

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
4. If `attempt_count >= 3`: `order.status = 'escalated'`

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

### POST /api/call-center/orders/:id/left-message

Log a message/voicemail left for the customer.

**Request body**:
```json
{
  "call_type": "sell",
  "notes": "تركت رسالة واتساب"
}
```

**Backend actions**:
1. Creates `calls` record: `{status='left_message', ...}`
2. Order status unchanged (stays in queue)

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

For R/M/T calls that come from direct (PATH B), the confirm flow goes through the order:

### POST /api/call-center/orders/:id/confirm

Confirms a direct-source order and triggers leader review.

**Request body**:
```json
{
  "call_type": "replacement",
  "service_type": "R",
  "items": [...],
  "notes": "...",
  "customer_name": "...",
  "delivery_address": "...",
  "cod_amount": 0
}
```

**Backend actions**:
1. Creates `calls` record: `{call_type='replacement', status='confirmed', ...}`
2. Updates `order.service_type = 'R'`, `order.status = 'confirmed'`
3. Creates leader approval request (not a ticket yet)

Leader then calls:

### POST /api/call-center/orders/:id/approve (Leader only)

Approves the order and creates the service ticket.

### POST /api/call-center/orders/:id/reject (Leader only)

Rejects and sends back to agent.

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
