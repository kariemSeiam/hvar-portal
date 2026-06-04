# CALLS DATA MODEL

> **Version**: 3.0 | **Status**: CANONICAL

---

## Overview

The `calls` table records every call attempt made by an agent. It is separate from orders and service_tickets. The key addition in this version: `call_type` as an explicit field on the calls table, distinct from `service_type` on orders/tickets.

---

## calls Table Schema

```sql
CREATE TABLE calls (
    id                    INT PRIMARY KEY AUTO_INCREMENT,

    -- Dual-linking: a call can belong to an order OR a ticket, not both
    linked_to_order_id    INT NULL REFERENCES orders(id),
    linked_to_ticket_id   INT NULL REFERENCES service_tickets(id),

    -- CALL TYPE — what kind of call this is
    -- Distinct from service_type on orders/tickets (see section below)
    call_type             ENUM(
                            'ask',          -- استفسار: inquiry only, no ticket
                            'sell',         -- مبيعات: sell order confirmation
                            'replacement',  -- استبدال: defective product swap
                            'maintenance',  -- صيانة: repair
                            'return'        -- استرجاع: product return
                          ) NOT NULL,

    -- CALL OUTCOME — what happened on this attempt
    status                ENUM(
                            'confirmed',    -- تأكيد: agreement reached
                            'scheduled',    -- جدولة: callback set
                            'no_answer',    -- لم يرد: customer didn't pick up
                            'canceled',     -- إلغاء: call canceled/refused
                            'left_message'  -- رسالة: voicemail/message left
                          ) NOT NULL,

    attempt_number        INT NOT NULL DEFAULT 1,   -- 1, 2, 3...
    agent_id              INT NOT NULL REFERENCES users(id),
    customer_phone        VARCHAR(20),               -- snapshot at time of call

    -- Scheduling fields
    scheduled_callback_at DATETIME NULL,    -- set when status='scheduled'
    next_action_at        DATETIME NULL,    -- set when status='no_answer' (+4h gap)

    -- Notes
    notes                 TEXT,
    cancellation_reason   VARCHAR(100) NULL,

    -- Timestamps
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME NULL
);
```

---

## call_type vs service_type — Critical Distinction

These are two different fields that often align but are NOT the same:

| Field | Table | Purpose | Set When |
|-------|-------|---------|----------|
| `call_type` | `calls` | Describes the purpose of the call itself | When call record is created (at call close) |
| `service_type` | `orders`, `service_tickets` | Describes the type of work order | When order is created or ticket is converted |

### Why they're separate

**Example 1: ERP sell order, agent makes 3 attempts**
```
calls[1]: call_type='sell', status='no_answer'   → linked_to_order_id=42
calls[2]: call_type='sell', status='scheduled'   → linked_to_order_id=42
calls[3]: call_type='sell', status='confirmed'   → linked_to_order_id=42

orders[42]: service_type='sell'  ← same value, but on the order
service_tickets[7]: service_type='sell'  ← created from order 42
```

**Example 2: Direct call, agent opens as ASK but reclassifies to maintenance**
```
calls[1]: call_type='maintenance', status='confirmed' → linked_to_order_id=55

orders[55]: service_type='M'   ← maintenance (different encoding: R/M/T/S vs full name)
```

**Example 3: Inquiry-only ASK call (no order)**
```
calls[1]: call_type='ask', status='confirmed' → linked_to_order_id=NULL
                                                 linked_to_ticket_id=NULL
→ No order, no ticket. Call logged only.
```

---

## Dual Linking

A call can link to an order OR a ticket — never both at the same time:

```sql
CONSTRAINT chk_call_link CHECK (
    (linked_to_order_id IS NOT NULL AND linked_to_ticket_id IS NULL)
    OR
    (linked_to_order_id IS NULL AND linked_to_ticket_id IS NOT NULL)
    OR
    (linked_to_order_id IS NULL AND linked_to_ticket_id IS NULL)  -- ASK-only calls
)
```

### When each is used

| Scenario | linked_to_order_id | linked_to_ticket_id |
|----------|--------------------|---------------------|
| Call center agent working an order | ✅ Set | NULL |
| ASK call (no order) | NULL | NULL |
| Hub agent follow-up call on a ticket | NULL | ✅ Set |

---

## call_type Encoding

The `call_type` field uses full lowercase names, unlike the service_type field which uses single-letter codes on some tables:

