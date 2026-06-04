# CALL SESSION CYCLE

> **Version**: 3.0 | **Status**: CANONICAL

A call session is the agent's active working environment for one call. This document describes the lifecycle of a single call session — from opening to closing — and what happens at each stage.

---

## Call Session Anatomy

When an agent opens a call session, the UI shows:

```
┌─────────────────────────────────────────────────────────────────┐
│  CALL TYPE  [ SELL ▼ ]    ← visible + editable at all times     │
│                             Options: ASK / SELL / R / M / T     │
├─────────────────────────────────────────────────────────────────┤
│  CUSTOMER INFO                                                  │
│  ─────────────────────────────────────────────────────          │
│  الاسم:    _______________                                       │
│  الهاتف:   01X XXXX XXXX                                        │
│  العنوان:  _______________ المحافظة: ___ المدينة: ___           │
│  (editable — agent corrects any field live during call)         │
├─────────────────────────────────────────────────────────────────┤
│  ORDER / REQUEST DETAILS                                        │
│  ─────────────────────────────────────────────────────          │
│  المنتجات / القطع: [list — add/remove/change qty]               │
│  القيمة (COD):     ____                                         │
│  ملاحظات:          ____                                         │
├─────────────────────────────────────────────────────────────────┤
│  CALL HISTORY (this customer)                                   │
│  ─────────────────────────────────────────────────────          │
│  [list of previous calls: date, agent, type, outcome]           │
├─────────────────────────────────────────────────────────────────┤
│  OUTCOME BUTTONS                                                │
│  ─────────────────────────────────────────────────────          │
│  [ تأكيد ] [ جدولة ] [ لم يرد ] [ إلغاء ]                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Call Type Selector (Top of Session)

The `call_type` field sits at the top of every call session. It is:

- **Always visible** — agent never loses track of what type the call is
- **Editable at any time** — until the call is closed/submitted
- **Pre-filled** based on source:
  - ERP sell order → `SELL` pre-filled, agent confirms
  - Direct/ask call → `ASK` pre-filled, agent reclassifies as needed

### Call Type Options

| Value | Arabic Label | Creates Ticket? |
|-------|-------------|-----------------|
| `ask` | استفسار | No — call log only |
| `sell` | مبيعات | Yes — HVS sell ticket |
| `replacement` | استبدال | Yes — HVR replacement ticket |
| `maintenance` | صيانة | Yes — HVM maintenance ticket |
| `return` | استرجاع | Yes — HVT return ticket |

**When agent changes type from ASK to any other:**
- Product/address fields become required
- Form validates before allowing "confirm" submission

**When type stays ASK:**
- Only notes are required
- No product or address fields needed

---

## Session States

### Phase 1: Opening

| Trigger | Call Type Pre-Filled | Data Pre-Filled |
|---------|---------------------|-----------------|
| Agent opens ERP order from queue | `sell` | Bosta auto-enriched data |
| Agent opens direct/manual call | `ask` | Bosta lookup result (if found) |
| Agent opens scheduled callback | Same as original type | Last saved state |

### Phase 2: Active (In Call)

Agent is speaking to customer. All fields editable:
- call_type (can change freely)
- customer name, phone, address
- product list, quantities
- COD amount
- notes

No data is saved until the agent submits an outcome.

### Phase 3: Outcome Submission

Agent clicks one of five outcome buttons:

---

## Outcomes

### ✅ confirmed — تأكيد

Agent and customer have reached full agreement.

```
Triggered when: agent clicks [ تأكيد ]

Validations before submit:
  - If call_type ≠ ASK: products + address required
  - If call_type = ASK: notes required

Backend actions:
  1. call record saved:
       calls.status = 'confirmed'
       calls.call_type = [selected type]
       calls.attempt_number = N
       calls.notes = [agent notes]
       calls.agent_id = [current agent]
       calls.linked_to_order_id = order.id (if exists)

  2. If call_type = ASK:
       → No order/ticket created
       → Call log only

  3. If call_type = sell (ERP source):
       POST /api/call-center/orders/<id>/confirm-by-customer
       → service_ticket created: service_type='sell', status='PENDING'
       → order.status = 'converted'

  4. If call_type = sell/R/M/T (direct source):
       → draft order created or updated: status='confirmed'
       → leader review triggered
       → leader approves → ticket PENDING
```

### 📅 scheduled — جدولة

Customer asked to be called back later, or agent sets a future callback.

```
Triggered when: agent clicks [ جدولة ]

Required input: callback datetime (date + time picker)

