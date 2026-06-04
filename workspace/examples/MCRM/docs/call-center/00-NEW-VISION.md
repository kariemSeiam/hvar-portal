# HUB-MCRM CALL CENTER — SYSTEM VISION

> **Version**: 3.0 | **Date**: 2026-02-25 | **Status**: CANONICAL REFERENCE

---

## Executive Summary

The Hvar Call Center is a unified call management platform with two distinct entry paths and five call types. The key distinctions from previous documentation:

| Old (Incorrect) | New (Correct) |
|-----------------|---------------|
| All orders enter as `service_type = NULL` drafts | ERP orders enter as SELL orders with known type |
| Type selected at confirmation for all sources | Type is pre-known for ERP; selected by agent for direct calls |
| No "ask" call type modeled | ASK is the 5th call type — inquiry only, no ticket |
| Call states and order states mixed together | Clearly separated: call outcomes vs order/ticket lifecycle |
| Three sources all produce generic drafts | ERP → sell orders; Direct → ask calls; Bosta enriches both |

---

## Two Entry Paths

### PATH A — ERP Sell Order (most common queue item)

```
ERP /sells/draft-dt
    ↓
Order enters system: source='erp', service_type='sell', status='new'
    ↓
Bosta lookup: auto-fetch customer data by phone/tracking number
    ↓
Agent opens call session (call_type=SELL pre-filled, data auto-populated)
    ↓
Agent calls customer → reviews & corrects details
    ↓
Call outcome: confirmed | scheduled | no_answer | canceled
    ↓ (if confirmed)
Sell ticket created → service_tickets: status='PENDING', service_type='sell'
    ↓
Leader review → approve → Hub workflow begins
```

**Key facts:**
- ERP `/sells/draft-dt` endpoint returns sell orders specifically (not generic drafts)
- These are orders already placed on the ERP server awaiting call-center confirmation
- The same orders exist in Bosta — customer data is pulled from Bosta automatically
- `service_type` is NOT NULL for these orders; it is always `sell`
- Agent's role: verify, correct if needed, confirm with customer

---

### PATH B — Direct / Ask Call (customer calls in or agent initiates)

```
Agent receives inbound call or initiates outbound
    ↓
Agent searches customer by phone → Bosta lookup (manual or auto)
    ↓
Call session created: call_type='ask' (default, no order yet)
    ↓
Agent understands customer need
    ↓
    ├─ Need = inquiry only → stays ASK → call logged, no ticket
    ├─ Need = buy product/parts → reclassify to SELL
    ├─ Need = defective swap → reclassify to REPLACEMENT (R)
    ├─ Need = repair → reclassify to MAINTENANCE (M)
    └─ Need = return → reclassify to RETURN (T)
    ↓ (if reclassified and confirmed)
Draft order created → leader review → ticket PENDING
    ↓
Hub workflow begins
```

**Key facts:**
- Direct calls start as ASK — the agent doesn't know the type until speaking to the customer
- ASK type can be changed to any other type at any time during the call session
- ASK calls that remain ask (no reclassification) are logged as calls only — no order, no ticket created
- Manual Bosta search available so agent can pull customer's order history

---

## Five Call Types

| Type | Label (Arabic) | Creates Ticket? | Source |
|------|---------------|-----------------|--------|
| **ASK** | استفسار | No — call log only | Direct calls |
| **SELL (S)** | مبيعات | Yes — HVS ticket | ERP orders / Direct |
| **REPLACEMENT (R)** | استبدال | Yes — HVR ticket | Direct calls |
| **MAINTENANCE (M)** | صيانة | Yes — HVM ticket | Direct calls |
| **RETURN (T)** | استرجاع | Yes — HVT ticket | Direct calls |

**Important:** `call_type` lives on the `calls` table. `service_type` lives on `orders` and `service_tickets`. They align but are separate fields.

---

## Call Session States (Separate from Order States)

### Call-level outcomes (what the agent logs per attempt)

```
CALL ACTIVE
    ├─→ confirmed   — agent + customer reached agreement; order/ticket action triggered
    ├─→ scheduled   — callback set for a future date/time
    ├─→ no_answer   — customer didn't pick up; retry logic applies (3 attempts, 4h gap)
    └─→ canceled    — customer refused or order not valid
```

Each call attempt produces one call record with one of the above outcomes. These are independent of the order state.

### Order/ticket states (driven by call outcomes)

```
ORDER STATE after confirmed call:
  ERP sell order  → sell ticket created (PENDING) → leader approval → Hub
  Direct (R/M/T)  → draft created → leader approval → ticket (PENDING) → Hub
  ASK call        → no order, no ticket (call log only)

ORDER STATE after scheduled call:
  order.status = 'scheduled'
  order.scheduled_callback_at = [datetime]
  order re-enters queue at scheduled time

ORDER STATE after no_answer:
  order.attempt_count++
  order.next_action_at = NOW() + 4 hours
  order remains in queue, locked out until gap expires

ORDER STATE after canceled:
  order.status = 'canceled'
  order.cancellation_reason saved
```

---

