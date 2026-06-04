# Order States Flow — Full Cycle

> **Version**: 1.0 | **Status**: CANONICAL
> Complete state machine with ASCII workflows for each state.

---

## All Order States

| Status | Arabic | Tab | Terminal? | Description |
|--------|--------|-----|-----------|-------------|
| `new` | جديد | جديدة | No | In queue; 3+ no-answer stay here until agent acts |
| `scheduled` | مجدولة | مجدولة | No | Callback set; waiting for scheduled time |
| `confirmed` | مؤكدة | مؤكدة | No | Agent + customer agreed; awaiting leader approval |
| `converted` | منتهي | مكتملة | **Yes** | Order → service ticket; done in call center |
| `canceled` | ملغاة | ملغاة | **Yes** | Rejected / refused / invalid |

**Open states** (still in queue): `new`, `scheduled`, `confirmed`  
**Closed states** (terminal): `converted`, `canceled`

---

## Master State Diagram

```
                                    ┌──────────────────────────────────────────────────────────────┐
                                    │                         ORDER ENTRY                          │
                                    └──────────────────────────────────────────────────────────────┘
                                                              │
                    ERP sync / Direct create                   │
                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         new                                                          │
│  (In queue · agent can call)                                                                         │
└───────┬──────────────────┬──────────────────┬──────────────────┬───────────────────────────────────┘
        │                  │                  │                  │
        │ confirm          │ schedule         │ no_answer        │ cancel
        │                  │                  │ (any attempt)    │
        ▼                  ▼                  │                  ▼
┌───────────────┐  ┌───────────────┐          │           ┌───────────────┐
│   confirmed   │  │   scheduled   │          │           │   canceled    │
│ (leader queue)│  │ (wait callback)│          │           │   [TERMINAL]  │
└───────┬───────┘  └───────┬───────┘          │           └───────────────┘
        │                  │                  │
        │ leader-approve   │ (time→queue)     │ status unchanged
        │                  │ agent acts       │ (3+ attempts stay in queue)
        ▼                  ▼                  │
┌───────────────┐  ┌───────────────┐          │
│   converted   │  │   scheduled   │          │
│   [TERMINAL]  │  │ agent: same   │          │
│               │  │ outcomes as new│          │
└───────────────┘  └───────────────┘          │
        ▲                  ▲                  │
        │  leader-reject   │  leader-request-info
        │                  │
        └──────────────────┘
```

---

## ASCII Workflow by State

### 1. `new`

**Meaning:** Order in queue. Agent has not called yet, or order returned from scheduled callback.

**Entry:**
- ERP sync → `source=erp`, `status=new`
- Direct create → `source=direct`, `status=new`
- Scheduled callback time reached → `roll_forward_backlog_to_today` sets `next_action_at` to today
- Leader reject / request-info → `status=new`

```
┌─────────────────────────────────────────────────────────────────┐
│  STATE: new                                                      │
├─────────────────────────────────────────────────────────────────┤
│  Agent opens call session                                        │
│       │                                                          │
│       ├──► [ تأكيد ] confirm-by-customer ──► confirmed            │
│       │                                                          │
│       ├──► [ جدولة ] schedule ─────────────► scheduled            │
│       │         (callback_at required)                            │
│       │                                                          │
│       ├──► [ لم يرد ] no-answer ──────────► status unchanged      │
│       │         attempt_count++                                   │
│       │         next_action_at = NOW + 4h                          │
│       │         (3+ attempts stay in queue until agent acts)      │
│       │                                                          │
│       └──► [ إلغاء ] cancel ──────────────► canceled               │
└─────────────────────────────────────────────────────────────────┘

API: POST /orders/:id/confirm-by-customer | schedule | no-answer | cancel
```

---

### 2. `scheduled`

**Meaning:** Agent set a callback. Order waits until `scheduled_callback_at`.

**Entry:** Agent clicks "جدولة" from `new` (or `confirmed` — schedule works from any non-canceled).

**Exit:**
- **Time-based:** `roll_forward_backlog_to_today` runs when viewing today; orders with `next_action_at` in the past get `next_action_at = today_start`. Status stays `scheduled` — they just appear in "today" queue for the agent to work.
- **Agent action:** When agent calls and picks an outcome (confirm/schedule/no-answer/cancel), status changes accordingly.