Backend actions:
  1. call record saved:
       calls.status = 'scheduled'
       calls.scheduled_callback_at = [chosen datetime]
       calls.notes = [reason for scheduling]

  2. order.status = 'scheduled'
     order.scheduled_callback_at = [chosen datetime]

  3. Order re-enters queue when: NOW() ≥ scheduled_callback_at
     (queue view filters by this)

UI note: scheduled orders show a clock badge in the queue.
```

### 📵 no_answer — لم يرد

Customer phone rang but was not answered.

```
Triggered when: agent clicks [ لم يرد ]

Backend actions:
  1. call record saved:
       calls.status = 'no_answer'
       calls.attempt_number = N

  2. order.attempt_count++
     order.next_action_at = NOW() + 4 hours
     (order locked out of queue for 4 hours)

Retry limit: 3 attempts
  - attempt 1 → retry after 4h
  - attempt 2 → retry after 4h
  - attempt 3+ → status unchanged; order stays in queue until agent acts
               → removed from regular queue
               → escalation queue for supervisor

UI note: order badge shows attempt count (e.g., "محاولة 2/3")
```

### ❌ canceled — إلغاء

Customer refused the order, or agent determined order is invalid.

```
Triggered when: agent clicks [ إلغاء ]

Required input: cancellation reason (dropdown + optional notes)

Reasons:
  - customer_refused      — العميل رفض
  - wrong_number          — رقم خاطئ
  - order_not_needed      — الطلب غير مطلوب
  - duplicate_order       — طلب مكرر
  - address_unreachable   — العنوان غير متاح
  - other                 — أخرى

Backend actions:
  1. call record saved: calls.status = 'canceled'
  2. order.status = 'canceled'
     order.cancellation_reason = [reason]
  3. Order removed from active queue
  4. Order visible in "ملغية" filter tab

UI note: cannot undo cancellation from call session (supervisor can restore).
```

## Call Record Data (calls table)

Each outcome submission creates one row in `calls`:

```sql
id                    INT PRIMARY KEY AUTO_INCREMENT
linked_to_order_id    INT NULL       -- for PATH A + PATH B orders
linked_to_ticket_id   INT NULL       -- for post-ticket follow-up calls
call_type             ENUM('ask','sell','replacement','maintenance','return')
status                ENUM('confirmed','scheduled','no_answer','canceled')
attempt_number        INT            -- 1, 2, 3...
agent_id              INT            -- who made the call
scheduled_callback_at DATETIME NULL  -- set when status='scheduled'
next_action_at        DATETIME NULL  -- set when status='no_answer'
notes                 TEXT           -- agent's free-text notes
created_at            DATETIME       -- when the call record was created
```

---

## ERP Source — What Agent Sees vs Direct Source

| Field | ERP Source (PATH A) | Direct Source (PATH B) |
|-------|---------------------|------------------------|
| call_type | SELL (pre-filled) | ASK (default) |
| customer name | Bosta auto-filled | Agent fills from search |
| address | Bosta auto-filled | Agent fills |
| products | ERP order items | Agent selects |
| COD | ERP/Bosta value | Agent fills |
| Editable? | ✅ Yes, all fields | ✅ Yes, all fields |

---

## Multi-Attempt Scenario (Same Order)

```
Order: source='erp', service_type='sell', status='new'
attempt_count = 0

─── Attempt 1 ───────────────────────────────
Agent opens call session
Customer doesn't answer
Outcome: no_answer
→ calls: {attempt_number=1, status='no_answer'}
→ order: {attempt_count=1, next_action_at=NOW()+4h}

─── 4 hours later ───────────────────────────
Order re-enters queue

─── Attempt 2 ───────────────────────────────
Different agent opens call session (sees attempt history)
Customer answers; wants to reschedule
Outcome: scheduled → callback_at = [tomorrow 2pm]
→ calls: {attempt_number=2, status='scheduled'}
→ order: {status='scheduled', scheduled_callback_at=[tomorrow 2pm]}

─── Tomorrow 2pm ─────────────────────────────
Order returns to queue with scheduled badge

─── Attempt 3 ───────────────────────────────
Agent opens call session
Customer confirms
Outcome: confirmed
→ calls: {attempt_number=3, status='confirmed', call_type='sell'}
→ service_ticket created (PENDING)
→ order.status = 'converted'
```

---

## Post-Ticket Follow-Up Calls

Once an order becomes a service ticket, further calls are linked to the ticket, not the order:

```sql
calls.linked_to_ticket_id = service_ticket.id
calls.linked_to_order_id  = NULL
```

These calls are logged via the `ServiceModalViewer` inside the Hub (not the call center queue).

---

*Version 3.0 | 2026-02-25*
