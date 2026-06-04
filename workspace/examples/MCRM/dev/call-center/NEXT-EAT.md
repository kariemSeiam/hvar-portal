# Next — Eaten

> **Purpose:** What comes after Phase D. Absorbed. Ready for build.
> **Source:** PHASE-D-FULL-EAT, GAPS-AND-TRANSFORMATION, IMPLEMENTATION-RECOMMENDATION, PLAN

---

## Current State (Done)

| Phase | Status |
|-------|--------|
| A | Call type selector, Escalated tab, Search→API, Cancellation dropdown |
| B | New inquiry, order=null, ask-only |
| B+ | Direct confirm (sell/R/M/T) with item entry |
| C | Leader approval for all types |
| D | Genome polish, EmptyState variants, skeleton rows, focus tokens |

---

## Next — Priority Order

### 1. Call History Visibility (Phase D.7) — DONE (2026-02-25)

**Was:** Call history inside Bosta/Services tabs. Vision: always visible.

**Done:** CallSessionFAB — "آخر المكالمات" section always visible in right column, collapsible, genome-styled. Fetched via getOrderCalls in loadData. mapCallFromBackend extended for attempt_number, agent_name.

---

### 2. Customer 360° — Services from Backend (GAPS 2.6)

**Gap:** `getOrderCallContext` returns `services: []`. No tickets by customer.

**Change:** New endpoint or extend getOrderCallContext: fetch service tickets by `customer_phone` or `customer_id`. Wire to frontend.

**Files:** `app/api/call_center_api.py` or `callCenterAPI.js` getOrderCallContext; backend ticket list by customer.

**Effort:** M

---

### 3. Lock/Unlock — Real Backend (GAPS — Mock)

**Gap:** `lockOrder` / `unlockOrder` are mock (in-memory). Multi-agent could work same order.

**Change:** Add `locked_by`, `locked_at` to orders; endpoint `POST /orders/:id/lock`, `POST /orders/:id/unlock`. Check lock before confirm/schedule/no-answer.

**Effort:** M

---

### 4. erp_order_id Dedup (GAPS 4 — Backend)

**Gap:** Sync can create duplicate ERP orders.

**Change:** Unique index on `erp_order_id` or `INSERT ... ON DUPLICATE KEY UPDATE` in sync logic.

**Effort:** S

---

### 5. order_description Column (GAPS 2.7)

**Gap:** No `order_description` in orders. Items parse uses `delivery_address` fallback.

**Change:** Migration add `order_description`; populate from ERP `shipping_details` during sync.

**Effort:** M

---

### 6. Genome Sweep — DONE (2026-02-25)

**Files swept:** HubScanModal, ServiceWorkflowActionModal, ManualChangeModal, ProductStockModal, ProductPartsManagementModal, RefundSection, WorkflowSection, CustomerSection, ItemsSelectionSection, ServiceCard, ServiceActionConfirmationModal, HubPage.

**Change applied:** `focus:ring-blue-500` / `focus:border-blue-500` → `focus:ring-brand-red-500 focus:border-brand-blue-500`.

---

### 7. Orders Table — Vision Track (dev/orders-table)

**Status:** PLAN + IMPLEMENTATION-RECOMMENDATION exist. Phases 1–4 largely implemented (migrations, models, API, frontend).

**Next:** Phase 5 — Leader workflow + edge cases. Verify dedup, lock, order_description alignment with this vision.

---

## Recommended Order

| # | Item | Why |
|---|------|-----|
| 1 | erp_order_id dedup | S, data integrity, blocks sync issues |
| 2 | Customer 360° services | M, completes context for agents |
| 3 | Lock/unlock backend | M, multi-agent safety |
| 4 | order_description + sync | M, enables items parse from ERP |
| 5 | Genome sweep | ✓ Done |
| 6 | Call history visibility | ✓ Done |

---

## Files to Touch

| Item | Files |
|------|-------|
| Dedup | `app/api/call_center_api.py`, sync logic, migration |
| Customer 360° | `app/api/`, `callCenterAPI.js` getOrderCallContext |
| Lock/unlock | `app/models/order.py`, `app/api/call_center_api.py`, `callCenterAPI.js` |
| order_description | Migration, `app/models/order.py`, sync, ERP converter |
| Genome sweep | ✓ Done |

---

*Eaten. Ready for next.*
