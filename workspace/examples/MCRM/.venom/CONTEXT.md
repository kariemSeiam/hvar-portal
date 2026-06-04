# Project Context — HUB-MCRM

> **Project:** Hvar Service CRM — Arabic-first, RTL-by-default multi-channel call center + service hub.
> **Owner:** Kariem (@kariem) — Egyptian, compression engine thinker, code-as-proof, no shell.
> **VENOM initialized:** 2026-03-08 (ultra-deep eat) · **venom-init re-run:** 2026-03-14 (anatomy verified, CONTEXT merged) · **2026-04-13** (venom-init: root scan, manifests, `mcp-servers/` — merged below)

---

## Project (venom-init merge — 2026-04-13)

- **Name:** HUB-MCRM (frontend npm package: `hvar-hub` @ 1.0.1 in `front/package.json`)
- **Type:** Monorepo — Flask API + React/Vite SPA + MySQL 8.0; optional MCP server (`mcp-servers/hub-mcrm-api/`, TypeScript + `@modelcontextprotocol/sdk`)
- **Stack:** Python 3.8+ · pinned in `requirements.txt`: Flask 3.0.0, flask-cors 4.0.0, PyMySQL 1.1.0, requests 2.31.0, pytest 8.4.2, openpyxl 3.1.2 · React 18.3 / Vite 6.x / Tailwind 3.4 (`front/package.json`)
- **Structure:** No repo-root `package.json` · `app/` Flask · `front/` Vite app (`outDir` → repo `dist/`) · `migrations/` · `docs/` · `mcp-servers/hub-mcrm-api/` · **no `STRUCTURE.md` at repo root** (map = this file + `docs/INDEX.md`)
- **Entry points:** `python run.py` (Flask) · `front`: `npm run dev` (port 5173; `/api` proxy only if `VITE_APP_API_URL_DEV` set in `front/.env`) · `front/src/main.jsx` → `App.jsx`
- **VENOM initialized:** 2026-03-08 · **Last venom-init pass:** 2026-04-13

## Conventions (snapshot)

- **Commits:** `feat(scope):` / `fix(scope):` / `docs:` — lowercase, no trailing period
- **Backend:** sync I/O, `app/utils/db.py` for all DB access, blueprints under `app/api/`
- **Frontend:** Context (Auth, Theme, CallSession), `@/` → `front/src/`, RTL-first tokens in `front/src/styles/design-tokens.css`

---

## Identity

**Name:** HUB-MCRM  
**Type:** Monorepo — Python Flask API + React Vite SPA + MySQL 8.0  
**Domain:** Service logistics for Egyptian e-commerce (Hvar)  
**Language:** Arabic UI, English code, Egyptian dialect warmth  
**Architecture:** Two-path reconciliation layer — ERP sends "sell" drafts (Path A), direct calls are ambiguous (Path B). Both converge at `confirmed` → Leader approves → Ticket created. Call center IS the reconciliation layer.

---

## Stack

**Backend:** Python 3.8+, Flask 3.0 (pinned), PyMySQL 1.1, requests 2.31 (pinned), python-dotenv  
**Frontend:** React 18, Vite 6, TailwindCSS 3.4, Framer Motion 11, Lucide React 0.460, react-hot-toast 2.4, Leaflet 1.9, ExcelJS 4.4  
**Database:** MySQL 8.0 (127.0.0.1 canonical, never localhost)  
**Integrations:** Bosta Shipping API (v2), ERP (erp.hvarstore.com), QR scanning, PWA, Service Worker  
**Dev Tools:** Pytest, Vitest, Git, PowerShell (Windows C:/)

---

## Entry Points

**Backend:**  
- `python run.py` — Canonical launcher (port 5050); `app/__init__.py` create_app  
- `app/__init__.py` — create_app factory, CORS, Blueprints  
- `app/api/*.py` — 7 blueprints: call_center_api, service_api, stock_api, hub_api, bosta_api, erp_api, customer_api  
- `app/config.py` — Config classes, DB defaults, Bosta token

