# Legacy Remediation Plan — Hvar Hub

**Date:** 2026-01-31  
**Source:** dev/LEGACY_SCAN.md  
**Mode:** Plan only — no code until "go".

---

## Goal

Resolve legacy scan findings in priority order: centralize user ID (auth), remove deprecated code, split oversized files, implement missing TODOs, document fallbacks. Behavior and APIs stay the same; structure and maintainability improve.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Frontend: AuthProvider wrap, user_id from useAuth, loadTickets removal, ServiceActionsPage split, callCenterAPI split, ServiceModalViewer split, stock alerts, reason field (if needed) | Full auth backend (login/API); Redis/shared cache for counts |
| Backend: Document counts cache behavior | Changing API contracts |
| Docs: Legacy fallbacks, cache note | Rewriting phone normalization (already consistent per side) |

**Size:** L (multi-phase, 6+ files per phase for splits).

---

## Context

- **AuthContext** exists (`contexts/AuthContext.jsx`) with `useAuth()` and `userInfo`; **AuthProvider is not mounted in App.jsx**, so only NewTicketsDemoPage and CallSessionFAB use it (others get default `userInfo: null`).
- **loadTickets** is defined in ServiceActionsPage.jsx but has **no callers**; all call sites use `fetchTickets`. Safe to remove.
- **Backend** already accepts `user_id` from request body; no API change for user_id.

---

## Architecture

1. **User ID:** One source of truth: `useAuth().userInfo?.id` with fallback `1` (or `'system'` for ManualChangeModal when no user). Wrap app with AuthProvider so every page can use useAuth.
2. **ServiceActionsPage:** Thin page container that composes: filters (existing ServiceActionsFilters), list (existing ServiceActionsCardsView), FAB + creation flow, and a new `useTickets` (or similar) hook that holds fetchTickets, pagination, tab state. Constants (EGYPTIAN_GOVERNORATES, BOSTA_FAB_ACTIONS) → `constants/serviceActions.js` (or under components/service).
3. **callCenterAPI.js:** Split by domain: e.g. `callCenterOrders.js`, `callCenterCalls.js`, `callCenterQueue.js`; `callCenterAPI.js` re-exports for backward compatibility so existing imports keep working.
4. **ServiceModalViewer:** Extract Bosta/order block and print layout into subcomponents or delegated modules; viewer stays as coordinator.
5. **Stock alerts:** Use existing `alert_quantity` / `min_stock_level` from API; add UI (badge, section, or toast) on Stock management page when data indicates low/out of stock.

---

## Phases and Tasks

### Phase 1 — User ID and AuthProvider ✅ **COMPLETE**

**Status:** ✅ **COMPLETE** (2026-01-31)
**Priority:** High (affects data integrity)
**Blast Radius:** Small (single concept, multiple files)
**Risk:** Low (safe fallback pattern)

**See:** `dev/PHASE_1_COMPLETE.md` for detailed completion report.

**Summary:**
- ✅ AuthProvider wraps entire app in `App.jsx`
- ✅ All hardcoded `user_id: 1` and `user_id: 'system'` replaced with `useAuth()` calls
- ✅ 9 files modified, 13 locations fixed
- ✅ All TODOs removed
- ✅ No breaking changes — graceful fallback when no user logged in

---

### Phase 2 — Deprecated loadTickets and small TODOs (Medium, low risk)

| # | Task | Details |
|---|------|---------|
| 1.1 | Wrap app with AuthProvider | In App.jsx, wrap Router (or main content) with `<AuthProvider>`. Ensures useAuth() available on /services, /stock, etc. |
| 1.2 | Replace hardcoded user_id in ServiceActionsPage.jsx | Import useAuth; use `userInfo?.id ?? 1` for all three places (1190, 1328, 3103). Remove TODO comments. |
| 1.3 | Replace in ServiceActionConfirmationModal.jsx | useAuth(); `user_id: userInfo?.id ?? 1`. |
| 1.4 | Replace in UnifiedServiceActionModal.jsx | useAuth(); `user_id: userInfo?.id ?? 1`. Optionally add reason from form if needed (536). |
| 1.5 | Replace in ManualChangeModal.jsx | useAuth(); `user_id: userInfo?.id ?? 'system'` (or keep 'system' when no user). |
| 1.6 | NewTicketsDemoPage.jsx | Already uses userInfo?.id \|\| 1; only remove TODO comment. |

**Done when:** All service actions and modals send user_id from useAuth (or fallback); AuthProvider wraps app; no hardcoded `user_id: 1` / `'system'` without fallback from context.

---

### Phase 2 — Deprecated loadTickets and small TODOs (Medium, low risk)

| # | Task | Details |
|---|------|---------|
| 2.1 | Remove loadTickets | In ServiceActionsPage.jsx, delete the `loadTickets` callback (~915–935) and the "deprecated" comment. Grep confirmed no callers. |
| 2.2 | Document or implement action-details modal | ServiceActionsPage.jsx ~1108: Either add a small "View full history" modal/navigation that shows action history, or add a short comment that it’s deferred. |
| 2.3 | Stock alerts (StockManagementPage.jsx) | Use ticket/counts or stock API that exposes alert_quantity/min_stock_level; add a section or badge for "Low stock" / "Out of stock" and link to relevant list. |