## System Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CALL CENTER SYSTEM                             │
├──────────────────────────┬─────────────────────────────────────────────┤
│    PATH A: ERP SELL      │         PATH B: DIRECT / ASK               │
│                          │                                             │
│  ERP /sells/draft-dt     │   Agent receives/makes call                │
│         ↓                │         ↓                                  │
│  Order: source=erp       │   Search customer by phone                 │
│  service_type=sell       │         ↓                                  │
│  status=new              │   Bosta lookup (manual)                    │
│         ↓                │         ↓                                  │
│  Bosta auto-enrich       │   Call type: ASK (default)                 │
│  (phone → customer data) │   [changeable to S/R/M/T]                 │
│         ↓                │         ↓                                  │
│  Call session: SELL      │   Call session: ASK or typed               │
└──────────────────────────┴─────────────────────────────────────────────┘
                    ↓                       ↓
              ┌─────────────────────────────────┐
              │        CALL ACTIVE              │
              │  Agent reviews/corrects data    │
              │  call_type displayed + editable │
              └─────────────────────────────────┘
                              ↓
              ┌───────────────────────────────────────────────┐
              │              CALL OUTCOME                     │
              ├───────────────────────────────────────────────┤
              │ confirmed  → action based on call_type:       │
              │   ASK      → log only, no ticket              │
              │   SELL     → sell ticket PENDING              │
              │   R/M/T    → draft → leader → ticket PENDING  │
              │                                               │
              │ scheduled  → order.status = scheduled         │
              │ no_answer  → attempt_count++, gap time set    │
              │ canceled   → order.status = canceled          │
              └───────────────────────────────────────────────┘
                              ↓
              ┌───────────────────────────────────────────────┐
              │          TICKET CREATED (if applicable)       │
              │  HVS (sell) / HVR / HVM / HVT                │
              │  status = PENDING                             │
              │  → Leader approval                            │
              │  → Hub workflow                               │
              └───────────────────────────────────────────────┘
```

---

## Customer 360° View

When a call session opens, the agent sees a unified view of the customer:

```
Customer Phone Search (01XXXXXXXXX)
    ↓
┌──────────────────────────────────────────────┐
│  CUSTOMER 360° VIEW                          │
├──────────────────────────────────────────────┤
│ 1. CUSTOMER INFO                             │
│    name, phone, address, governorate, city   │
│                                              │
│ 2. BOSTA ORDERS (fetched from Bosta API)     │
│    all tracking numbers, types, COD, status  │
│                                              │
│ 3. SERVICE TICKETS (internal)                │
│    all types R/M/T/S, all statuses           │
│    ticket numbers, dates, completion status  │
│                                              │
│ 4. CALL HISTORY                              │
│    all past calls (orders + tickets)         │
│    agent, date, outcome, notes               │
└──────────────────────────────────────────────┘
```

---

## Bosta Integration Role

Bosta is the shipping provider. In the call center, Bosta serves two roles:

| Role | When Used | How |
|------|-----------|-----|
| **Auto-enrich ERP orders** | PATH A: when ERP order syncs | Backend looks up customer phone in Bosta API, fills address/COD/tracking |
| **Manual customer lookup** | PATH B: agent searches manually | Agent enters phone, backend calls Bosta API, returns order history |

Bosta orders are external shipping records. They are NOT service tickets. They provide:
- Customer identity verification
- Delivery address
- COD amount
- Order tracking number (becomes `original_tracking` on service ticket)
- Delivery status (helps agent understand the context)

---

## Service Ticket Lifecycle (After Call Confirmed)

Once an agent confirms a call and a ticket is created, it moves to the Hub:

```
Call confirmed → ticket created (PENDING)
    ↓
Leader review
    ├─ approved  → ticket moves to Hub-specific workflow
    └─ rejected  → returns to agent for correction

Hub workflows by type:
  SELL (S):        PENDING → CONFIRMED → IN_PROCESS → READY_FOR_DISPATCH → SENT → COMPLETED
  REPLACEMENT (R): PENDING → CONFIRMED → IN_PROCESS → READY_FOR_DISPATCH → SENT → COMPLETED
  MAINTENANCE (M): PENDING → CONFIRMED → IN_PROCESS (start/complete) → READY_FOR_DISPATCH → SENT → COMPLETED
  RETURN (T):      PENDING → CONFIRMED → IN_PROCESS → COMPLETED
```

---

## Key Data Fields

### orders table (call center order record)

```sql
source       ENUM('erp', 'bosta', 'direct')  -- origin
service_type ENUM('R', 'M', 'T', 'S') NULL   -- NULL only for ask/direct unconfirmed
status       ENUM('new', 'scheduled', 'confirmed', 'converted', 'canceled')
attempt_count INT                             -- how many call attempts
next_action_at DATETIME                       -- when order becomes callable again
```

### calls table (per call attempt)

```sql
call_type            ENUM('ask','sell','replacement','maintenance','return')
linked_to_order_id   INT NULL   -- set for orders (PATH A + PATH B reclassified)
linked_to_ticket_id  INT NULL   -- set for ticket follow-up calls
status               ENUM('confirmed','scheduled','no_answer','canceled')
attempt_number       INT        -- 1, 2, 3...
```

### service_tickets table (after approval)

```sql
service_type ENUM('replacement','maintenance','return','sell')
status       ENUM('PENDING','CONFIRMED','IN_PROCESS','READY_FOR_DISPATCH','SENT','COMPLETED','CANCELLED')
source       ENUM('call_center','hub','web')
```

---

## What This Is NOT

- **NOT** a COD verification system (old model) — it is a full call management system
- **NOT** draft-first for ERP sources — ERP orders know their type (sell) on arrival
- **NOT** a system where all sources produce type=NULL drafts — only direct/ask calls are untyped initially
- **NOT** where the agent selects type at the end for ERP orders — type is known from the start

---

*Last Updated: 2026-02-25 | Version: 3.0 | Status: Canonical*
