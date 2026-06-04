# ORDER LIFECYCLE

> **Version**: 3.0 | **Status**: CANONICAL
> **Note**: Renamed from `draft-lifecycle.md`. The old "draft-first (NULL type)" model has been corrected. See sections below.

---

## Overview

Orders in the call center come from two sources and have distinct lifecycles. The key correction from previous documentation:

> **ERP orders are NOT type=NULL drafts.** They are sell orders with a known type from the moment they enter the system. The draft-first (NULL type) model only applies to direct/ask calls — and only transiently until the agent reclassifies.

---

## Order Sources and Initial State

| Source | service_type on entry | status on entry | Notes |
|--------|----------------------|-----------------|-------|
| `erp` | `sell` (known) | `new` | Sell order from ERP; Bosta data auto-fetched |
| `direct` | `NULL` (ask state) | `new` | Created when agent opens call; reclassified during call |
| `bosta` | Varies | `new` | Rare; direct Bosta webhook integrations |

### ERP Orders — entry detail

```
GET /api/erp/drafts → GET ERP_BASE_URL/sells/draft-dt

Response orders are SELL orders. They:
  - Have product + quantity data from ERP
  - Are linked to a Bosta shipment (tracking number exists)
  - Have a COD amount
  - Need agent to confirm with customer before processing

orders.source       = 'erp'
orders.service_type = 'sell'   ← NEVER NULL for ERP source
orders.status       = 'new'
```

### Direct / Ask Orders — entry detail

```
Agent creates session from scratch → no order exists initially

If agent reclassifies from ASK to a typed call and confirms:
  orders.source       = 'direct'
  orders.service_type = 'R' | 'M' | 'T' | 'S'
  orders.status       = 'confirmed'

If call stays ASK (inquiry only):
  → No order record created at all
  → Only a call record in calls table
```

---

## Order State Machine

### State Definitions

```
new          → Order entered system, not yet worked by any agent
scheduled    → Agent set a callback appointment; waiting for callback time
confirmed    → Agent + customer agreed; ready for ticket creation
converted    → Order has been converted to a service_ticket
canceled     → Order rejected/refused/invalid; removed from queue
```

### State Transitions

```
           ┌─────────────────────────────────────────────────────┐
           │                    new                              │
           └──────────────────┬──────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────────────────┐
          ↓                   ↓                               ↓
      scheduled           confirmed                      (no_answer)
          │                   │                               │
          │                   ↓                               │
          │              converted                            │
          │               (→ ticket)                           │
          │                   │                               │
          │                   │              status unchanged; 3+ attempts stay in queue
          │
    (when callback time arrives)
          │
          ↓
         new (re-enters queue)
```

### Transition Triggers

| From | To | Trigger |
|------|----|---------|
| `new` | `scheduled` | Agent logs "scheduled" call outcome |
| `new` | `confirmed` | Agent logs "confirmed" call outcome (typed) |
| `new` | `canceled` | Agent logs "canceled" call outcome |
| `scheduled` | `new` | scheduled_callback_at reached (cron/queue) |
| `confirmed` | `converted` | Leader approves → ticket created |
| `confirmed` | `new` | Leader rejects → back to queue |

---

## ERP Sell Order Full Lifecycle

```
ERP /sells/draft-dt response
    ↓
orders table insert:
  source='erp', service_type='sell', status='new'
  bosta_tracking, customer_phone, items, cod_amount
    ↓
Bosta auto-enrich:
  customer_name, address, city, governorate filled
    ↓
Queue: shows in CustomerServicePage with "مبيعات" badge
    ↓
Agent opens call session:
  call_type='sell' (pre-filled)
  all fields shown and editable
    ↓

OUTCOME A: confirmed
    → calls: {call_type='sell', status='confirmed', attempt=N}
    → POST /api/call-center/orders/<id>/confirm-by-customer
    → service_ticket: {service_type='sell', status='PENDING', source='call_center'}
    → order.status = 'converted'
    → Leader review
    → Hub workflow: PENDING → CONFIRMED → IN_PROCESS → READY → SENT → COMPLETED

OUTCOME B: scheduled
    → order.status = 'scheduled'
    → order.scheduled_callback_at = [datetime]
    → re-enters queue at scheduled time

OUTCOME C: no_answer (any number of times)
    → order.attempt_count++
    → order.next_action_at = NOW() + 4h
    → order.status unchanged (3+ attempts stay in queue until agent acts)

OUTCOME D: canceled
    → order.status = 'canceled'
    → order.cancellation_reason = [reason]
```

---

## Direct Call Order Lifecycle

### Type stays ASK (inquiry only)

```
Agent opens call session (type=ASK)
    ↓
Agent speaks to customer, inquiry resolved
    ↓
Agent closes call (confirmed, ASK)
    ↓
calls table:
  {call_type='ask', status='confirmed', notes='...'}

NO order record created.
NO ticket created.
Customer call history updated.
```

### Type reclassified to SELL/R/M/T

```
Agent opens call session (type=ASK)
    ↓
Customer explains need (e.g., replacement)
Agent changes call_type → 'replacement'
    ↓
Agent fills product details, address, notes
    ↓
Agent confirms call
    ↓
orders insert:
  source='direct'
  service_type='R'        ← typed (not NULL)
  status='confirmed'
    ↓
calls:
  {call_type='replacement', status='confirmed', linked_to_order_id=N}
    ↓
Leader review
    ↓
service_ticket: {service_type='replacement', status='PENDING'}
    ↓
Hub workflow: R track (PENDING → CONFIRMED → IN_PROCESS → READY → SENT → COMPLETED)
```

---

## Orders vs Service Tickets — Key Distinction

| Field | orders | service_tickets |
|-------|--------|-----------------|
| Purpose | Call center working record | Actual work order in Hub |
| Created by | ERP sync or agent | After leader approval |
| service_type | `sell` for ERP; `R/M/T/S` for direct; NULL for ask-until-typed | `replacement/maintenance/return/sell` |
| status | new/scheduled/confirmed/converted/canceled | PENDING/CONFIRMED/IN_PROCESS/READY_FOR_DISPATCH/SENT/COMPLETED/CANCELLED |
| Who works on it | Call center agents | Hub technicians + team leads |

Orders are temporary. Once converted (→ `converted`), the service ticket is the canonical record.

---

## Attempt Tracking on Orders

```sql
orders.attempt_count     INT     -- increments on each no_answer
orders.next_action_at    DATETIME-- when order becomes workable again (after no_answer)
orders.last_attempt_at   DATETIME-- when last call was made
orders.scheduled_callback_at DATETIME -- when scheduled for callback
```

Attempt counting:
- Only `no_answer` increments `attempt_count`
- `scheduled` does not count as attempts
- Reset is NOT automatic — orders with 3+ attempts stay in queue until agent acts

---

## What Was Wrong in Previous Docs (Corrections)

| Previous (Incorrect) | Current (Correct) |
|---------------------|-------------------|
| "All drafts start with service_type = NULL" | ERP orders start with service_type = 'sell'; NULL only for direct/ask-before-reclassify |
| "Draft lifecycle: null → type selected → confirmed" | ERP: always typed; Direct: ASK (no record) or typed at reclassification |
| "draft-lifecycle.md" as the model name | Renamed to order-lifecycle.md; no "draft" concept — orders go directly to new/confirmed |
| Type selection happens at the end for all sources | Type is pre-known for ERP; selected during call for direct sources |

---

*Version 3.0 | 2026-02-25*