**Done when:** loadTickets removed; action history either implemented or explicitly deferred; stock page shows low/out-of-stock where data exists.

---

### Phase 3 — Split ServiceActionsPage.jsx (High, refactor)

| # | Task | Details |
|---|------|---------|
| 3.1 | Extract constants | Create `front/src/components/service/constants.js` (or `serviceActionConstants.js`) with EGYPTIAN_GOVERNORATES, BOSTA_FAB_ACTIONS. Import in ServiceActionsPage and any other consumer. |
| 3.2 | Extract useTickets hook | New file `front/src/hooks/useTickets.js` (or under components/service): move fetchTickets, tab state (activeStatus, activeSubTab), pagination state, filteredTickets, fetchBackendCounts, and related effects. Page keeps UI state (modals, selection). |
| 3.3 | Extract creation flow component | New component e.g. ServiceCreationFAB or reuse existing FAB + order selection: state for selectedOrder, selectedActionType, showUnifiedModal; handlers that call API and then refresh tickets (from useTickets). |
| 3.4 | Thin page to composition | ServiceActionsPage.jsx becomes: useTickets(), useAuth(), filters, list, creation FAB, modals (Unified, Confirmation, Viewer, Workflow). No business logic beyond wiring. |

**Done when:** ServiceActionsPage.jsx &lt; ~800 lines; constants and hook and creation flow in separate files; behavior unchanged.

---

### Phase 4 — Split callCenterAPI.js (Medium)

| # | Task | Details |
|---|------|---------|
| 4.1 | Create domain modules | e.g. callCenterOrders.js (order CRUD, sync, getByInvoice), callCenterCalls.js (log call, history), callCenterQueue.js (queue, counts, next-action). Move functions and keep same signatures. |
| 4.2 | Re-export from callCenterAPI.js | Export everything from the new modules so `import { ... } from '../api/callCenterAPI'` still works. |
| 4.3 | Prefer direct imports in new code | New code can import from callCenterOrders / callCenterCalls / callCenterQueue; old imports remain valid. |

**Done when:** callCenterAPI.js is a thin re-export; largest logic lives in 2–3 domain files; no change to public API surface.

---

### Phase 5 — ServiceModalViewer.jsx split (Medium, optional in same sprint)

| # | Task | Details |
|---|------|---------|
| 5.1 | Extract Bosta/order section | Component or section that receives order and renders Bosta block (tracking, attempts, etc.). |
| 5.2 | Extract print layout | Delegate to buildServiceModalPrintHtml or a small PrintLayout component; viewer only passes data. |
| 5.3 | Viewer as coordinator | ServiceModalViewer.jsx: state, open/close, and composition of header, ticket info, Bosta section, print section, actions. |

**Done when:** ServiceModalViewer.jsx &lt; ~1000 lines; Bosta and print are clear subcomponents or delegated modules.

---

### Phase 6 — Documentation and backend note (Low)

| # | Task | Details |
|---|------|---------|
| 6.1 | Document legacy fallbacks | In callCenterAPI.js (or dev/LEGACY_SCAN.md / README): when "Fallback 2: customer_id" runs and that it supports legacy orders. |
| 6.2 | Document permissions.js getUserMedia | Short comment that legacy getUserMedia is for older browsers; keep guarded. |
| 6.3 | Backend counts cache | In service_api.py or docs: note that _counts_cache is per-process; for multi-worker deployments use a shared cache (e.g. Redis). |

**Done when:** Legacy fallbacks and cache behavior are documented.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| AuthProvider not yet used elsewhere; might need login flow later | Plan only wires user_id; login UI and backend auth are out of scope. AuthProvider already has mock login; real auth can be added later. |
| Splitting ServiceActionsPage breaks subtle state | Extract hook and creation flow incrementally; run app and test filters, tabs, create ticket, confirm action, refresh list after each step. |
| callCenterAPI split breaks imports | Re-export everything from callCenterAPI.js; grep for `from.*callCenterAPI` and ensure all exported symbols remain. |
| Stock API might not expose alert_quantity | Check stock API and models first; if missing, add minimal fields or compute from existing stock fields and document. |

---

## Done When (Overall)

- No hardcoded `user_id: 1` or `'system'` without useAuth fallback; AuthProvider wraps app.
- loadTickets removed; action-details TODO resolved or deferred; stock alerts shown where data exists.
- ServiceActionsPage.jsx split into page + hook + constants + creation flow; file under ~800 lines.
- callCenterAPI.js split into domain modules with re-export; no breaking imports.
- ServiceModalViewer.jsx split (Bosta + print + coordinator) and under ~1000 lines.
- Legacy fallbacks and backend cache documented.

---

## Execution Order

1. Phase 1 (AuthProvider + user_id) — unblocks clean removal of TODOs and keeps refactors consistent.
2. Phase 2 (loadTickets + TODOs) — quick wins.
3. Phase 3 (ServiceActionsPage split) — largest maintainability gain.
4. Phase 4 (callCenterAPI split).
5. Phase 5 (ServiceModalViewer) — can run in parallel with 4 if two people, else after 4.
6. Phase 6 (docs) — can be done anytime after 1–2.

Reply **go** to start with Phase 1; or specify a phase (e.g. "go Phase 1 only") to execute that phase only.
