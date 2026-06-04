# Memory

Cross-session truth. Decisions, patterns, corrections extracted from deep absorption.
VENOM reads this before answering on topics that reference past work.

---

## Decisions

> Architectural choices. Why. What they enable/constrain.

[2026-04-07] **INK crew (INDEX + ten minds) canonical in `.venom/ink/`** — HELM, HUNT, EDGE, WELD, MEND, DART, ECHO, OMEN, CALL, MOLT; load order in `INDEX.ink`. Cursor binding: `.cursor/rules/venom-crew.mdc` (always on). **Synced same day:** all 11 `.ink` files copied from `c:\Users\karie\Downloads\files (1)\` over repo (overwrite); repo is source of truth until the next deliberate edit.

[2026-04-13] **No MySQL / SQL in current environment.** Do not assume a running DB: backend routes that use `app/utils/db.py` will fail until MySQL is up, `DATABASE_*` is set (use `127.0.0.1`, never `localhost` — see 2026-03-08), and `migrations/run_migrations.py` has been applied. UI-only work is fine; any feature touching persistence needs DB first.

[2026-03-08] **Database host MUST be 127.0.0.1, never localhost.** Reason: Windows + MySQL 8.0 + PyMySQL has WinError 10054 / 2013 with 'localhost'. Solution: Force `127.0.0.1` in `app/config.py::_DB_DEFAULTS`, `app/utils/db.py::get_db()`, `migrations/run_migrations.py::_load_config()`. Impact: Every DB connection. Breaking this = random connection failures.

[2026-03-08] **ERP auth MUST disable SSL warnings and use verify=False.** Reason: ERP (erp.hvarstore.com) uses self-signed certificate. Solution: `urllib3.disable_warnings(InsecureRequestWarning)`, `requests.get(..., verify=False)` in `app/api/erp_api.py::ERPAuth`. Impact: ERP sync and draft fetching. Security trade-off accepted for internal network.

[2026-03-08] **Bosta phone lookup requires 01XXXXXXXXX normalization.** Reason: Bosta API expects Egyptian local format. ERP sends +201, 201, 01 mixed. Solution: `app/utils/phone_normalizer.py::normalize_to_local_phone()` with 6 format handlers. Used in: Bosta search, customer upsert, order creation, call context. Breaking this = no Bosta data enrichment.

[2026-03-08] **Stock reservations use ID-based commit/cancel, not inline params.** Reason: Prevents double-commit. Reserve returns `reservation_id` (stock_movements.id), commit/cancel take that ID and check if already actioned. Pattern: `reserve_stock()` → `commit_reservation(reservation_id)` / `cancel_reservation(reservation_id)`. Impact: All four state machines. See `app/services/stock_manager.py`.

[2026-03-08] **Products can have negative stock (backorders), parts cannot.** Reason: Business rule — products ship on promise, parts require physical availability. Validation: `stock_manager.py::reserve_stock()` line 26-29 checks `item_type == 'part'` and raises if insufficient. Products skip check. Impact: Replacement tickets can create with negative product stock, maintenance cannot reserve missing parts.

[2026-03-08] **Leader workflow uses confirmation_snapshot, not live order data.** Reason: Order may change between agent confirm and leader approval. Snapshot captures state at confirmation time. Pattern: `update_order_confirmation()` writes `confirmation_snapshot` JSON → `leader_approve()` reads it → ticket created from snapshot. Impact: All service ticket creation. See `app/api/call_center_api.py::update_order_confirmation()`.

[2026-03-08] **Tracking numbers have global uniqueness, enforced at validation layer.** Reason: Bosta uses tracking as primary key. Reuse = data corruption. Solution: `app/utils/validators.py::validate_tracking_numbers()` calls `app/models/tracking.py::check_tracking_not_used()` which queries both `service_tickets` and `orders.bosta_tracking`. Used in: Ticket creation, order updates. Breaking this = duplicate Bosta lookups, wrong enrichment.

[2026-03-08] **React does NOT import React in new files (React 18 JSX transform).** Reason: Vite + React 18 auto-import JSX. Old files still have `import React from 'react'` (legacy). New files: omit. See `front/vite.config.js::react()` plugin. Impact: All new components.

[2026-03-08] **Terser strips console.log/debugger in production builds.** Config: `front/vite.config.js::terser()` with `drop: ['console', 'debugger']`. Dev logs safe. Production: stripped. BUT: 50+ files still have console statements (grep found). Not a runtime risk, but dev noise.

[2026-03-08] **ERP session auth uses CSRF token extraction + auto-retry on 401/403.** Pattern: `ERPAuth::login()` scrapes login page for `_token` → POST with credentials → Store session cookies → `fetch_with_auth()` adds `X-CSRF-TOKEN` header → If 401/403, force re-login once → Retry. Session timeout: 1 hour. Impact: All ERP API calls. See `app/api/erp_api.py::ERPAuth`.

[2026-03-08] **Sell tickets do NOT reserve stock — products ship from ERP directly.** Reason: ERP owns sell inventory, Hub MCRM only tracks status. Service tickets (R/M/T) require Hub stock because items physically pass through Hub. Sell orders: `service_type='sell'` → No reserve/commit calls. Impact: `service_manager.py::confirm_sell()` has no stock logic. If this changes, entire sell workflow breaks.

[2026-03-09] **"run" / "run both" means start frontend AND backend.** When user says "run" or "run both", always start both servers: backend (`python run.py` → port 5050) and frontend (`cd front && npm run dev` → port 5173). Both run in background. Context: Development workflow command.

[2026-03-11] **API routes MUST have strict_slashes=False to avoid CORS preflight failure.** Root cause: Flask redirects `/api/tickets` → `/api/tickets/` (301). CORS preflight (OPTIONS) cannot follow redirects → "Redirect is not allowed for a preflight request". Root fix: In `app/__init__.py` after blueprint registration, iterate `app.url_map.iter_rules()` and set `rule.strict_slashes = False` for all rules starting with `/api/`. One place, all API routes. Never patch per-route.

[2026-03-14] **User requested deep persistence of VENOM command contract and current full-repo audit into `.venom`.** Canonical saved artifacts:
- `.venom/work/audits/VENOM-COMMAND-CONTRACT-2026-03-14.md`
- `.venom/work/audits/FULL-REPO-REVIEW-2026-03-14.md`
Use these as restart anchors for future `/venom` sessions.

---

## Patterns

> Conventions, invisible architecture, how the system thinks.

**Phone normalization is canonical.** Every phone must pass through `normalize_to_local_phone()` before: Bosta search, customer upsert, order creation, call context enrichment. Format: `01XXXXXXXXX` (11 digits, starts with 01). Source accepts: +201, 201, 01, 1X (10 digits), 9 digits. Regex check: `^01[0-9]{9}$`. Used in: `bosta_service.py`, `call.py::create_call()`, `customer.py::upsert()`, `order.py::create_order()`. Failure mode: Bosta returns empty, customer search fails, enrichment breaks.

**Error handling: try/log/respond.** Backend pattern: `try: ... except Exception as e: logger.error(...); return error_response(str(e), 500)`. Frontend: `try: ... catch (error) { toast.error(error.message); }`. NEVER `alert()`. Always `react-hot-toast`. See `app/utils/responses.py` (`success_response`, `error_response`), `front/src/utils/toast.js` wrappers.

**DB access: ONLY through app/utils/db.py.** Never direct PyMySQL calls in routes/models. Use: `execute_query(sql, params, json_fields=[])` for SELECT, `execute_insert(sql, params)` for INSERT (returns lastrowid), `execute_update(sql, params)` for UPDATE/DELETE (returns rowcount), `transaction()` context manager for multi-step. Connection pooling: Flask `g` object stores connection, `get_db()` checks `ping(reconnect=True)`. Autocommit: True by default, False in transaction block.

**State machine validation is mandatory.** Every status transition MUST pass `validators.py::validate_status_transition(service_type, current_status, new_status)`. Allowed transitions defined per service type. Example: Replacement `pending` → `agent_confirmed` ✓, `pending` → `in_progress` ✗. Enforcement: `service_manager.py` checks before every action. Bypass = corruption.

**React hooks: useState + useEffect, no Redux/Zustand.** Global state: Context API only (Auth, Theme, CallSession). Local state: useState. Side effects: useEffect. Data fetching: manual fetch in useEffect or custom hooks (e.g., `useTicketsList`, `useServiceCreation`). No state management library. Pattern: Context at App.jsx, useContext in components.

**Design tokens: CSS custom properties → Tailwind.** Source: `front/src/styles/design-tokens.css` defines `--brand-*` variables. Mirror: `front/tailwind.config.js` extends with `colors: { 'brand-red': 'rgb(var(--brand-red) / <alpha-value>)', ... }`. Usage: `className="text-brand-red bg-brand-gray-50"`. Never hardcode hex colors. Duplication intentional (CSS for runtime, Tailwind for build).

**Bosta cache is stale-while-revalidate.** `bosta_orders_cache` table stores `tracking_number` → `order_data` JSON → `last_synced` timestamp. `fetch_order_data(tracking, force_sync=False)`: If `!force_sync` → Check cache → Return if exists. If `force_sync` or miss → Fetch API → Upsert cache → Return. Frontend can pass `?force_sync=1` to bypass. Cache never expires automatically (no TTL cron).

**Confirmation snapshot is append-only truth.** Once `confirmation_snapshot` written, order can change but snapshot doesn't. Leader approval reads snapshot, not current order row. Pattern: Agent confirms → Write snapshot → Status=confirmed → Leader views snapshot in approval UI → Leader approves → Ticket created from snapshot → Status=converted. If order changes during "confirmed" status, changes ignored. Snapshot is materialized at approval time only.

**CallSessionContext survives all navigations.** Global call session state rendered at `App.jsx` root (outside Router). `CallSessionFAB` follows user across pages. Session ends only when: Agent clicks X, completes action (confirm/cancel/schedule/no-answer), or navigates away from call-center domain. Used in: `CustomerServicePage::startCallSession()`, `CallSessionFAB::render()`, `OrdersTable::call button`.

**Bundle splitting: domain-based chunks.** Vite config splits: `call-center` (OrdersTable, CallSessionPage, CallHistoryModal), `hub` (ServiceActionsPage, HubScanModal), `service-modals` (all modal components), `stock` (StockProducts, StockParts, StockMovements), `vendor-ui` (react-router, framer-motion, leaflet). Reason: Pages are rarely visited together. Load on demand. See `front/vite.config.js::manualChunks`.

**Daily ticket numbering: atomic counter.** Format: `{type_prefix}{YYYYMMDD}{NN}`. Example: `R2026030812` = Replacement, March 8 2026, 12th ticket. Counter resets daily. Generated by: `service_ticket.py::generate_ticket_id()` → Find max ticket_id for today → Extract sequence → Increment. Race condition risk: Two tickets created simultaneously = duplicate ID. Mitigation: DB unique constraint on `ticket_id`. If duplicate → Retry with +1.

**Maintenance has invisible internal state.** Maintenance status progression: `pending` → `agent_confirmed` → `leader_confirmed` → `in_progress` → `completed`. BUT: `in_progress` has sub-states tracked by counting status_history transitions from `in_progress` to `in_progress`. 0 transitions = "awaiting start", 1 = "work in progress", 2 = "ready to ship". Reason: Don't want 3 separate statuses. Use one status with internal counter. See `service_manager.py::_calculate_actions_for_ticket()` lines 323-357.

[2026-03-08] **State machines have different physics.** Four workflows (R/M/T/S) with different valid transitions. Replacement = full cycle (send/return/validate). Maintenance = no RETURNED state (direct complete). Return = no dispatch (receive/validate/done). Sell = optional RETURNED. Each has different stock operations. Context: service_manager.py _validate_state_transition, valid_transitions dict lines 256-292.

[2026-03-08] **Phone normalization is canonical.** Store everything as `01XXXXXXXXX`. Bosta sends `+201`, ERP sends `201`, customers say `1XXXXXXXXX`. `normalize_phone_safe()` before storage. Validation accepts any format, normalizes, then validates Egyptian patterns. Context: phone_normalizer.py, validators.py validate_phone_number, all models that touch phone.

[2026-03-08] **console.log is production noise.** Vite terser config: `drop_console: true`, `pure_funcs` removes all console methods except error. 57 files still have console.log. Not removed yet. Build strips them. Dev mode sees them. Context: vite.config.js terserOptions line 73-77, grep shows 57 files with console statements.

[2026-03-08] **TODOs and FIXMEs as debt markers.** 16 files contain TODO/FIXME/HACK/XXX. Not dead code — active debt markers. Examples: CallSessionFAB (TODO for direct call improvements), service_manager.py (FIXME for edge cases). Context: Grep pattern=TODO|FIXME found in service_manager.py, validators.py, CallSessionFAB.jsx, ServiceActionsPage.jsx, and 12 others.

[2026-03-08] **Bundle splitting by domain.** Vite manual chunks: call-center, hub, service-modals, service-actions, stock. Heavy libs isolated: exceljs, scanner (qr-scanner), maps (leaflet), charts (recharts). Reason: Pages load faster. Call center code only loads when visiting /customer-service. Context: vite.config.js manualChunks lines 88-146. Target: <1000kb chunks.

[2026-03-08] **Design tokens duplication — necessary evil.** `design-tokens.css` = source of truth. `tailwind.config.js` duplicates values for Tailwind utilities. Must sync manually. Reason: Tailwind requires static values at build time. CSS variables work at runtime. Need both. Context: tailwind.config.js header comment lines 4-15, design-tokens.css, both must match.

[2026-03-08] **React hooks everywhere — 77+ files.** useState/useEffect/useMemo/useCallback used in 77 frontend files. Heavy hook usage in: CallSessionFAB (55 uses), ServiceActionsPage (19), ServiceCard (11), useServiceCreation (32). Context: Grep count shows deep React patterns, complex state management in modals/pages.

[2026-03-08] **Exceptions as control flow — 12 backend files.** 12 Python files use `class XException` or `raise XError`. Custom exceptions: ServiceManagerException, BostaException, NotFoundError, ValidationError, DatabaseError, BusinessLogicError, ExternalServiceError, AuthorizationError. Context: Grep count, errors.py defines hierarchy, service_manager.py and bosta_service.py are heavy users.

---

## Architecture Debt & Gaps

> Known fragility. What's broken. Where bodies are buried.

[2026-03-08] **Lock/unlock is in-memory mock.** Two agents can open same order simultaneously. No conflict detection. No "locked by X" warning. Mock implementation in callCenterAPI.js. Gap documented in GAPS-AND-TRANSFORMATION.md. Fix: add `locked_by`, `locked_at` to orders table, real endpoints. Severity: HIGH (data integrity risk). Context: callCenterAPI.js lockOrder/unlockOrder, GAPS doc section 3.

[2026-03-08] **Customer 360° missing tickets.** `getOrderCallContext` returns Bosta orders, returns `services: []` (empty). Agent sees "what shipped" but not "what we repaired". No ticket history by customer. Gap documented. Fix: fetch tickets by customer_phone or customer_id, add to context. Severity: MEDIUM (agent context incomplete). Context: callCenterAPI.js getOrderCallContext, GAPS doc section 2.6.

[2026-03-08] **ERP order dedup missing.** Sync can create duplicate orders. No unique index on `erp_order_id`. Existing code checks `get_order_by_erp_order_id` before insert but race condition possible. Gap documented. Fix: unique index or INSERT...ON DUPLICATE KEY UPDATE. Severity: HIGH (data integrity). Context: order_model.py create_order, call_center_api.py sync_from_erp, GAPS doc section 4.

[2026-03-08] **Debugger statement in vite.config.js.** Production build config has `debugger` statement. Build works (terser strips it) but shouldn't exist. Context: Grep found debugger in vite.config.js. Remove it.

[2026-03-08] **No CI/CD pipeline.** Tests exist (pytest, vitest). No CI running them. No automated deployment. Manual deploys. Context: 2 test files in front/tests/, pytest in requirements.txt, no .github/workflows/, no .gitlab-ci.yml.

[2026-03-08] **Schema migration is manual.** One SQL file: `001_initial_schema.sql`. No automated migration runner visible. `run_migrations.py` mentioned in docs. No version tracking. Context: migrations/ folder has 1 SQL file, README mentions run_migrations.py, no alembic/flyway/liquibase.

[2026-05-07] **Production ERP ↔ call-center verification: curl runbook + `/sync-status` caveat.** **What:** On `https://mcrm.hvarstore.com`, confirm integration with: `GET /api/health`, `GET /api/call-center/health`, `GET /api/call-center/orders/counts`, `GET /api/call-center/orders?status=new&source=erp&all_dates=true&per_page=10&page=1`, `GET /api/call-center/calls?call_type=ask&limit=5`. Optional: `POST /api/call-center/orders/sync-from-erp` with `{}` (server uses `ERP_DEFAULT_*` env) or `{"force":true,"start_date":"…","end_date":"…"}` if blocked by `already_running`. **Why:** `GET /api/call-center/sync-status` is unreliable behind multiple workers — in-memory job state per process → `running: true`, `total: 0`, or churning `job_id`; DB queue totals are the source of truth. **Effect:** For “is sync live?” / stuck-sync incidents, always quote `orders` + `counts`; treat `sync-status` as diagnostic noise unless job store is centralized.