**Frontend:**  
- `npm run dev` — Vite dev server (proxies /api/* to localhost:8000)  
- `front/src/App.jsx` — React Router, global contexts (Auth, Theme, CallSession), CallSessionFAB  
- `front/src/main.jsx` — Entry, service worker registration

**Database:**  
- `migrations/run_migrations.py` — CLI migration runner (status, up, down, reset)  
- `migrations/001_initial_schema.sql` — Tables: orders, calls, service_tickets, stock_items, stock_movements, customers, users, bosta_orders_cache, tracking_numbers

---

## Two-Path Architecture (Invisible Core)

**PATH A — ERP Classified:**  
ERP → `/api/erp/sync` → `orders` table, `service_type='sell'`, `status='new'` → Agent sees "بيع - يحتاج تأكيد" → Call → Confirm → `status='confirmed'` → Leader approves → `confirmation_snapshot` materializes → Ticket created.

**PATH B — Direct Ambiguous:**  
Agent → Bosta search by phone → Direct call, `call_type='ask'` → Draft created, `service_type=NULL` → Agent reclassifies → Confirm → Leader approves → Ticket.

Both paths:
- Require phone normalization (`01XXXXXXXXX` canonical)
- Bosta enrichment (cached in `bosta_orders_cache`)
- Leader workflow (`confirmation_snapshot` in orders.confirmation_snapshot JSON)
- Ticket creation in `service_tickets` with tracking numbers

**The Hard Truth:** System can't know an order is wrong until customer speaks. Model lags reality. Call center is reconciliation layer.

---

## Four State Machines (Service Types)

Each service type has different physics:

### Replacement (R)
- States: pending → agent_confirmed → leader_confirmed → in_progress → completed / cancelled
- Stock: Reserve on confirm → Commit on complete, products can go negative (backorders)
- Tracking: original_tracking (from customer), new_tracking_send (to customer)

### Maintenance (M)
- States: pending → agent_confirmed → leader_confirmed → in_progress → completed / cancelled
- Stock: No stock impact (internal repair), parts reserved only if needed
- Tracking: original_tracking (receive from customer), new_tracking_receive (return to customer)
- **Internal sub-state:** technician_notes, diagnosis, repair_completed (not exposed as status yet)

### Return (T)
- States: pending → agent_confirmed → leader_confirmed → in_progress → returned / cancelled
- Stock: Return increments quantity_on_hand (valid) or quantity_damaged (damaged)
- Tracking: original_tracking (receive back)

### Sell (S)
- States: new → scheduled → confirmed → completed / cancelled
- Stock: NO reservation (products ship from ERP directly)
- Tracking: bosta_tracking (from ERP sync or manual entry)

**Critical:** Changing service_type between R/M/T/S requires canceling existing reservations and re-applying new physics.

---

## Invisible Architecture (What Code Doesn't Say)

### Confirmation Snapshot Pattern
- When leader approves, `confirmation_snapshot` JSON in orders table captures:
  - `customer`: { name, phone, secondPhone, address }
  - `items`: [ { sku, name, quantity, condition } ]
  - `cod_amount`, `governorate`, `city`, `delivery_address`, `notes`
  - `bosta_orders`: [ full Bosta order objects at approval time ]
- This is the **materialized source of truth** for ticket creation. Changes to order after confirmation don't affect ticket unless re-confirmed.
- Pattern used in: `app/api/call_center_api.py::update_order_confirmation()`, `app/api/service_api.py::create_service_ticket()`

### Three Tracking Numbers (Uniqueness Enforced)
- `original_tracking` — Customer's existing Bosta order (for R/M/T)
- `new_tracking_send` — New order TO customer (for R)
- `new_tracking_receive` — Return shipment FROM customer (for M)
- **Uniqueness:** Each tracking number can only be used once across the entire system.
- Checked by: `app/utils/validators.py::validate_tracking_numbers()`, `app/models/tracking.py::check_tracking_not_used()`

### Backlog Roll-Forward (Fragile)
- Daily ticket numbering: `{service_type_prefix}{YYYYMMDD}{NN}` (e.g., R2026030801)
- Backlog (yesterday's unresolved tickets) should auto-roll to today's queue.
- **Current state:** Manual intervention required. No cron job yet.
- **Risk:** Tickets stuck in limbo if not manually moved.

### Lock Gap (Mocked)
- Multi-agent concurrency: `locked_by`, `locked_at` fields exist in orders table.
- **Current state:** Lock/unlock endpoints mocked (always success). Real locking NOT implemented.
- **Risk:** Two agents can edit same order simultaneously → data race.

### Customer 360° Gap (Services Missing)
- `getOrderCallContext` enriches call with Bosta orders.
- **Missing:** Service tickets by phone. Agent can't see customer's past service history during call.
- **Impact:** No proactive "last time you had a maintenance ticket" context.

### ERP Dedup Gap (None)
- ERP sync (`/api/erp/sync`) inserts orders without checking `erp_order_id` uniqueness.
- **Risk:** Duplicate orders if ERP sends same draft twice.
- **Solution:** Unique index on `erp_order_id` or INSERT...ON DUPLICATE KEY UPDATE.

### order_description Column (Empty)
- `orders` table has `order_description` column, always NULL.
- ERP provides `shipping_details` (text like "1 * كبه هفار 2000 وات...") — not stored in orders.
- **Impact:** Order items visible only in ERP raw response or confirmation_snapshot, not queryable.

---

## Hot Wires (Never Touch Without Blast Radius)

- `app/utils/db.py` — All data access. Change signature = break every model.
- `app/utils/phone_normalizer.py` — Canonical phone format. Change = break Bosta, ERP, customer search.
- `front/src/styles/design-tokens.css` — Design system source of truth. Change = update tailwind.config.js + verify 100+ files.
- `app/services/service_manager.py` — 1800+ lines. State machines, stock physics. Change = test all four workflows.
- `front/src/contexts/CallSessionContext.jsx` — Global call session. CallSessionFAB depends on it.
- `app/__init__.py::create_app` — Blueprint registration, CORS, dist/ serving. Change = break routing.
- `confirmation_snapshot` in orders — Leader workflow reads it. Change structure = break approval.
- Tracking number uniqueness checks — Remove = duplicate tracking = Bosta confusion.

---

## Conventions (Camouflage DNA)

**Commit Style:** `feat(domain): description` / `fix(domain): description` / `docs: description`  
**Language:** UI labels Arabic, code English, comments bilingual for domain logic, Egyptian dialect for warmth  
**Backend:**  
- Error handling: `try/except`, log error, return `error_response(message, 500)`  
- DB access: ALL through `app/utils/db.py` (execute_query, execute_insert, execute_update, transaction context manager)  
- API structure: Blueprint → route → model call → success_response/error_response  
- Async: None. Blocking I/O (requests, PyMySQL). No async/await.

**Frontend:**  
- State: React Context API (Auth, Theme, CallSession), useState/useEffect. NO Redux/Zustand.  
- Components: Domain folders (`front/src/components/{domain}/`), PascalCase files, export default.  
- Naming: camelCase (vars, functions), PascalCase (components, types), kebab-case (CSS classes).  
- Imports: React not imported (React 18 JSX transform), Vite alias `@/` = `front/src/`.

**Design System:**  
- Tokens: `front/src/styles/design-tokens.css` (source) + `front/tailwind.config.js` (Tailwind layer).  
- Colors: `--brand-red`, `--brand-blue`, `--brand-gray-*`, `--brand-success`, `--brand-warning`, `--brand-error`.  
- Typography: Cairo (Arabic), Tajawal (Arabic secondary), Inter (English), JetBrains Mono (code).  
- RTL-first: `dir="rtl"` on <html>, RTL utilities in Tailwind, logical properties preferred.

**Core Architecture:**  
- `two_paths`: ERP vs Direct, converge at confirmed.  
- `state_machines`: R/M/T/S with distinct stock physics and status flows.  
- `stock_physics`: Products can go negative (backorders), parts must have stock. Reserve → Commit pattern.  
- `data_flow`: Bosta API → bosta_orders_cache → orders enrichment → confirmation_snapshot → service_tickets.

**Docs Structure:**  
- `docs/` — Canonical documentation (INDEX.md = brain map).  
- `dev/` — Historical, source material, planning scraps.  
- `.venom/` — VENOM's memory (CONTEXT, MEMORY, learnings, work).

---

## What You're Watching For

- **Stock reservations orphaned:** Reservation created but never committed/cancelled → quantity_reserved stuck.
- **Phone normalization failures:** Any phone not `01XXXXXXXXX` = Bosta lookup fails.
- **Tracking number reuse:** Same tracking in multiple tickets = Bosta data corruption.
- **Confirmation snapshot drift:** Order changed after confirmation but snapshot not updated = ticket uses stale data.
- **Lock gap exploitation:** Two agents editing same order → last write wins, data loss.
- **ERP duplicates:** Same `erp_order_id` inserted twice = double work.
- **Backlog amnesia:** Yesterday's tickets not rolled forward = customer calls again, frustrated.
- **console.log in production:** 50+ files still have console statements. Terser strips in build, but dev logs pollute.
- **Maintenance internal state invisible:** `technician_notes`, `diagnosis` stored but not surfaced in status flow.
- **Customer 360° blind:** Agent can't see service history during call = missed upsell/context.

---

## Hardest Unsolved Problem

**The system can't know when reality diverges from the model until a human speaks.**

ERP says "sell order, ship to X". Bosta says "delivered". Customer calls: "I got the wrong item" / "never arrived" / "broken".

The model was confident. Reality was different. The call center is where the two sync.

Every other system assumes the model is correct. This one knows it's a reconciliation layer.

---

## Identity

- **Owner:** Kariem Seiam (Pigo). Cairo, Egypt. INTP-T. Arabic (Egyptian dialect) + English (tech). 25. Builder. Engaged — wedding in 6-7 months.
- **Project:** HUB-MCRM. Service CRM for Hvar: call center (ERP + Bosta integration), hub workflows (replacement/maintenance/return/sell), stock management, customer 360°.
- **Domain:** E-commerce operations. 2000+ orders. Running business. Arabic-first, RTL by default.

## Stack

- **Frontend:** React 18, Vite 6, TailwindCSS (RTL Arabic-first), Framer Motion, Lucide React, react-hot-toast
- **Backend:** Flask 3 (Python 3.8+), PyMySQL
- **Database:** MySQL 8.0 (`mcrm_hvar_hub`)
- **Key tools:** Bosta Shipping API, ERP integration (erp.hvarstore.com), QR scanning, PWA, Leaflet maps, ExcelJS

## Structure

```
app/               → Flask backend (api/, services/, models/, utils/)
front/src/         → React app (pages/, components/, api/, contexts/, utils/)
  ├─ pages/        → CustomerServicePage, HubPage, StockManagementPage, LoginPage
  ├─ components/   → call-center/, modals/, service/, stock/, hub/, ui/, layout/
  └─ contexts/     → AuthContext, ThemeContext, CallSessionContext
docs/              → Canonical docs (INDEX.md → call-center/, hub/, system/, design/, reviews/, plans/)
migrations/        → SQL schema + run_migrations.py
dist/              → Production build (Flask serves from here)
.venom/            → VENOM workspace (CONTEXT, memory, learnings, work)
.cursor/           → VENOM stack (rules/, systems/, identity/, skills/)
```

## Current Focus

> Update this every time the active work changes.

**What's being built:** (set on next task — replace this line)
**Last venom-init:** 2026-04-13 — root anatomy, `requirements.txt` + `front/package.json` + `mcp-servers/hub-mcrm-api/package.json` verified; CONTEXT merged, not replaced
**Key constraint:** Match existing patterns exactly. Camouflage DNA unchanged.

## Conventions

- **Commit style:** `type(scope): description` — feat, fix, refactor, style, docs, test, chore. Lowercase. No period. E.g. `feat(bosta-search): add draft ticket card`
- **RTL-first:** `dir="rtl"` by default. Arabic everywhere. English for technical terms only.
- **Component naming:** PascalCase. `ServiceModalViewer.jsx`, `CallSessionPage.jsx`
- **Async patterns:** `async/await` everywhere. No `.then()`. Error handling via `try/catch`, toast for user feedback.
- **State management:** Context API (Auth, Theme, CallSession). Local state via `useState`. No Redux.
- **Error handling:** Flask → `success_response()` / `error_response()` from `app/utils/responses.py`. Frontend → toast notifications.
- **API structure:** Blueprint-based. `/api/call-center`, `/api/service`, `/api/stock`, `/api/hub`, `/api/bosta`, `/api/erp`.
- **DB access:** PyMySQL via `app/utils/db.py` (`execute_query`, `execute_insert`, `execute_update`, `transaction`).
- **Design tokens:** `.cursor/rules/hub-design.mdc` + `front/src/styles/design-tokens.css` — `--color-brand-red-600` (#e11d48), `--color-brand-blue-600` (#0284c7), Cairo + Tajawal fonts.

## Navigation

> Where to go for what. Fill if project has a docs/ system.

| Need | Go to |
|------|-------|
| Master brain map | `docs/INDEX.md` |
| Call center (full) | `docs/call-center/` (INDEX.md, 00-NEW-VISION.md, workflow.md, call-session-cycle.md, calls-model.md, API_ENDPOINTS.md) |
| Hub workflows | `docs/hub/` (service_tickets.md, replacement_workflow.md, maintenance_workflow.md, return_workflow.md) |
| Stock system | `docs/system/stock.md` |
| Customer data | `docs/system/customer.md` |
| API reference | `docs/system/api_endpoints.md`, `docs/system/tickets_api_filters.md`, `docs/call-center/API_ENDPOINTS.md` |
| Design system | `.cursor/rules/hub-design.mdc`, `docs/design/design.md`, `front/src/styles/design-tokens.css` |
| Local setup | `SETUP_LOCAL.md` |
| Quick start | `README.md` |
| VENOM config | `CURSOR.md`, `.cursorrules`, `.cursor/rules/venom-heart.mdc` |
| Kariem's context | `.cursor/identity/kariem.mdc` |
| Active work | `.venom/work/ACTIVE.md` |
| Work index | `.venom/work/INDEX.md` |

---

*Keep this under 80 lines. If it grows longer, split navigation to `.venom/work/ACTIVE.md`.*
