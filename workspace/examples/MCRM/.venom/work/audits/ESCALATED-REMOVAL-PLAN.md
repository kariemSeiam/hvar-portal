# Escalated State Removal — Eat + Audit + Refactor Plan

> **Goal:** Remove `escalated` state. Orders with 3+ no-answer stay in queue (status unchanged) until agent does: cancel, confirm, schedule, or no-answer.

---

## What I Ate

**Resource:** All backend + frontend code touching `escalated` / `escalate` / مصعد

**Scope:** 25+ files (code + docs)

---

## Structure

| Layer | Files | Role |
|-------|-------|------|
| **Backend API** | `app/api/call_center_api.py` | no-answer auto-escalate, escalate endpoint, counts payload |
| **Backend Model** | `app/models/order.py` | OPEN_STATUSES, _build_date_where backlog |
| **Frontend Page** | `front/src/pages/CustomerServicePage.jsx` | tabs, orderCounts, handleEscalate, EmptyState |
| **Frontend Table** | `front/src/components/call-center/OrdersTable.jsx` | canLeaderActions, canEscalate, canApprove, escalate modal |
| **Frontend API** | `front/src/api/callCenterAPI.js` | leaderEscalate |
| **Frontend Layout** | `front/src/components/layout/TabNavigation.jsx` | rose color (escalated) |
| **Docs** | 15+ files | ORDER-STATES-FLOW, ESCALATED-STATE-AR, order-lifecycle, etc. |

---

## Key Findings

1. **no-answer** is the only auto-transition to escalated: `attempt >= 3 → status = 'escalated'`. Change: keep `order.get('status')` (no status change).

2. **leader-escalate** is the only manual path: confirmed → escalated. Remove entirely — no replacement (leader can reject/request-info if needed).

3. **OPEN_STATUSES** and `_build_date_where` hardcode `'escalated'` in backlog. Remove from tuple and SQL.

4. **DB:** `orders.status` is VARCHAR(30) — no enum. Existing `escalated` rows need migration.

5. **Frontend:** Escalated tab, escalate button, modal, and all `order.status === 'escalated'` checks must go. `canLeaderActions` and `canApprove` simplify to `confirmed` only.

---

## Blast Radius: escalated removal

### Direct callers (code changes required)

| File | Changes |
|------|---------|
| `app/api/call_center_api.py` | Remove escalate route; no-answer: keep status; counts: remove escalated |
| `app/models/order.py` | OPEN_STATUSES: remove escalated; _build_date_where: remove escalated |
| `front/src/pages/CustomerServicePage.jsx` | Remove escalated tab; remove orderCounts.escalated; remove handleEscalate; remove onEscalate prop; EmptyState: remove escalated branch |
| `front/src/components/call-center/OrdersTable.jsx` | canLeaderActions/canApprove: confirmed only; remove canEscalate, escalate button, escalate modal branches; remove onEscalate prop |
| `front/src/api/callCenterAPI.js` | Remove leaderEscalate; remove from exports |
| `front/src/components/layout/TabNavigation.jsx` | rose color can stay (used elsewhere?) — check: only escalated used rose. Safe to leave for future or remove. |

### Transitive / docs (update for consistency)

| File | Action |
|------|--------|
| `docs/call-center/ORDER-STATES-FLOW.md` | Rewrite: remove escalated, update no-answer flow |
| `docs/call-center/ESCALATED-STATE-AR.md` | Delete or archive |
| `docs/call-center/order-lifecycle.md` | Remove escalated |
| `docs/call-center/CONTEXT_SUMMARY.md` | Remove escalated |
| `docs/call-center/INDEX.md` | Remove ESCALATED-STATE-AR link |
| `docs/call-center/API_ENDPOINTS.md` | Remove escalate endpoint |
| `docs/call-center/call-session-cycle.md` | Update no-answer flow |
| `docs/call-center/orders-at-day-end.md` | Remove escalated |
| `docs/call-center/GAPS-AND-TRANSFORMATION.md` | Update |
| `docs/INDEX.md` | Update |
| `dev/` | Update any escalated refs |
| `docs/archive/` | No change (historical) |

### Orphan risk

