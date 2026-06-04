# Hvar Hub — Legacy & Tech Debt Scan

**Date:** 2026-01-31  
**Scope:** Full codebase (app/, front/src/)  
**Method:** Grep (TODO/FIXME/deprecated/legacy), hardcoded values, file size, duplication patterns.

---

## 1. Executive Summary

| Category | Severity | Count / Notes |
|----------|----------|----------------|
| **Hardcoded `user_id: 1`** | High | 6+ places (auth not integrated) |
| **TODO / FIXME** | Medium | ~15 actionable TODOs |
| **Deprecated / legacy** | Medium | 2 deprecated paths, 1 legacy API fallback |
| **Oversized files** | High | 3 files 2000–3100 lines |
| **Duplicated logic** | Medium | Phone normalization (backend + front), modal `user_id` |
| **Legacy comments** | Low | Fixed: HUB-V1 → HUB-MCRM in app/__init__.py |

---

## 2. Hardcoded User ID (Auth Not Integrated)

**Impact:** All service actions and some modals send `user_id: 1`. When auth is integrated, these must switch to real user.

| File | Line(s) | Note |
|------|---------|------|
| `front/src/components/service/ServiceActionsPage.jsx` | 1190, 1328, 3103 | TODO: use `useAuth().userInfo?.id` |
| `front/src/pages/NewTicketsDemoPage.jsx` | 32 | `userId = userInfo?.id \|\| 1` |
| `front/src/components/modals/ServiceActionConfirmationModal.jsx` | 701 | user_id: 1 |
| `front/src/components/modals/UnifiedServiceActionModal.jsx` | 531 | user_id: 1 |
| `front/src/components/modals/ManualChangeModal.jsx` | 215, 237 | user_id: 'system' |

**Recommendation:** Introduce a single `useCurrentUserId()` (or AuthContext) and replace all 6+ usages. Backend already accepts `user_id` from request; no API change needed.

---

## 3. TODO / FIXME / Deprecated

### 3.1 Deprecated code paths

- **ServiceActionsPage.jsx ~915:** `loadTickets` is marked "deprecated - use fetchTickets instead". Either remove `loadTickets` and migrate all callers to `fetchTickets`, or remove the comment if both are needed.

### 3.2 TODOs (actionable)

| File | Line | TODO |
|------|------|------|
| ServiceActionsPage.jsx | 1108 | Implement action details modal or navigation for full action history |
| ServiceActionsPage.jsx | 1190, 1328, 3103 | Replace user_id: 1 with useAuth().userInfo?.id |
| NewTicketsDemoPage.jsx | 32 | Replace with proper user ID when auth integrated |
| ServiceActionConfirmationModal.jsx | 701 | Replace user_id with auth |
| StockManagementPage.jsx | 435 | Implement low stock/out of stock alerts (alert_quantity, min_stock_level) |
| UnifiedServiceActionModal.jsx | 531, 536 | user_id from auth; add reason field if needed |
| ManualChangeModal.jsx | 215, 237 | user_id from auth |

### 3.3 Legacy fallbacks

- **callCenterAPI.js ~1017:** "Fallback 2: Try by customer_id (for legacy orders that might use customer_id as order id)". Document or narrow when this fallback runs; keep if required for old data.
- **permissions.js ~463–476:** Legacy `getUserMedia` (pre-navigator.mediaDevices) for older browsers. Keep but ensure it’s clearly guarded and tested.

---

## 4. Oversized Files (Refactor Candidates)

| File | ~Lines | Risk |
|------|--------|------|
| **front/src/components/service/ServiceActionsPage.jsx** | ~2993 | Single component holds filters, list, modals, FAB, search, creation flow. Hard to test and change. |
| **front/src/api/callCenterAPI.js** | ~2181 | All call-center API + helpers in one file. |
| **front/src/components/modals/ServiceModalViewer.jsx** | ~2035 | Viewer + layout + Bosta/print. |

**Recommendation:**

