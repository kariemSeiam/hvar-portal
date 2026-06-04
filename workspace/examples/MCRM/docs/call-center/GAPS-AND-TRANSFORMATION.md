# Call Center — Gaps & Transformation Plan

> **Purpose:** Inventory of what's missing vs vision. Ready for full UI/UX recreation and backend alignment.
> **Eaten:** 2026-02-25 | Vision docs + frontend anatomy + implementation state
> **Updated:** 2026-02-25 — Phases A–D (incl. B+) implemented. See NEXT-EAT for remaining.

**Closed as of 2026-02-25:** Call type selector (2.1), Direct/ASK flow (2.2), Escalated tab (2.4), Search→server (2.5), Leader workflow (2.3, 4), Cancellation dropdown (3.3), Empty states (Phase D), Skeletons (Phase D), Genome focus tokens (core components).

---

## 1. Current State Summary

### What Exists (Working)

| Layer | Status | Notes |
|-------|--------|-------|
| **Backend** | Phase 1–4 done | Migration, models, API (orders, calls, sync-from-erp, confirm/schedule/no-answer/cancel, ask-only, counts) |
| **Frontend API** | Wired | listOrders, syncOrders, getOrderCounts, getOrder, getOrderCalls, getOrderCallContext, confirm/cancel/schedule/noAnswer, autoMatchItems |
| **Queue** | Working | CustomerServicePage, OrdersTable, QueueStatusBar, SearchBar, FilterPanel, tabs |
| **Call Session** | Working | CallSessionFAB (global), customer context, Bosta orders, service tickets, items editor, outcomes |
| **Outcomes** | Working | Confirm, Schedule, No Answer, Cancel — all hit real backend |

### What's Mock / Placeholder

| Feature | State | Impact |
|---------|-------|--------|
| lockOrder / unlockOrder | Mock (in-memory) | No real lock; multi-agent could work same order |
| processOrderToHub | Real (calls leader-approve) | Creates ticket on leader approval |
| Order items CRUD | getOrderItems returns []; updateOrderItems mock | Items edited in session; confirm passes them but no pre-save |
| searchStockItems | Uses real `/api/stock/items` now | OK |
| ERP credentials | Hardcoded default in syncOrders | Should come from auth/settings |

---

## 2. Vision vs Reality — Gaps

### 2.1 Call Type Selector (Critical) — DONE (Phase A)

**Vision (call-session-cycle.md):**
> Call type sits at top of every call session. Always visible. Editable at any time until closed.
> Pre-filled: ERP → SELL; Direct → ASK. Agent reclassifies as needed.

**Reality:** Call type bar in CallSessionFAB; pass `call_type` to confirm/schedule/noAnswer. Pre-fill sell for ERP, ASK for direct.

---

### 2.2 Direct / ASK Call Flow (Path B) — DONE (Phase B, B+)

**Vision (workflow.md, 00-NEW-VISION):**
> Agent receives inbound or initiates outbound. No pre-existing order. Search customer by phone → Bosta lookup → Call session (type=ASK) → Agent reclassifies or keeps ASK.

**Reality:** "استفسار جديد" button → phone search → CallSessionFAB order=null, call_type=ASK. Confirm(ASK)→ask-only. Confirm(sell/R/M/T)→createDirectOrder + confirmOrder.

---

### 2.3 Leader Approval Workflow

**Status: Implemented (Phase C).** All orders require leader approval before ticket creation.

**Flow:** Agent confirms → status=confirmed (no ticket) → Leader queue (tab "مؤكدة") → Leader clicks "Process to Hub" = leader-approve → ticket created, status=converted.

**Endpoints:** GET /pending, POST /leader-approve, POST /reject, POST /request-info.

---

### 2.4 No-Answer 3+ — Status Unchanged (Phase A)

**Vision (order-lifecycle, call-session-cycle):**
> 3× no_answer → order stays in queue until agent acts.

**Reality:** No escalated state. Status unchanged on no-answer; 3+ attempts stay in current tab (new/scheduled/confirmed). Agent acts: confirm/schedule/cancel/no-answer.

---

### 2.5 Search — Server vs Client — DONE (Phase A)

**Vision:** Search by phone/name should narrow queue.

**Reality:** `listOrders` receives `search` param. Server-side search when query provided.

---

### 2.6 Customer 360° — Services from Backend

**Vision:** Customer 360° = customer + Bosta orders + service tickets + call history.

