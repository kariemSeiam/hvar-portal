# HUB-MCRM — BRAIN MAP

> `/venom` master entry point. Everything in one place.
> Path: `docs/INDEX.md`

---

## What Is This System

**HUB-MCRM** — Service CRM for Hvar:
- **Call Center**: ERP sell confirmations + inbound service calls (R/M/T/S/ASK)
- **Hub**: Technician workflow — replacement, maintenance, return, sell tickets
- **Stock**: Parts + products inventory management
- **Customer 360°**: Unified orders, tickets, call history

**Stack**: React 18 + Vite 6 + TailwindCSS (RTL Arabic-first) · Flask Python · MySQL · Bosta shipping API · ERP integration

---

## 🗂️ Docs Structure

```
docs/
  INDEX.md              ← you are here (master brain map)
  call-center/          ← call center module (canonical, cleaned v4.0)
  hub/                  ← hub service ticket workflows
  system/               ← system-wide: API, DB, frontend, stock, customer
  design/               ← UI design system
  reviews/              ← design + code reviews
  plans/                ← feature planning
  archive/              ← retired docs (do not use for decisions)
```

---

## 📞 Call Center Module

> `docs/call-center/INDEX.md` — full call center brain map

**Two paths:**
- **PATH A**: ERP sell orders → Bosta auto-enrich → queue → agent calls → confirm → sell ticket PENDING → leader → hub
- **PATH B**: Direct/inbound → ASK default → reclassify (sell/R/M/T) → draft → leader → ticket PENDING
- **ASK calls**: log only. No order. No ticket.

| File | Purpose |
|------|---------|
| [call-center/CONTEXT_SUMMARY.md](call-center/CONTEXT_SUMMARY.md) | One-page overview, key rules, corrections table |
| [call-center/00-NEW-VISION.md](call-center/00-NEW-VISION.md) | Full vision, paths A+B, all state machines |
| [call-center/workflow.md](call-center/workflow.md) | Step-by-step Journey A and B |
| [call-center/call-session-cycle.md](call-center/call-session-cycle.md) | Call session UI, 5 outcomes, multi-attempt |
| [call-center/calls-model.md](call-center/calls-model.md) | DB schema: calls table, `call_type` vs `service_type` |
| [call-center/order-lifecycle.md](call-center/order-lifecycle.md) | Order state machine, ERP vs direct |
| [call-center/API_ENDPOINTS.md](call-center/API_ENDPOINTS.md) | All call-center API endpoints |
| [call-center/bosta-integration.md](call-center/bosta-integration.md) | Bosta: 4 types, phone norm, format, 5 endpoints |
| [call-center/service-types-reference.md](call-center/service-types-reference.md) | Agent decision tree, type comparison, stock matrix, rules |
| [call-center/leader-approval-workflow.md](call-center/leader-approval-workflow.md) | Leader 3 actions, queue, ticket creation |
| [call-center/GAPS-AND-TRANSFORMATION.md](call-center/GAPS-AND-TRANSFORMATION.md) | Gaps vs vision, mock inventory, roadmap |
| [call-center/README.md](call-center/README.md) | New developer quick-start |

---

## 🏗️ Hub Workflows

Post-call. After leader approves → tickets enter hub.

| File | Purpose |
|------|---------|
| [hub/service_tickets.md](hub/service_tickets.md) | **Core** — schema, 4 state machines, all actions, stock ops |
| [hub/replacement_workflow.md](hub/replacement_workflow.md) | HVR: per-action field reference |
| [hub/maintenance_workflow.md](hub/maintenance_workflow.md) | HVM: per-action field reference |
| [hub/return_workflow.md](hub/return_workflow.md) | HVT: per-action field reference |

---

## ⚙️ System-Wide

| File | Purpose |
|------|---------|
| [system/api_endpoints.md](system/api_endpoints.md) | Auth + general API reference |
| [system/customer.md](system/customer.md) | Customer data model |
| [system/stock.md](system/stock.md) | Stock system: items, movements, BOM, all CRUD endpoints |
| [system/tickets_api_filters.md](system/tickets_api_filters.md) | Ticket filter API — all query params |
| [system/frontend-structure.md](system/frontend-structure.md) | Frontend component conventions |

---

## 🎨 Design

| File | Purpose |
|------|---------|
| [design/design.md](design/design.md) | Full design system: tokens, components, patterns |

Always-active design genome: `.cursor/rules/hub-design.mdc`

```
Primary:   bg-brand-red-600 (#e11d48)
Secondary: bg-brand-blue-600 (#0284c7)
Card:      rounded-lg shadow-sm border border-gray-200 p-6
Font H:    font-cairo | Font B: font-tajawal | RTL: dir="rtl"
```

