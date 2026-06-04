# CALL CENTER DOCS — INDEX

> **Version**: 3.0 | **Updated**: 2026-02-25

---

## Start Here

| Doc | What It Answers |
|-----|----------------|
| [README.md](README.md) | What is the call center? Quick-start for new developers. |
| [CONTEXT_SUMMARY.md](CONTEXT_SUMMARY.md) | One-page summary: two journeys, five types, key corrections |
| [00-NEW-VISION.md](00-NEW-VISION.md) | Full system vision, paths A+B, state machines, diagrams |

---

## Workflow & Procedures

| Doc | What It Answers |
|-----|----------------|
| [workflow.md](workflow.md) | Step-by-step: Journey A (ERP sell) and Journey B (direct/ask) |
| [call-session-cycle.md](call-session-cycle.md) | Call session UI, call types, outcomes, multi-attempt scenarios |

---

## Data Model

| Doc | What It Answers |
|-----|----------------|
| [calls-model.md](calls-model.md) | Database schema: calls, orders, service_tickets. call_type vs service_type. |
| [order-lifecycle.md](order-lifecycle.md) | Order state machine. ERP vs direct entry. What happens to orders. |

---

## API Reference

| Doc | What It Answers |
|-----|----------------|
| [API_ENDPOINTS.md](API_ENDPOINTS.md) | All endpoints: ERP sync, Bosta lookup, order actions, call logging |

---

## Deprecated / Removed

| Doc | Status | Replaced By |
|-----|--------|-------------|
| `draft-lifecycle.md` | ❌ Removed | [order-lifecycle.md](order-lifecycle.md) |

---

## Key Concepts Map

```
Order Sources:
  erp     → service_type=sell, auto-Bosta-enriched
  direct  → service_type=NULL initially (ASK), typed during call

Call Types (5):
  ask / sell / replacement / maintenance / return
  (call_type field on calls table)

Call Outcomes:
  confirmed / scheduled / no_answer / canceled / left_message
  (status field on calls table)

Order States:
  new → scheduled | confirmed → converted
                              → canceled
                     ↓ (3x no_answer)
                  escalated

Service Ticket States:
  PENDING → CONFIRMED → IN_PROCESS → READY_FOR_DISPATCH → SENT → COMPLETED
```

---

## Reading Order (recommended)

1. `CONTEXT_SUMMARY.md` — 5 min, understand the model
2. `00-NEW-VISION.md` — 10 min, full picture
3. `workflow.md` — 10 min, what the agent does
4. `call-session-cycle.md` — 10 min, per-call procedure
5. `order-lifecycle.md` — 5 min, state machine
6. `calls-model.md` — 10 min, database structure
7. `API_ENDPOINTS.md` — reference, as needed

---

*Version 3.0 | 2026-02-25*
