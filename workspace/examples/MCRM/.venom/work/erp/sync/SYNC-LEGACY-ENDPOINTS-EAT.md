# Sync, Legacy, Endpoints — Full EAT

> Absorbed: call center sync flow, legacy code paths, endpoint mapping, ERP sync behavior.
> No code changes. Ready for solution design.

---

## What I Ate

| Resource | Scope |
|----------|-------|
| `app/api/call_center_api.py` | Sync routes, lock/unlock (absent) |
| `app/workers/erp_sync_worker.py` | Background sync, delete logic |
| `app/models/order.py` | mark_erp_orders_not_in_sync, delete_orders_not_in_erp |
| `front/src/api/callCenterAPI.js` | syncOrders, lock/unlock (mock), getActiveSyncStatus |
| `front/src/pages/CustomerServicePage.jsx` | Sync button, auto-refresh, handleSync |
| `front/src/components/call-center/*` | SearchBar, OrderItemsModal, CallSessionFAB |
| `front/src/config/environment.js` | API_ENDPOINTS (some mismatch) |
| `app/api/bosta_api.py`, `hub_api.py` | Endpoint existence |

---

## Issue 1: "Sync is internal not sync appear"

**Root cause:** Auto-refresh runs `syncOrders()` every 120 seconds with **no progress toast** — "Silent background sync".

```js
// CustomerServicePage.jsx:168-178
await syncOrders(); // Silent background sync - no progress toast
```

**Manual sync** (button click) shows progress via `onProgress` callback. **Scheduled/auto sync** shows nothing.

**Also:** Backend has scheduled sync every 20 min (`erp_sync_worker.start_scheduled_sync`). That runs with no frontend awareness — purely internal.

**Fix direction:** Either:
- Show subtle "جاري المزامنة..." when auto-refresh sync runs, or
- Add `isSyncing` indicator to header/status bar during any sync (manual or auto).

---

## Issue 2: "Legacy old always on front"

**Root cause:** Two separate meanings of "legacy":

### A. Service Actions Page — `searchMode = 'internal'` default
- `useServiceCreation.js`, `useTicketsFilters.js`: `searchMode = 'internal'` is initial state.
- "Internal" = search our tickets (DB). "Bosta" = search by phone/tracking.
- **Internal tab is always selected by default** — user may want Bosta-first for certain flows.

### B. OrderItemsModal — "legacy" flat items
- Comment: "Flat mode: sell / ask / legacy / unresolved RMT"
- "Legacy" here = old order structure (flat items, no directional send/receive).
- Not a toggle — it's a display mode for items that have no direction.

### C. callCenterAPI.js — mock/legacy code paths
- `lockOrder`, `unlockOrder` use `findOrderById(mockOrders)` — mockOrders is **always empty**.
- They're no-ops: return early when order not found. Never call backend.
- **Legacy mock code still in codebase** — runs but does nothing. Confusing.

**Fix direction:**
- Remove or replace lock/unlock mock with real backend calls (or explicit no-op with comment).
- Consider making Bosta search default for Service Actions when context suggests it.

---

## Issue 3: "Still calling endpoints not exist"

**Endpoint audit — Frontend vs Backend:**

| Frontend calls | Backend exists? | Notes |
|----------------|-----------------|-------|
| `POST /api/call-center/orders/:id/lock` | ❌ NO | call_center_api has no lock route. Frontend uses mock (no HTTP). |
| `POST /api/call-center/orders/:id/unlock` | ❌ NO | Same. Mock only. |
| `GET /api/call-center/sync-status` | ✅ YES | |
| `GET /api/call-center/sync-status/:job_id` | ✅ YES | |
| `POST /api/call-center/orders/sync-from-erp` | ✅ YES | |
| `POST /api/bosta/customer/:phone/sync` | ✅ YES | |
| `GET /api/hub/queues/workshop` | ✅ YES | |
| `GET /api/hub/queues/pending-dispatch` | ✅ YES | |
| `POST /api/hub/workshop/complete` | ✅ YES | |
| `GET /api/erp/drafts` | ✅ YES | erp_api |
| `GET /api/customers/search` | ✅ YES | customer_api |
| `POST /api/tickets/create` | ✅ YES | service_api route /create |

**Only missing backend routes:** lock, unlock. Frontend doesn't actually HTTP-call them — it uses mock. So no 404. But the mock is dead code (mockOrders empty).