| call_type (calls table) | service_type (orders) | service_type (service_tickets) |
|------------------------|----------------------|-------------------------------|
| `ask` | NULL or not applicable | N/A (ask calls don't create tickets) |
| `sell` | `S` or `sell` | `sell` |
| `replacement` | `R` or `replacement` | `replacement` |
| `maintenance` | `M` or `maintenance` | `maintenance` |
| `return` | `T` or `return` | `return` |

Frontend display mapping (Arabic):

| call_type | Arabic Label |
|-----------|-------------|
| `ask` | استفسار |
| `sell` | مبيعات |
| `replacement` | استبدال |
| `maintenance` | صيانة |
| `return` | استرجاع |

---

## call status Definitions

| Status | Arabic | Meaning | Next action |
|--------|--------|---------|-------------|
| `confirmed` | تأكيد | Agent + customer reached agreement | Ticket creation (if typed) |
| `scheduled` | مجدولة | Callback set for later | Re-enters queue at callback time |
| `no_answer` | لم يرد | No pickup | Retry after 4h gap (max 3) |
| `canceled` | ملغي | Order/call refused or invalid | Order marked canceled |
| `left_message` | رسالة | Voicemail/message left | No lockout, stays in queue |

---

## Attempt Numbering

`attempt_number` tracks how many times an agent has tried to reach the customer for a given order/ticket:

```
order_id=42:
  calls[1]: attempt_number=1, status='no_answer'
  calls[2]: attempt_number=2, status='scheduled'
  calls[3]: attempt_number=3, status='confirmed'
```

Note: All outcomes (including scheduled, left_message) increment the attempt counter per call session. Only `no_answer` triggers the 4h lockout. The 3-attempt escalation rule counts only `no_answer` attempts.

---

## orders Table (Reference)

The `orders` table stores the call center's working record for each customer request:

```sql
CREATE TABLE orders (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    source              ENUM('erp', 'bosta', 'direct') NOT NULL,
    service_type        ENUM('R', 'M', 'T', 'S') NULL,
                        -- NULL ONLY for direct/ask calls not yet reclassified
                        -- NEVER NULL for source='erp' (always 'S')
    status              ENUM('new', 'scheduled', 'confirmed', 'converted', 'canceled', 'escalated') NOT NULL DEFAULT 'new',
    attempt_count       INT NOT NULL DEFAULT 0,
    next_action_at      DATETIME NULL,
    scheduled_callback_at DATETIME NULL,
    last_attempt_at     DATETIME NULL,
    bosta_tracking      VARCHAR(100) NULL,
    bosta_order_id      VARCHAR(100) NULL,
    erp_order_id        VARCHAR(100) NULL,
    customer_id         INT NULL REFERENCES customers(id),
    customer_phone      VARCHAR(20),
    customer_name       VARCHAR(200),
    delivery_address    TEXT NULL,
    governorate         VARCHAR(100) NULL,
    city                VARCHAR(100) NULL,
    cod_amount          DECIMAL(10,2) NULL,
    cancellation_reason VARCHAR(100) NULL,
    created_from_order_id INT NULL REFERENCES orders(id),
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NULL
);
```

---

## service_tickets Table (Reference)

Created after leader approval, this becomes the canonical work order:

```sql
CREATE TABLE service_tickets (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    ticket_number   VARCHAR(20) UNIQUE,        -- HVS-XXXX, HVR-XXXX, etc.
    service_type    ENUM('replacement','maintenance','return','sell') NOT NULL,
    status          ENUM('PENDING','CONFIRMED','IN_PROCESS','READY_FOR_DISPATCH','SENT','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    source          ENUM('call_center','hub','web') NOT NULL DEFAULT 'call_center',
    created_from_order_id INT NULL REFERENCES orders(id),
    customer_id     INT NULL REFERENCES customers(id),
    -- ... other ticket-specific fields
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Indexes

```sql
-- Fast queue queries
CREATE INDEX idx_orders_status_next_action ON orders(status, next_action_at);
CREATE INDEX idx_orders_source_type ON orders(source, service_type);

-- Call history by customer
CREATE INDEX idx_calls_order ON calls(linked_to_order_id);
CREATE INDEX idx_calls_ticket ON calls(linked_to_ticket_id);
CREATE INDEX idx_calls_phone ON calls(customer_phone);
CREATE INDEX idx_calls_agent ON calls(agent_id);
CREATE INDEX idx_calls_created ON calls(created_at);
```

---

*Version 3.0 | 2026-02-25*