**Reality:** getOrderCallContext fetches Bosta orders (real) and customer (customerAPI search). `services` is set to `[]` (we don't fetch tickets by customer).

**Gap:** Fetch service tickets by customer (phone or customer_id). Add to getOrderCallContext or new endpoint.

---

### 2.7 Order Description / Items Source

**Vision:** ERP row has `shipping_details` (items description). Parse → match to stock → pre-fill items for confirm.

**Reality:** We don't store `order_description` in orders (no column). Use `delivery_address` as fallback. Parse pattern expects "quantity * name (sku)". If ERP format differs, matching fails.

**Gap:** Add `order_description` column to orders migration; populate from `shipping_details` during sync. Or document ERP format and ensure parser matches.

---

### 2.8 Tabs vs Backend Status

**Backend statuses:** new, scheduled, confirmed, converted, canceled

**Frontend tabs:** all, new, scheduled, confirmed, completed, canceled, inquiries

**Mapping:** converted → completed. Good.

---

### 2.9 "All" Tab Semantics

**Reality:** "All" shows only new + scheduled. Excludes confirmed, completed, canceled.

**Vision:** "All" could mean "all active" (new+scheduled) or "everything". Current behavior is "active only" — fine. Consider renaming to "نشط" (active) for clarity.

---

### 2.10 Process to Hub — DONE (Phase C)

**Vision:** After leader approves, ticket enters Hub. "Process to Hub" = transition from call-center to hub.

**Reality:** Flow: confirm → status=confirmed (no ticket) → tab "مؤكدة" → Leader clicks "Process to Hub" = leader-approve → ticket created.

---

## 3. UI/UX Gaps (Design)

### 3.1 Call Session Layout

**Vision (call-session-cycle.md):**
```
┌─────────────────────────────────────────────────────────────────┐
│  CALL TYPE  [ SELL ▼ ]    ← visible + editable at all times     │
├─────────────────────────────────────────────────────────────────┤
│  CUSTOMER INFO (editable)                                        │
│  ORDER / REQUEST DETAILS (items, COD)                             │
│  CALL HISTORY                                                    │
│  OUTCOME BUTTONS  [ تأكيد ] [ جدولة ] [ لم يرد ] [ إلغاء ]      │
└─────────────────────────────────────────────────────────────────┘
```

**Reality:** Call type bar at top. Layout tabbed (Bosta / Services). Done.

### 3.2 Validation on Confirm — DONE (Phase B+)

**Vision:** If call_type ≠ ASK: products + address required. If call_type = ASK: notes only.

**Reality:** handleConfirmDirect validates phone, address (governorate or delivery_address), items for sell/R before submit. Backend confirmOrder relaxes items for M/T.

---

### 3.3 Cancellation Reasons — DONE

**Vision (call-session-cycle):** Dropdown + optional notes. Reasons: customer_refused, wrong_number, order_not_needed, duplicate_order, address_unreachable, other.

**Reality:** ReasonChipSelector with structured options + other.

---

### 3.4 Schedule — Date + Time

**Vision:** Callback datetime (date + time picker).

**Reality:** CallSessionFAB has scheduledDate, scheduledTime, preferCustomDate. Good. Backend receives `callback_at` as ISO.

---

### 3.5 RTL & Arabic

**Reality:** dir=rtl on page. Arabic labels. Good.

---

## 4. Backend Gaps

| Gap | Severity | Fix |
|-----|----------|-----|
| erp_order_id dedup on sync | High | Unique index or INSERT ... ON DUPLICATE KEY UPDATE |
| GET /orders/counts | — | Implemented |
| POST ask-only — used by? | Medium | Only when direct ASK flow exists |
| GET /customers/:phone (360°) | Medium | Phase 5 — not implemented |
| Leader approve/reject/request-info | — | Phase C — implemented |
| order_description column | Medium | Migration 005 if we want items parse from ERP |

---

## 5. Transformation Roadmap

### Phase A — Minimal Fixes (1–2 days)

1. **Call type selector** — Add dropdown at top of CallSessionFAB. Pass `call_type` to confirm/cancel/schedule/noAnswer. For ERP orders pre-fill "sell"; allow change.
2. ~~Escalated tab~~ — Removed. 3+ no_answer stay in queue; status unchanged.
3. **Search → API** — When searchQuery looks like phone (digits), pass to listOrders(search=...). Otherwise keep client filter or add name search to API.
4. **Cancellation reason dropdown** — Structured options + "other" free text.

### Phase B — Journey B (Direct Call)

1. **"New inquiry" entry** — Button in header or floating. Opens phone search → CallSessionFAB with order=null.
2. **CallSessionFAB order=null mode** — When no order: call_type=ASK default. On confirm(ASK) → POST ask-only. On confirm(typed) → create order (POST /orders) then confirm-by-customer or leader flow.
3. **Create order endpoint** — POST /api/call-center/orders for direct orders. Backend exists per API_ENDPOINTS; verify.

### Phase C — Leader Workflow

1. **Leader queue page or section** — GET /api/call-center/pending. Tab or separate route.
2. **Approve / Reject / Request-info** — Backend endpoints. Wire buttons.
3. **Confirm flow change** — Optional: confirm → status=confirmed (no ticket) → leader approves → ticket. Or keep current (direct ticket on confirm) and add leader as read-only review.

### Phase D — Full UI/UX Recreation

1. **Information architecture** — Re-organize call session: type first, then customer, then details, then outcomes. Match vision exactly.
2. **Empty states** — Per tab, per filter. Clear CTAs.
3. **Loading / error** — Skeleton, inline errors, retry.
4. **Accessibility** — Focus management, keyboard nav, ARIA.
5. **Mobile** — Call session as full-screen on small viewport. FAB works; consider bottom sheet for outcomes.

---

## 6. Quick Reference — What to Build Next

**Done (2026-02-25):** Call type selector, Escalated tab, Search→server, Cancellation dropdown, New inquiry/direct call, Leader workflow.

| Priority | Item | Effort | Blocks |
|----------|------|--------|--------|
| P1 | erp_order_id dedup | S | Data integrity |
| P1 | Customer 360° services | M | Context |
| P1 | Lock/unlock backend | M | Multi-agent |
| P2 | order_description in orders | M | Items parse |
| P2 | Genome sweep (remaining blue-500) | S | Consistency |
| P3 | Call history visibility | M | Optional UX |

S=small, M=medium, L=large. See [NEXT-EAT](../../dev/call-center/NEXT-EAT.md).

---

---

## Related

| Doc | Purpose |
|-----|---------|
| [dev/call-center/DESIGN-TRANSFORMATION-PHASES.md](../../dev/call-center/DESIGN-TRANSFORMATION-PHASES.md) | Eat-by-eat design polish per phase — genome alignment, perfect vision |

---

*Gaps v1.0 | 2026-02-25 | Eaten. Ready for next.*