---

## Issue 4: "ERP no sync for delete old and add new"

**Current behavior (CORRECT — delete exists):**

1. `mark_erp_orders_not_in_sync()` — sets `in_erp=0` for all `source='erp'` orders.
2. Process ERP rows — create new, update existing, set `in_erp=1` for seen.
3. `delete_orders_not_in_erp()` — deletes `status='new' AND source='erp' AND in_erp=0`.

```python
# app/workers/erp_sync_worker.py:219-221
deleted = order_model.delete_orders_not_in_erp()
logger.info(f"Deleted {deleted} orders with status='new' and in_erp=0 after sync")
```

**So:** ERP sync DOES delete old (not-in-ERP) orders. Add new = create. Update existing = refresh in_erp, order_description, etc.

**Possible user confusion:**
- **syncCustomersFromERP** (customer sync) — does NOT delete. Only creates/updates customers from ERP drafts. Different flow.
- Or: User's codebase might be older (before delete was added). Check git history.

---

## Structure Summary

```
Sync flow:
  Manual: CustomerServicePage handleSync → syncOrders({onProgress}) → POST sync-from-erp → poll sync-status
  Auto:   CustomerServicePage useEffect 120s → syncOrders() [no onProgress] → same endpoints
  Backend scheduled: erp_sync_worker every 20 min (no frontend)

Lock/unlock:
  CallSessionFAB → lockOrder/unlockOrder → MOCK (findOrderById mockOrders) → no HTTP
  Backend: no /lock, /unlock routes
```

---

## Hot Paths

1. **syncOrders** — callCenterAPI.js:1296. Calls getActiveSyncStatus, POST sync-from-erp, poll getSyncStatus.
2. **handleSync** — CustomerServicePage.jsx:209. Passes onProgress for toast.
3. **Auto-refresh** — CustomerServicePage.jsx:166. syncOrders() no onProgress.
4. **lockOrder/unlockOrder** — CallSessionFAB.jsx:325,397,702,831,855,875,898. All hit mock.

---

## Risks / Gaps

| Risk | Severity |
|------|----------|
| Lock/unlock mock — CallSessionFAB calls them; they no-op. Multi-agent race possible. | HIGH (MEMORY) |
| Auto sync invisible — user doesn't know sync ran. | MEDIUM (UX) |
| searchMode internal default — may not match workflow. | LOW |
| syncCustomersFromERP — no delete (by design; customers are cumulative). | N/A |

---

## Recommended Next Step

1. **Sync visibility:** Add `isSyncing` to CustomerServicePage header when syncOrders is in flight (manual or auto). Reuse existing `setIsSyncing(true)` — ensure it's shown in UI.
2. **Lock/unlock:** Either (a) add backend lock/unlock routes + real implementation, or (b) remove mock and document "lock not implemented — no-op".
3. **Legacy cleanup:** Remove or clearly mark mock lock/unlock. If keeping no-op, add `// No backend; no-op for now` and ensure no stale mockOrders dependency.

---

## Blast Radius

**If changing sync UI:**

| Target | Callers | Risk |
|--------|---------|------|
| CustomerServicePage handleSync, sync | None (page-level) | 🟢 |
| syncOrders options | CustomerServicePage, (auto-refresh) | 🟢 |

**If adding lock/unlock backend:**

| Target | Callers | Risk |
|--------|---------|------|
| call_center_api.py | New routes | 🟢 |
| callCenterAPI.js lockOrder/unlockOrder | CallSessionFAB (6 call sites) | 🟡 — update to real HTTP |

**If removing lock mock:**

| Target | Callers | Risk |
|--------|---------|------|
| lockOrder, unlockOrder | CallSessionFAB | 🟡 — must not fail; return success no-op |

---

---

## Applied (2026-03-11)

**Sync flow — backend-only, frontend checks:**
- Auto-refresh: `fetchOrders()` every 120s only (no syncOrders)
- handleSync: `getActiveSyncStatus()` + `fetchOrders()` — no sync trigger
- Header: poll `getActiveSyncStatus` every 30s; show "جاري المزامنة" when backend sync running
- Refresh button: "تحديث القائمة (المزامنة تلقائية كل 20 دقيقة)"

**Lock/unlock:** Unchanged (mock kept).
