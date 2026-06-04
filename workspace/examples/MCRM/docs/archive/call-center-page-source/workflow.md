# CALL CENTER WORKFLOW

> **Version**: 3.0 | **Status**: CANONICAL

The call center operates on two distinct journeys. Every call session follows one of these paths.

---

## Journey A: ERP Sell Order

**Trigger**: Sell order placed on ERP + recorded in Bosta, needs agent confirmation with customer.

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1 — ERP SYNC                                      │
│                                                         │
│  Backend polls: GET /api/erp/drafts                     │
│      → proxied to: ERP_BASE_URL/sells/draft-dt          │
│                                                         │
│  Order enters: source='erp'                             │
│                service_type='sell'                      │
│                status='new'                             │
│                                                         │
│  ⚠ NOT a NULL-type draft. These are sell orders that    │
│    have already been placed. Type is always SELL.       │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2 — BOSTA AUTO-ENRICH                             │
│                                                         │
│  Backend: bosta_service.lookup_by_phone(phone)          │
│  OR:      bosta_service.lookup_by_tracking(tracking_no) │
│                                                         │
│  Fills in:                                              │
│    - customer_name                                      │
│    - delivery_address (district, city, governorate)     │
│    - cod_amount                                         │
│    - bosta_tracking_number                              │
│    - bosta_order_status                                 │
│    - bosta_order_id                                     │
│                                                         │
│  Deduplication: if same customer/order already in       │
│  system, merge instead of creating duplicate.           │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3 — QUEUE                                         │
│                                                         │
│  Order visible in CustomerServicePage queue             │
│  Status badge: "مبيعات" (sell)                          │
│  Priority based on: created_at, attempt_count           │
│                                                         │
│  Filters available: status, date, governorate, attempts │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 4 — AGENT OPENS CALL SESSION                      │
│                                                         │
│  Agent clicks order → opens CallSessionModal            │
│                                                         │
│  Session displays:                                      │
│    call_type = SELL (pre-filled, editable)              │
│    Customer info (from Bosta auto-enrich)               │
│    ERP order details (items, quantities, COD)           │
│    Bosta order status (delivery state)                  │
│    Previous call history for this order/customer        │
│                                                         │
│  Agent initiates the call to customer                   │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 5 — CALL IN PROGRESS                              │
│                                                         │
│  Agent reviews + corrects with customer:                │
│    - Address correct? (update if not)                   │
│    - Items confirmed? (add/remove/change quantity)      │
│    - COD amount confirmed?                              │
│    - Customer available for delivery?                   │
│                                                         │
│  Agent can update order fields in real time             │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 6 — CALL OUTCOME                                  │
│                                                         │
│  Agent selects outcome:                                 │
│                                                         │
│  ✅ confirmed   → proceed to Step 7                    │
│  📅 scheduled   → set callback datetime                │
│                   order.status = 'scheduled'            │
│                   order re-enters queue at callback     │
│  📵 no_answer   → attempt_count++                      │
│                   next_action_at = NOW() + 4h           │
│                   (3 attempts max before escalation)    │
│  ❌ canceled    → order.status = 'canceled'             │
│                   cancellation_reason saved             │
│  📝 left_message → note saved, queue stays             │
└─────────────────────────────────────────────────────────┘
           ↓ (confirmed only)
┌─────────────────────────────────────────────────────────┐
│  STEP 7 — SELL TICKET CREATED                           │
│                                                         │
│  POST /api/call-center/orders/<id>/confirm-by-customer  │
│                                                         │
│  Creates service_ticket:                                │
│    service_type = 'sell'                                │
│    status = 'PENDING'                                   │
│    source = 'call_center'                               │
│    created_from_order_id = order.id                     │
│                                                         │
│  Order status → 'converted'                             │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 8 — LEADER REVIEW                                 │
│                                                         │
│  Ticket visible in Leader dashboard: status = PENDING   │
│                                                         │
│  Leader: ✅ approve → Hub workflow starts              │
│          ❌ reject  → back to agent for correction      │
└─────────────────────────────────────────────────────────┘
           ↓ (approved)