---

## 🔍 Reviews

| File | Purpose |
|------|---------|
| [reviews/call-center-page-design-and-review.md](reviews/call-center-page-design-and-review.md) | Call center page design audit |
| [reviews/bosta-search-result-screen-design-alignment.md](reviews/bosta-search-result-screen-design-alignment.md) | Bosta search screen design review |

---

## 📐 Plans

| File | Purpose |
|------|---------|
| [plans/2026-02-10-bosta-search-result-screen-redesign.md](plans/2026-02-10-bosta-search-result-screen-redesign.md) | Bosta screen redesign plan |

---

## 📦 Archive

Retired and one-off reports. Do not use for decisions.

| File | Note |
|------|------|
| ANALYSIS_DEDUPLICATE_REQUEST.md | Old dedup analysis |
| REVIEW_FRONTEND_PERFORMANCE.md | Old perf review |
| planning.md | Old implementation plan |
| database-model.md | Schema in calls-model.md |
| service-type-workflows-OLD-DRAFT-FIRST.md | Outdated draft-first model |
| legacy-scan.md | Legacy & tech debt scan |
| legacy-remediation-plan.md | Remediation plan |
| route-structure-fix.md | ServiceActionsPage route fix |
| phase-1-complete.md | Phase 1 AuthProvider done |
| frontend-lazy-loading-summary.md | Modal lazy loading |
| hub-sidebar-redesign-plan.md | Sidebar collapsible redesign |
| bundle-analysis-report.md | Bundle analysis |
| [call-center-page-source/](archive/call-center-page-source/) | Historical source of docs/call-center (pre-migration) |
| [call-center/](archive/call-center/) | Sync run artifacts (sync-from-erp-2026-02/), design assessments (backlog-rolls-into-today) |

---

## ⚡ System Quick Reference

```
MODULES:
  call-center   → CustomerServicePage.jsx + CallSessionContext + OrdersTable
  hub           → HubPage.jsx + ServiceModalViewer + ServiceActionsPage
  stock         → StockManagementPage.jsx + StockProducts/Parts/Movements
  bosta search  → BostaSearchResultScreen (BostaIdentityPanel + BostaContentPanel)

BACKEND ENTRY POINTS:
  app/api/erp_api.py              → ERP proxy (/sells/draft-dt)
  app/services/bosta_service.py   → Bosta API
  app/services/service_manager.py → ticket lifecycle
  app/api/service_api.py          → ticket HTTP handlers
  app/utils/db.py                 → MySQL connection

FRONTEND ENTRY POINTS:
  front/src/App.jsx                    → routing
  front/src/pages/                     → page components
  front/src/components/call-center/    → call center components
  front/src/components/modals/         → service modals
  front/src/api/callCenterAPI.js       → call center API calls
  front/src/styles/design-tokens.css   → token source of truth

KEY RULES (call center):
  ERP orders → service_type='sell' (NEVER NULL)
  ASK call → log only, no order, no ticket
  call_type (calls table) ≠ service_type (orders/tickets table)
  3+ no_answer → status unchanged; stays in queue until agent acts
```

---

## 📁 Other Docs (Outside docs/)

**Root:** [README.md](../README.md) (overview) · [SETUP_LOCAL.md](../SETUP_LOCAL.md) (local setup) · [RUN_WSGI.md](../RUN_WSGI.md) (port 5050) · [VALIDATION.md](../VALIDATION.md) (VENOM tests) · [CURSOR.md](../CURSOR.md) (VENOM in Cursor)

**app:** [app/README.md](../app/README.md) — backend layout, api/services/models/utils

**front:** [front/README.md](../front/README.md) · [front/src/README.md](../front/src/README.md) · [front/src/pages/README.md](../front/src/pages/README.md) · [front/src/styles/README.md](../front/src/styles/README.md) · [front/src/components/README.md](../front/src/components/README.md) · [front/src/components/service/BostaSearchResultScreen/BostaSearchResultScreen.md](../front/src/components/service/BostaSearchResultScreen/BostaSearchResultScreen.md)

**dev:** [dev/README.md](../dev/README.md) — session/collab protocol only; no doc authority. Canonical: docs/. Contents: CONTEXT.md, MANAGEMENT.md, TONE.md, START_PROMPT.md, _template/. call-center-page and one-offs: [docs/archive/](archive/).

**.cursor:** Not documented here (agent/IDE config).

---

*Version 3.0 | 2026-02-25 | Master brain map — one source of truth, VENOM-ready*
