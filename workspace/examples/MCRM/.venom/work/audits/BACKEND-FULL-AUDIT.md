# Backend Full Audit — venom-codebase + venom-eat + venom-audit

> Read-only. Zero edits. Full structural understanding.
> Date: 2026-03-11

---

## 1. venom-codebase — Architecture

### Pattern
**Layered monolith:** API → Services → Models → Utils. Blueprint-based routing. No async.

### Entry Points
| File | Role |
|------|------|
| `run.py` | Dev server, port 5050 |
| `wsgi.py` | Production (gunicorn) |
| `app/__init__.py` | create_app factory, CORS, blueprint registration, dist serving, ERP sync init |

### Blueprints (8)
| Blueprint | Prefix | Key routes |
|-----------|--------|------------|
| auth_api | /api/auth | login, register, users CRUD |
| customer_api | /api/customers | search, CRUD |
| hub_api | /api/hub | scan, scan/receive, scan/dispatch, queues |
| service_api | /api/tickets | create, confirm, cancel, actions, filter |
| stock_api | /api/stock | items CRUD, movements, export |
| bosta_api | /api/bosta | search, order, customer orders, sync |
| erp_api | /api/erp | drafts |
| call_center_api | /api/call-center | orders, calls, sync-from-erp, leader-approve |

---

## 2. Hot Nodes (Most Imported — High Risk)

| File | Import count | Risk |
|------|--------------|------|
| `app/utils/db.py` | 21+ | 🔴 **CRITICAL** — All data access. Change signature = break every model. |
| `app/utils/phone_normalizer.py` | 12+ | 🔴 **CRITICAL** — Bosta, ERP, customer search depend on format. |
| `app/services/service_manager.py` | 4 APIs | 🔴 **CRITICAL** — 1800+ lines, state machines, stock physics. |
| `app/utils/validators.py` | 8+ | 🟡 **HIGH** — Tracking, phone, condition validation. |
| `app/utils/messages.py` | 10+ | 🟡 **MEDIUM** — i18n strings. |
| `app/utils/responses.py` | 8 APIs | 🟡 **MEDIUM** — success_response, error_response. |
| `app/utils/pagination.py` | 4 APIs | 🟢 **LOW** — parse_pagination_params. |

### Models (import frequency)
| Model | Callers |
|-------|---------|
| service_ticket | service_api, hub_api, call_center_api, service_manager, tracking_manager |
| order | call_center_api, erp_sync_worker |
| customer | bosta_service, customer_api, service_manager, tracking_manager |
| stock | stock_api, stock_manager, service_manager |
| call | call_center_api |
| tracking | tracking_manager |
| bosta_order | bosta_service, service_ticket |

**service_manager** is the central hub — 4 APIs import it, 3 models, 2 services.

---

## 3. Data Flow

```
Request → Blueprint route → Service (service_manager, stock_manager, bosta_service, tracking_manager)
                         → Model (order, call, service_ticket, stock, customer, tracking, bosta_order)
                         → app/utils/db (execute_query, execute_insert, execute_update, transaction)
                         → PyMySQL
```

**No direct DB calls from API layer.** All go through models or services.

**Exceptions:** `call_center_api`, `service_api`, `stock_api` have `execute_query`/`execute_update` for specific queries.

---

## 4. venom-eat — What I Ate

### Constraints
- **DB host:** MUST be 127.0.0.1 (localhost = WinError 10054)
- **ERP SSL:** verify=False (self-signed cert)
- **Blocking I/O only:** No async/await
- **All DB via db.py:** No direct pymysql in models

### Capabilities
- Two-path order flow (ERP vs direct)
- Four state machines (R/M/T/S) with different stock physics
- Bosta integration (cache, search, sync)
- ERP sync (scheduled + manual)
- Leader approval workflow (confirmation_snapshot)
- Tracking number uniqueness

### Hot Paths
1. `call_center_api` → `service_manager` → order/call flows
2. `service_api` → `service_manager` → ticket creation, actions
3. `erp_sync_worker` → `order_model` + `call_center_api` helpers
4. `bosta_service` → `customer_api`, `call_center_api`, `service_ticket`

**service_manager.py** — 30+ execute_query/insert/update/transaction. Single point of state machine logic.

---

## 5. venom-audit — Blast Radius by Target

### app/utils/db.py
**Direct callers:** 21 files (all models, services, pagination, APIs, __init__)
**Risk:** 🔴 **CRITICAL**
**What breaks if you change signature:** Every model. Every service. Pagination.
**What breaks if you delete:** Entire backend. No data access.
**Safe to proceed?** No — only change with full caller update.

### app/utils/phone_normalizer.py
**Direct callers:** 12 files (models, services, APIs, validators)
**Risk:** 🔴 **CRITICAL**
**What breaks:** Bosta lookup, ERP sync, customer search, tracking validation.
**Safe to proceed?** No — format change = data corruption risk.

### app/services/service_manager.py
**Direct callers:** call_center_api, service_api, hub_api (4 API files)
**Transitive:** stock_manager, tracking_manager, models
**Risk:** 🔴 **CRITICAL**
**What breaks:** Order confirmation, ticket creation, state transitions, stock physics.
**Safe to proceed?** No — 1800+ lines, state machines. Incremental only.

### app/__init__.py (create_app)
**Direct callers:** run.py, wsgi.py
**Risk:** 🔴 **CRITICAL**
**What breaks:** Blueprint registration, CORS, dist serving, ERP sync init.
**Safe to proceed?** No — single entry point.

---

## 6. Orphans / Dead Code

| File | Status |
|------|--------|
| `app/utils/errors.py` | ❌ **Orphan** — Not imported by any file. Safe to delete or repurpose. |

---

## 7. Service Boundaries

| Service | Depends on | Used by |
|---------|------------|---------|
| service_manager | db, stock_manager, tracking_manager, models, validators, messages | call_center_api, service_api, hub_api |
| stock_manager | db, stock model, messages | service_api, stock_api, service_manager |
| tracking_manager | db, tracking, ticket, customer models | service_api, hub_api, service_manager |
| bosta_service | db, bosta_order, customer, bosta_converter, phone_normalizer | bosta_api, customer_api, call_center_api, service_ticket |

---

## 8. Recommended Next Step (No Changes)

**For refactor:** Start with `app/utils/errors.py` — orphan, zero impact.
**For architecture change:** Run venom-audit on the specific target before touching.
**For new feature:** Add new blueprint + service; avoid modifying service_manager unless necessary.

---

## Summary

| Layer | Files | Risk |
|-------|-------|------|
| Entry | __init__.py, run.py, wsgi.py | 🔴 |
| Utils | db, phone_normalizer, validators | 🔴 |
| Services | service_manager | 🔴 |
| Models | All 8 | 🟡 |
| APIs | 8 blueprints | 🟡 |

**Backend is coherent.** All data flows through db.py. No direct DB calls. service_manager is the central nervous system. One orphan (errors.py).