---

## What Never to Touch Without Blast Radius Check

> Hot wires. Change = cascade.

- **`app/utils/db.py`** — All data access goes through execute_query/execute_insert/execute_update/transaction. Change signature = break every model.
- **`app/utils/phone_normalizer.py`** — Phone normalization is canonical. Change format = break Bosta lookup, customer search, ERP sync, ticket creation.
- **`front/src/styles/design-tokens.css`** — Source of truth for design system. Change token = update tailwind.config.js + verify 100+ files.
- **`app/services/service_manager.py`** — 1800+ lines. State machines, stock physics, validations. Change = test all four workflows (R/M/T/S).
- **`front/src/contexts/CallSessionContext.jsx`** — Global call session state. CallSessionFAB depends on it. Change = test call-center page + FAB + navigation.
- **`app/__init__.py` create_app** — Flask app factory. Blueprint registration, CORS, dist/ serving. Change = break routing or frontend serving.
- **`confirmation_snapshot` in orders** — JSON field. Leader-approve reads it. Change structure = break leader workflow.
- **Tracking number uniqueness checks** — `_check_original_tracking_not_used`, `_check_new_tracking_not_used`. Remove = duplicate tracking numbers = Bosta confusion.

---

*When full: keep hardest problems, archive obvious patterns. Max 250 lines.*
