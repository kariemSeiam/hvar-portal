# CALL CENTER — BRAIN MAP

> `/venom` entry point. Start here. Every question has a file.
> Path: `docs/call-center/`

---

## 🧠 Read First (30 min total)

| Order | File | What It Answers | Time |
|-------|------|----------------|------|
| 1 | [CONTEXT_SUMMARY.md](CONTEXT_SUMMARY.md) | Two journeys, five types, key corrections table | 5 min |
| 2 | [00-NEW-VISION.md](00-NEW-VISION.md) | Full system vision, paths A+B, state machines, flow diagrams | 10 min |
| 3 | [workflow.md](workflow.md) | Step-by-step: Journey A (ERP sell) + Journey B (direct/ask) | 10 min |
| 4 | [call-session-cycle.md](call-session-cycle.md) | Call session UI, call types, 5 outcomes, multi-attempt scenarios | 5 min |

---

## 📐 Data & Model

| File | What It Contains |
|------|-----------------|
| [DATA-AND-RELATIONS.md](DATA-AND-RELATIONS.md) | **What you have:** ERP, Bosta, customers, orders, calls, tickets. Relation keys: phone & tracking |
| [calls-model.md](calls-model.md) | Full DB schema: calls, orders, service_tickets. `call_type` vs `service_type` distinction |
| [order-lifecycle.md](order-lifecycle.md) | Order state machine. ERP vs direct entry. What happens to orders per outcome |
| [ORDER-STATES-FLOW.md](ORDER-STATES-FLOW.md) | **Full cycle:** All 5 states (no escalated), ASCII workflows, transition matrix, API summary |
| [COST-FLOW-CALL-SESSION.md](COST-FLOW-CALL-SESSION.md) | **Cost flow:** Where cost/total is calculated, displayed, passed for sell/R/M/T |
| [erp-order-journey.md](erp-order-journey.md) | **ERP → orders:** From draft fetch to DB row. Mapping, enrichment, normalization, storage |
| [orders-at-day-end.md](orders-at-day-end.md) | **Day end:** Unconfirmed persist; backlog rolls into "today" when `today` param; scheduled→new needs cron |

---

## 🔌 API & Integrations

| File | What It Contains |
|------|-----------------|
| [API_ENDPOINTS.md](API_ENDPOINTS.md) | All endpoints: ERP sync, Bosta lookup, order actions, call logging, errors |
| [sync-from-erp-flow.md](sync-from-erp-flow.md) | **sync-from-erp:** request → ERP auth/fetch → row mapping → skip logic → Bosta enrich → DB insert → response |
| [erp-draft-dt-response-shape.md](erp-draft-dt-response-shape.md) | **ERP response shape:** keys, types, mobile/contact_name_text/final_total mapping |
| [sync-from-erp-recommendations.md](sync-from-erp-recommendations.md) | Skip reasons: missing_required, already_exists, create_failed. Diagnostic script usage + actions |
| [bosta-integration.md](bosta-integration.md) | Bosta: 4 order types, phone normalization, unified format, 5 endpoints, error codes |

---

## 🏗️ Workflows

| File | What It Contains |
|------|-----------------|
| [service-types-reference.md](service-types-reference.md) | Agent decision tree, type comparison, stock matrix, business rules R/M/T/S |
| [leader-approval-workflow.md](leader-approval-workflow.md) | Leader 3 actions (approve/reject/request-info), queue, ticket creation |

---

## 📁 Other

| File | What It Contains |
|------|-----------------|
| [CALL-SESSION-CUSTOMER-LOCATION-INTEGRATION.md](CALL-SESSION-CUSTOMER-LOCATION-INTEGRATION.md) | **Call session customer/location** — Bosta-style UI (CustomerCard + LocationCard), real persistence (update/create via customer API) |
| [CALL-SESSION-MODAL-DATA-KEYS.md](CALL-SESSION-MODAL-DATA-KEYS.md) | Call session FAB data keys, ERP vs API, why fields show "لا يوجد" |
| [GAPS-AND-TRANSFORMATION.md](GAPS-AND-TRANSFORMATION.md) | **Gaps vs vision** — what's missing, mocks, roadmap, ready for next phase |
| [README.md](README.md) | System overview + new developer quick-start |

## 🛠 Implementation (dev)

| Location | What It Contains |
|----------|------------------|
| [dev/call-center/](../../dev/call-center/) | Phase eats (A–D, B+), DESIGN-TRANSFORMATION-PHASES, NEXT-EAT — design polish + next priorities |
| [dev/orders-table/PLAN.md](../../dev/orders-table/PLAN.md) | **Orders table:** vision, full schema (orders + calls), relations to Bosta/tickets/customers, migration order, API alignment. Eat-ready for implementation. |

---

## ⚡ Quick Reference

```
TWO PATHS:
  PATH A  → ERP /sells/draft-dt → order(source=erp, type=sell) → Bosta auto-enrich → Queue → Call → Confirm → PENDING ticket → Leader → Hub
  PATH B  → Agent creates call → type=ASK → reclassify? → if ASK: log only | if typed: draft → Leader → ticket → Hub

FIVE CALL TYPES (calls.call_type):
  ask / sell / replacement / maintenance / return

FIVE CALL OUTCOMES (calls.status):
  confirmed / scheduled / no_answer / canceled

ORDER STATES (orders.status):
  new → scheduled | confirmed → converted
                              → canceled
              (3x no_answer) → stays in queue (status unchanged)

TICKET STATES (service_tickets.status):
  PENDING → CONFIRMED → IN_PROCESS → READY_FOR_DISPATCH → SENT → COMPLETED

KEY RULE: call_type ≠ service_type (different fields, different tables, often same value)
KEY RULE: ERP orders → service_type='sell' always. NEVER NULL for ERP source.
KEY RULE: ASK calls → no order, no ticket. Call log only.
KEY RULE: 3+ no_answer attempts → status unchanged; order stays in queue until agent acts.
```

---

*Version 4.0 | 2026-02-25 | Canonical brain map — cleaned, compressed, VENOM-ready*