- **ServiceActionsPage.jsx:** Split into: (1) page container, (2) ticket list + filters (e.g. ServiceActionsCardsView + ServiceActionsFilters), (3) creation flow (FAB + order selection), (4) hooks for data (e.g. useTickets, useServiceCreation). Move constants (e.g. EGYPTIAN_GOVERNORATES, BOSTA_FAB_ACTIONS) to a constants file.
- **callCenterAPI.js:** Group by domain: orders, calls, queue, sync. Consider `callCenterOrders.js`, `callCenterCalls.js`, `callCenterQueue.js` and a small `callCenterAPI.js` re-exporting or composing them.
- **ServiceModalViewer.jsx:** Extract: (1) Bosta/order section, (2) print layout (or delegate to buildServiceModalPrintHtml), (3) viewer shell. Keep viewer as thin coordinator.

---

## 5. Duplication & Consistency

### 5.1 Phone normalization (01XXXXXXXXX)

Same rule (Egypt 01XXXXXXXXX) implemented in:

- **Backend:** `app/utils/phone_normalizer.py`, `app/services/service_manager.py`, `app/api/customer_api.py`, `app/models/customer.py`, `app/services/bosta_service.py`, `migrations/002_normalize_phone_numbers.py`
- **Frontend:** `front/src/utils/phoneUtils.js`, `front/src/utils/orderCardUtils.js`, `front/src/utils/orderValidation.js`, `front/src/api/callCenterAPI.js`, `front/src/hub.js`

Backend and frontend are separate runtimes; duplication is expected. Within frontend, ensure all callers use `phoneUtils.js` (normalizeEgyptPhone, formatPhoneForLocalDisplay) and that orderCardUtils/orderValidation/callCenterAPI don’t reimplement logic. Within backend, all phone handling should go through `utils/phone_normalizer` and the same format.

### 5.2 Modal `user_id` and reason

Multiple modals (ServiceActionConfirmationModal, UnifiedServiceActionModal, ManualChangeModal, ServiceActionsPage) send `user_id` (and sometimes `reason`) to the API. Centralize: one hook or context (e.g. `useCurrentUserId()`, optional `useActionReason()`) and one place that builds the payload for service actions.

### 5.3 In-memory cache (backend)

`app/api/service_api.py` uses a simple module-level `_counts_cache` with TTL. Works but is not shared across workers. For multi-worker deployments, consider Redis or another shared cache; document current behavior.

---

## 6. Other Findings

- **ClassificationModal.jsx ~199:** `id: \`temp-${Date.now()}\`` for new items. Name is fine; ensure IDs are replaced with server IDs after save.
- **CallSessionFAB / OrderItemsEditor:** Use `tempDescription` / `tempNotes` for edit-in-place. Pattern is clear; no change needed unless you standardize all inline edits.
- **Backend:** No `temp`/`workaround`/legacy patterns beyond `old_status`/`new_status` in history (domain terms). DB access is centralized in `app/utils/db.py` and models; pattern is consistent.

---

## 7. Suggested Priority

1. **High:** Replace hardcoded `user_id: 1` with auth (single hook/context + replace in all 6+ places).
2. **High:** Split ServiceActionsPage.jsx into smaller components + hooks + constants.
3. **Medium:** Resolve deprecated `loadTickets` (remove or migrate to fetchTickets).
4. **Medium:** Implement stock alerts (StockManagementPage.jsx TODO).
5. **Medium:** Split callCenterAPI.js by domain; optionally split ServiceModalViewer.jsx.
6. **Low:** Document legacy fallbacks (callCenterAPI customer_id, permissions.js getUserMedia); add shared cache note for service_api counts if moving to multi-worker.

---

## 8. Files Touched by This Scan

- Grep: TODO, FIXME, deprecated, legacy, temp, workaround, user_id: 1, normalize phone.
- Read: ServiceActionsPage.jsx (head + loadTickets), service_api.py (head), project structure.
- Backend: app/ (api, models, services, utils). Frontend: front/src (components, pages, api, utils).
