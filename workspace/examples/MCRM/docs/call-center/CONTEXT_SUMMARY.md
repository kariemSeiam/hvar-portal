# CALL CENTER — CONTEXT SUMMARY

> **Version**: 3.0 | Quick reference. For full details see individual docs.

---

## System in One Paragraph

The Hvar Call Center is a CRM for managing service calls and ERP sell order confirmations. Agents work a queue of orders — some sourced from the ERP (sell orders that need phone confirmation with the customer), others created on the fly from inbound/outbound calls. Every call attempt is logged. Confirmed calls create service tickets that flow into the Hub workflow.

---

## Two Journeys (Quick Reference)

```
JOURNEY A — ERP SELL ORDER
ERP /sells/draft-dt → order(source=erp, type=sell) → Bosta auto-enrich
→ Queue → Agent calls → Review + correct → Confirm
→ sell ticket (PENDING) → Leader → Hub

JOURNEY B — DIRECT / ASK CALL
Agent receives/initiates call → search customer (Bosta manual)
→ Call session (type=ASK) → Agent identifies need → reclassify if needed
→ If ASK: call log only, no ticket
→ If typed: draft order → Leader → ticket (PENDING) → Hub
```

---

## Five Call Types

| call_type | Arabic | Creates Ticket? |
|-----------|--------|-----------------|
| `ask` | استفسار | No |
| `sell` | مبيعات | Yes (HVS) |
| `replacement` | استبدال | Yes (HVR) |
| `maintenance` | صيانة | Yes (HVM) |
| `return` | استرجاع | Yes (HVT) |

`ask` is the default for direct calls. Changeable to any type during the call. ERP calls start as `sell`.

---

## Call States vs Order States — SEPARATED

### Call outcomes (per attempt)

| Status | Meaning |
|--------|---------|
| `confirmed` | Agreement reached |
| `scheduled` | Callback set |
| `no_answer` | Didn't pick up |
| `canceled` | Refused/invalid |

### Order states (lifecycle)

| Status | Meaning |
|--------|---------|
| `new` | Entered system, not yet worked |
| `scheduled` | Callback appointment set |
| `confirmed` | Agent confirmed, awaiting leader approval |
| `converted` | Converted to service ticket |
| `canceled` | Removed from queue |

**These are different tables, different fields. A call outcome of "confirmed" moves the order from "new" to "confirmed" or "converted" — they do not share the same field.**

---

## Key Corrections from Previous Docs

| Was (Wrong) | Is (Correct) |
|-------------|--------------|
| ERP orders have service_type = NULL | ERP orders have service_type = 'sell' always |
| All sources create type=NULL drafts | ERP = sell; Direct = ask (no order) or typed |
| "draft" is the first state | No draft state; orders start as `new` |
| Type selected at end of call for all sources | ERP type known from start; direct selected during call |
| No ASK call type | ASK is 5th call type; no ticket, call log only |
| Call states mixed with order states | Completely separate: calls.status vs orders.status |

---

## ERP Endpoint Clarification

```
GET /api/erp/drafts
    → internally: GET ERP_BASE_URL/sells/draft-dt

These are SELL orders (not generic drafts).
Named "drafts" in the ERP because they haven't been confirmed yet.
service_type = 'sell' on all ERP-sourced orders. Never NULL.
```

---

## Bosta's Role

| When | How | Result |
|------|-----|--------|
| ERP order syncs | Backend auto-lookup by phone/tracking | Customer data auto-filled |
| Direct call (PATH B) | Agent triggers manual search | Customer 360° shown |

Bosta provides: customer identity, delivery address, COD, tracking, order history. It does NOT create service tickets — that's the Hub.

---

## Data Tables Quick Map

```
calls           — one row per call attempt
orders          — one row per customer request (working record)
service_tickets — one row per approved work order (canonical)
customers       — customer master data
```

`calls` links to either `orders.id` or `service_tickets.id`, never both.

`service_type` on orders uses: `R / M / T / S` (single chars or full names)
`call_type` on calls uses: `ask / sell / replacement / maintenance / return` (full names)

---

## 3-Attempt No-Answer Rule

```
no_answer #1 → wait 4h → retry (status unchanged)
no_answer #2 → wait 4h → retry (status unchanged)
no_answer #3+ → status unchanged; order stays in queue until agent acts (confirm/schedule/cancel/no-answer)
```

`scheduled` does NOT count toward the 3-attempt limit.

---

## File Map

| File | Content |
|------|---------|
| `00-NEW-VISION.md` | System vision, two paths, flow diagrams |
| `workflow.md` | Step-by-step Journey A and Journey B |
| `call-session-cycle.md` | Call session UI anatomy, outcomes, call record |
| `order-lifecycle.md` | Order state machine, ERP vs direct entry |
| `calls-model.md` | Database schema: calls + orders + tickets |
| `API_ENDPOINTS.md` | All endpoints, request/response formats |
| `README.md` | System overview for new team members |
| `INDEX.md` | Navigation index |

---

*Version 3.0 | 2026-02-25*