┌─────────────────────────────────────────────────────────┐
│  STEP 9 — HUB WORKFLOW                                  │
│                                                         │
│  Sell ticket: PENDING → CONFIRMED → IN_PROCESS          │
│            → READY_FOR_DISPATCH → SENT → COMPLETED      │
└─────────────────────────────────────────────────────────┘
```

---

## Journey B: Direct Call / Ask

**Trigger**: Customer calls in, or agent initiates an outbound call not tied to an ERP order.

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1 — CALL RECEIVED OR INITIATED                    │
│                                                         │
│  Inbound: customer calls → agent picks up               │
│  Outbound: agent decides to call a customer             │
│                                                         │
│  No pre-existing order in system.                       │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2 — CUSTOMER SEARCH                               │
│                                                         │
│  Agent searches by phone number                         │
│    → internal DB check (existing customers/tickets)     │
│    → Bosta lookup (order history, customer details)     │
│                                                         │
│  Agent sees: customer 360° view                         │
│    - Previous tickets (R/M/T/S)                         │
│    - Bosta delivery history                             │
│    - Past call logs                                     │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3 — CALL SESSION OPENED                           │
│                                                         │
│  call_type = ASK (default)                              │
│                                                         │
│  Agent begins talking to customer.                      │
│  call_type displayed at top — editable at any time.     │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 4 — AGENT UNDERSTANDS CUSTOMER NEED               │
│                                                         │
│  During the call, agent identifies what customer needs: │
│                                                         │
│  → Inquiry only?      stays: ASK                        │
│  → Buy product?       reclassify to: SELL               │
│  → Defective product? reclassify to: REPLACEMENT (R)   │
│  → Needs repair?      reclassify to: MAINTENANCE (M)   │
│  → Wants to return?   reclassify to: RETURN (T)         │
│                                                         │
│  Agent can change type freely until call is closed.     │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 5 — DATA ENTRY                                    │
│                                                         │
│  If type is SELL/R/M/T:                                 │
│    - Select product(s), quantities, parts               │
│    - Confirm delivery address                           │
│    - Set COD if applicable                              │
│    - Notes                                              │
│                                                         │
│  If type remains ASK:                                   │
│    - Notes field only                                   │
│    - No product/address data required                   │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 6 — CALL OUTCOME                                  │
│                                                         │
│  Same outcomes as Journey A, plus:                      │
│                                                         │
│  ✅ confirmed (ASK)      → call log only, no ticket     │
│  ✅ confirmed (SELL/R/M/T) → proceed to Step 7          │
│  📅 scheduled            → callback set                 │
│  📵 no_answer            → attempt logged               │
│  ❌ canceled             → order/session canceled        │
└─────────────────────────────────────────────────────────┘
           ↓ (confirmed + typed as SELL/R/M/T)
┌─────────────────────────────────────────────────────────┐
│  STEP 7 — DRAFT ORDER CREATED                           │
│                                                         │
│  order: source='direct'                                 │
│         service_type = 'R' / 'M' / 'T' / 'S'           │
│         status = 'confirmed' (from this call)           │
│                                                         │
│  → Leader review triggered                              │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 8 — LEADER REVIEW → TICKET CREATION               │
│                                                         │
│  Leader approves → service_ticket created: PENDING      │
│  Leader rejects  → back to agent                        │
└─────────────────────────────────────────────────────────┘
           ↓ (approved)
┌─────────────────────────────────────────────────────────┐
│  STEP 9 — HUB WORKFLOW                                  │
│                                                         │
│  R: PENDING → CONFIRMED → IN_PROCESS → READY → SENT → COMPLETED │
│  M: PENDING → CONFIRMED → IN_PROCESS (start/complete)           │
│            → READY → SENT → COMPLETED                           │
│  T: PENDING → CONFIRMED → IN_PROCESS → COMPLETED               │
│  S: PENDING → CONFIRMED → IN_PROCESS → READY → SENT → COMPLETED│
└─────────────────────────────────────────────────────────┘
```

---

## ASK Call — No-Ticket Path

When a call resolves as ASK (inquiry only), no order record is created or converted:

```
Call opened (type=ASK)
    ↓
Agent listens, answers questions, provides info
    ↓
Agent closes call → outcome: confirmed (ask_only)
    ↓
System records:
  - calls: call_type='ask', status='confirmed', notes=[...]
  - NO order created
  - NO ticket created
    ↓
Call appears in customer's call history under Customer 360° view
```

This keeps the call history complete while not polluting the order queue with non-actionable records.

---

## 3-Attempt Retry Logic (no_answer)

```
Attempt 1: no_answer
  → next_action_at = NOW() + 4h
  → order locked in queue for 4 hours

Attempt 2 (after 4h gap): no_answer
  → next_action_at = NOW() + 4h
  → attempt_count = 2

Attempt 3 (after 4h gap): no_answer
  → attempt_count = 3
  → order.status = 'escalated' (or flagged for supervisor review)
  → removed from regular queue, enters escalation queue

Each no_answer attempt creates a new call record:
  calls.attempt_number = 1 / 2 / 3
  calls.status = 'no_answer'
  calls.linked_to_order_id = order.id
```

---

## Call Queue Display

What the agent sees in the CustomerServicePage queue:

| Field | Source | Display |
|-------|--------|---------|
| Customer name | Bosta / internal | نص |
| Phone | ERP / customer | RTL formatted |
| Service type / state | order.service_type + order.status | "مبيعات", "صيانة", "مسودة - لم يحدد" |
| Attempts | order.attempt_count | رقم مع أيقونة |
| Created at | order.created_at | تاريخ نسبي |
| Scheduled callback | order.scheduled_callback_at | وقت التنبيه |

Queue ordering priority:
1. Scheduled callbacks due now (scheduled_callback_at ≤ NOW())
2. New orders (status='new', attempt_count=0)
3. Retry queue (no_answer, next_action_at ≤ NOW())
4. Others (sorted by created_at)

---

## Call Session vs Call Record

| Concept | What It Is | Table | When Created |
|---------|-----------|-------|--------------|
| Call Session | Agent's active working UI for one call | (UI state only) | When agent opens order |
| Call Record | Logged record of one call attempt | `calls` | When agent closes/ends call |
| Order | The customer's request being worked | `orders` | On ERP sync or direct creation |
| Service Ticket | Converted, approved work order | `service_tickets` | After leader approves |

One order can have multiple call records (one per attempt). One call session produces one call record when closed.

---

*Version 3.0 | 2026-02-25*