```
┌─────────────────────────────────────────────────────────────────┐
│  STATE: scheduled                                                │
├─────────────────────────────────────────────────────────────────┤
│  scheduled_callback_at stored                                    │
│  next_action_at = callback time                                   │
│       │                                                          │
│       │  (When callback time arrives / backlog roll-forward)       │
│       │  Order appears in "today" queue                            │
│       │                                                          │
│       │  Agent can also: schedule (change time), confirm,         │
│       │  no-answer, cancel — same as new                          │
│       │                                                          │
│       └──► schedule / confirm / no-answer / cancel ──► (as new)  │
└─────────────────────────────────────────────────────────────────┘

API: POST /orders/:id/schedule (from new/scheduled/confirmed)
```

---

### 3. `confirmed`

**Meaning:** Agent confirmed with customer. Snapshot stored. Waiting for leader.

**Entry:** Agent clicks "تأكيد" → `confirm-by-customer`

**Leader actions:**

```
┌─────────────────────────────────────────────────────────────────┐
│  STATE: confirmed                                                │
├─────────────────────────────────────────────────────────────────┤
│  confirmation_snapshot stored (items, customer, address, etc.)   │
│  converted_to_ticket_id = NULL                                   │
│       │                                                          │
│       ├──► [ موافقة ] leader-approve ──────► converted           │
│       │         Creates service_ticket from snapshot               │
│       │         Sets converted_to_ticket_id                       │
│       │                                                          │
│       ├──► [ رفض ] leader-reject ──────────► new                 │
│       │         Clears confirmation_snapshot                      │
│       │                                                          │
│       └──► [ طلب معلومات ] leader-request-info ─► new            │
│                 Stores message in snapshot; back to agent         │
└─────────────────────────────────────────────────────────────────┘

API: POST /orders/:id/leader-approve | reject | request-info
```

---

### 4. `converted` (terminal)

**Meaning:** Order converted to service ticket. Call center work done.

**Entry:** Leader approves from `confirmed`.

**No exit.** Terminal state.

```
┌─────────────────────────────────────────────────────────────────┐
│  STATE: converted                                                │
├─────────────────────────────────────────────────────────────────┤
│  converted_to_ticket_id = <ticket_id>                            │
│  approved_by, approved_at set                                    │
│       │                                                          │
│       └──► [TERMINAL] No further transitions                     │
│             Order leaves call center queue                        │
│             Hub ticket workflow continues (PENDING → ...)         │
└─────────────────────────────────────────────────────────────────┘

API: None (end state)
```

---

### 5. `canceled` (terminal)

**Meaning:** Order canceled. Removed from queue.

**Entry:** Agent clicks "إلغاء" from any non-canceled state.

**No exit.** Terminal state.

```
┌─────────────────────────────────────────────────────────────────┐
│  STATE: canceled                                                 │
├─────────────────────────────────────────────────────────────────┤
│  cancellation_reason stored (optional)                            │
│  Call record created with status='canceled'                       │
│       │                                                          │
│       └──► [TERMINAL] No further transitions                     │
│             Order hidden from active queues                       │
└─────────────────────────────────────────────────────────────────┘

API: POST /orders/:id/cancel (from new/scheduled/confirmed)
```

---

## Transition Matrix

| From \ To | new | scheduled | confirmed | converted | canceled |
|-----------|-----|-----------|-----------|-----------|----------|
| **new** | — | schedule | confirm | — | cancel |
| **scheduled** | roll-forward / work | schedule | confirm | — | cancel |
| **confirmed** | reject, request-info | schedule | — | **approve** | — |
| **converted** | — | — | — | — | — |
| **canceled** | — | — | — | — | — |

**no_answer:** status unchanged; attempt_count++; 3+ attempts stay in queue until agent acts.

---

## API Endpoints Summary

| Action | Endpoint | From → To |
|--------|----------|-----------|
| Confirm | `POST /orders/:id/confirm-by-customer` | new/scheduled → confirmed |
| Schedule | `POST /orders/:id/schedule` | * → scheduled |
| No-answer | `POST /orders/:id/no-answer` | * → status unchanged (attempt_count++) |
| Cancel | `POST /orders/:id/cancel` | * → canceled |
| Leader approve | `POST /orders/:id/leader-approve` | confirmed → converted |
| Leader reject | `POST /orders/:id/reject` | confirmed → new |
| Leader request-info | `POST /orders/:id/request-info` | confirmed → new |

---

## Special: Ask-Only (No Order)

Calls with `call_type=ask` create **no order**. Only a `calls` record.

```
Agent opens session (type=ASK)
    │
    └──► Agent confirms (inquiry resolved)
              │
              └──► calls: { call_type='ask', status='confirmed' }
                    NO order
                    NO ticket
```

**API:** `POST /api/call-center/calls/ask-only`

---

*Version 1.0 | 2026-03-10*