- `leaderEscalate` — only called from CustomerServicePage → OrdersTable. Safe to remove.
- `onEscalate` — only passed from CustomerServicePage to OrdersTable. Safe to remove.

### Risk level: 🟡 Medium

- No DB schema change (VARCHAR).
- Migration needed for existing escalated rows.
- Tab order change (escalated removed) — UX impact.
- Leader loses "escalate" action — confirm-only for leader actions on confirmed orders.

---

## Refactor Plan

### Phase 1: Backend

1. **`app/api/call_center_api.py`**
   - `no_answer_order`: change `new_status = 'escalated' if attempt >= 3 else order.get('status')` → `new_status = order.get('status')` (always keep current status).
   - `_counts_payload_from_raw`: remove `"escalated": c('escalated')`.
   - Delete `leader_escalate` route and function (lines 818–839).

2. **`app/models/order.py`**
   - `OPEN_STATUSES = ('new', 'scheduled', 'confirmed')` — remove escalated.
   - `_build_date_where`: change `('new','scheduled','confirmed','escalated')` → `('new','scheduled','confirmed')`.

3. **Migration: existing escalated orders**
   - New migration: `UPDATE orders SET status = 'confirmed' WHERE status = 'escalated' AND confirmation_snapshot IS NOT NULL AND confirmation_snapshot != '{}'`
   - `UPDATE orders SET status = 'new' WHERE status = 'escalated'` (remaining ones).
   - Or simpler: all `escalated` → `new` (they re-enter queue; agents can confirm/schedule/cancel/no-answer).

### Phase 2: Frontend

4. **`front/src/pages/CustomerServicePage.jsx`**
   - Remove `escalated` from `orderCounts` initial state.
   - Remove escalated tab from `tabs` array.
   - Remove `handleEscalate` callback.
   - Remove `onEscalate={handleEscalate}` from OrdersTable.
   - Remove `leaderEscalate` from imports.
   - EmptyState: remove `activeTab === 'escalated'` branches (icon, description, variant).

5. **`front/src/components/call-center/OrdersTable.jsx`**
   - `canLeaderActions`: `order.status === 'confirmed'` only (remove escalated).
   - `canApprove`: `order.status === 'confirmed'` only (remove escalated).
   - Remove `canEscalate` and the escalate button.
   - Remove `onEscalate` from props.
   - Leader modal: remove all `leaderActionModal.type === 'escalate'` branches (header, summary, warning, submit).
   - Remove `type === 'escalate'` from the submit handler.

6. **`front/src/api/callCenterAPI.js`**
   - Delete `leaderEscalate` function.
   - Remove from exports.

7. **`front/src/components/layout/TabNavigation.jsx`**
   - Optional: remove `rose` from getTabColorClasses and getGlassTabActive if no other tab uses it. Else leave.

### Phase 3: Docs

8. Update docs (ORDER-STATES-FLOW, order-lifecycle, CONTEXT_SUMMARY, API_ENDPOINTS, call-session-cycle, orders-at-day-end, GAPS, INDEX).
9. Delete or archive `ESCALATED-STATE-AR.md`.
10. Remove ESCALATED-STATE-AR from index.

---

## Migration Script (SQL)

Create `migrations/004_remove_escalated_status.sql`:

```sql
-- Migrate existing escalated orders to new (they re-enter queue)
UPDATE orders SET status = 'new' WHERE status = 'escalated';
```

Run via `python migrations/run_migrations.py up`.

---

## New Flow (no escalated)

```
no-answer (any attempt):
  attempt_count++
  next_action_at = NOW + 4h
  status = order.get('status')  // unchanged

Orders with attempt_count >= 3:
  Stay in queue (new/scheduled/confirmed)
  Show attempt badge (red)
  Agent acts: confirm | schedule | no-answer | cancel
```

---

## Safe to Proceed?

**Yes with caution.**

- Run migration before or with backend deploy.
- Test: create order → no-answer x3 → verify status stays in current tab.
- Confirm no frontend references to escalated remain (grep).

---

## Done (2026-03-10)

- Phase 1: Backend ✓
- Phase 2: Frontend ✓
- Phase 3: Docs ✓
- Migration 008: Applied ✓
