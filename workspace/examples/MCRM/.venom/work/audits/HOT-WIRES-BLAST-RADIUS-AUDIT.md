# Hot Wires Blast Radius Audit — 2026-03-09

> `/venom?` init + venom-audit protocol on all 7 hot wires

---

## Init Status

✓ `.venom/CONTEXT.md` loaded — project brain active  
✓ `.venom/memory/MEMORY.md` loaded — cross-session truth  
✓ `.venom/learnings/corrections.yaml` loaded — 15 hard rules  
✓ `.venom/work/ACTIVE.md` loaded — current priorities  

**Current state:** VENOM ultra-deep eat complete. Full project knowledge. Ready for audits.

---

## 1. `app/utils/db.py` — All Data Access

**Direct callers:** 18 files
- `app/models/call.py`
- `app/models/bosta_order.py`
- `app/models/customer.py`
- `app/models/tracking.py`
- `app/models/order.py`
- `app/models/service_ticket.py`
- `app/models/stock.py`
- `app/api/stock_api.py`
- `app/api/call_center_api.py`
- `app/api/service_api.py`
- `app/api/hub_api.py`
- `app/services/stock_manager.py`
- `app/services/service_manager.py`
- `app/services/tracking_manager.py`
- `app/utils/pagination.py`
- `app/__init__.py` (get_db)
- `migrations/002_normalize_phone_numbers.py`
- `scripts/bosta_diagnostic_all_phones.py`

**Transitive callers:** Every model → every API → every frontend page

**Orphan risk:** None — core infrastructure

**Risk level:** 🔴 **CRITICAL**

**What breaks if you change signature:**
- All `execute_query()` calls → SELECT queries fail
- All `execute_insert()` calls → INSERT returns no ID
- All `execute_update()` calls → UPDATE returns no rowcount
- All `transaction()` context managers → no rollback on error
- Connection pooling breaks → Flask `g` object loses DB handle
- JSON field parsing breaks → all JSON columns return strings

**What breaks if you delete it:**
- Entire backend stops working
- All models break
- All APIs break
- Frontend gets no data

**Safe to proceed?** **NO — Never touch without full test suite + migration plan**

---

## 2. `app/utils/phone_normalizer.py` — Canonical Phone Format

**Direct callers:** 15 files
- `app/models/order.py` (normalize_phone_safe)
- `app/models/customer.py` (normalize_to_local_phone, normalize_phone_safe)
- `app/models/call.py` (normalize_phone_safe)
- `app/api/call_center_api.py` (normalize_phone_safe)
- `app/api/customer_api.py` (normalize_to_local_phone, normalize_phone_safe)
- `app/api/hub_api.py` (normalize_ticket_phone)
- `app/api/service_api.py` (normalize_ticket_phone)
- `app/services/bosta_service.py` (normalize_to_local_phone, normalize_phone_safe)
- `app/services/service_manager.py` (normalize_to_local_phone, normalize_phone_safe)
- `app/utils/validators.py` (normalize_to_local_phone, normalize_phone_safe)
- `migrations/002_normalize_phone_numbers.py` (normalize_phone_safe)
- `scripts/bosta_diagnostic_all_phones.py` (normalize_phone_safe)
- `scripts/bosta_financial_audit.py` (normalize_phone)
- `scripts/bosta_cod_fees_report.py` (normalize_phone)

**Transitive callers:** Every phone input → Bosta API → Customer search → Order creation

**Orphan risk:** None — core utility

**Risk level:** 🔴 **CRITICAL**

**What breaks if you change format:**
- Bosta API returns 0 results (expects `01XXXXXXXXX`)
- Customer search fails (phone mismatch)
- ERP sync breaks (phone normalization fails)
- Order creation fails (validation rejects phone)
- Call context enrichment breaks (no Bosta data)

**What breaks if you delete it:**
- All phone-dependent features break
- Bosta integration stops working
- Customer lookup fails
- Order creation fails

**Safe to proceed?** **NO — Format is canonical. Change = break everything**

---

## 3. `front/src/styles/design-tokens.css` — Design System Source

**Direct callers:** 100+ files (via CSS variables)
- `front/src/index.css` (imports design-tokens.css)
- `front/tailwind.config.js` (must match values)
- `front/src/utils/designTokens.js` (exports token values)
- All components using `var(--color-brand-*)` or Tailwind `bg-brand-*` classes

**Transitive callers:** Every styled component → design system

**Orphan risk:** None — design system foundation

**Risk level:** 🔴 **HIGH**

**What breaks if you change tokens:**
- Tailwind config must sync manually (duplication intentional)
- 100+ components need verification
- Dark mode breaks if tokens change
- RTL styles break if spacing tokens change

**What breaks if you delete it:**
- All colors revert to browser defaults
- Typography breaks (Cairo, Tajawal fonts)
- Spacing system breaks
- Dark mode breaks

**Safe to proceed?** **Yes with caution — Update tailwind.config.js simultaneously + verify all components**

---

## 4. `app/services/service_manager.py` — State Machines & Stock Physics

**Direct callers:** 3 files
- `app/api/service_api.py` (all ticket operations)
- `app/api/call_center_api.py` (ticket creation from orders)
- `app/api/hub_api.py` (hub workflows)

**Transitive callers:** Every ticket action → service_manager → state machine → stock operations

**Orphan risk:** None — core business logic

**Risk level:** 🔴 **CRITICAL**

**What breaks if you change signatures:**
- All ticket creation breaks (create_replacement_ticket, create_maintenance_ticket, etc.)
- All status transitions break (confirm, cancel, complete, etc.)
- Stock reservations break (reserve_stock, commit_reservation, cancel_reservation)
- State machine validation breaks (invalid transitions corrupt data)
- Four workflows break (R/M/T/S have different physics)

**What breaks if you delete it:**
- Entire hub workflow stops
- No ticket creation
- No status transitions
- No stock operations
- System unusable

**Safe to proceed?** **NO — 1800+ lines, 4 state machines, stock physics. Test all workflows before any change**

---

## 5. `front/src/contexts/CallSessionContext.jsx` — Global Call Session

**Direct callers:** 3 files
- `front/src/App.jsx` (CallSessionProvider, CallSessionFAB)
- `front/src/pages/CustomerServicePage.jsx` (useCallSession)
- `front/src/components/call-center/CallSessionFAB.jsx` (useCallSession)

**Transitive callers:** CallSessionFAB → all call-center pages → call session state

**Orphan risk:** None — global state

**Risk level:** 🟡 **MEDIUM-HIGH**

**What breaks if you change API:**
- CallSessionFAB breaks (depends on activeCallSession, startCallSession, endCallSession)
- CustomerServicePage breaks (startCallSession, endCallSession calls)
- Call session persistence breaks (survives navigation)
- FAB rendering breaks (global at App root)

**What breaks if you delete it:**
- No call session state
- CallSessionFAB doesn't render
- Call flow breaks
- Agent can't start calls

**Safe to proceed?** **Yes with caution — Test call-center page + FAB + navigation after changes**

---

## 6. `confirmation_snapshot` in orders — Leader Workflow Truth

**Direct callers:** 5 files
- `app/api/call_center_api.py` (update_order_confirmation, leader_approve)
- `app/models/order.py` (update_order, JSON serialization)
- `front/src/api/callCenterAPI.js` (parseConfirmationSnapshot, mapOrderFromBackend)
- `front/src/components/call-center/CallSessionFAB.jsx` (reads snapshot)
- `front/src/pages/CustomerServicePage.jsx` (indirect via order object)

**Transitive callers:** Leader approval → ticket creation → snapshot structure

**Orphan risk:** None — critical workflow data

**Risk level:** 🔴 **CRITICAL**

**What breaks if you change structure:**
- Leader approval breaks (reads snapshot, creates ticket from it)
- Ticket creation breaks (items, customer, address from snapshot)
- Call session breaks (displays snapshot data)
- Order confirmation breaks (writes snapshot)

**What breaks if you delete it:**
- Leader workflow stops (no snapshot = no ticket data)
- Ticket creation fails (no items, no customer data)
- Order confirmation breaks (no snapshot storage)

**Safe to proceed?** **NO — Append-only truth. Change structure = break leader workflow + ticket creation**

---

## 7. Tracking Number Uniqueness Checks — Bosta Data Integrity

**Direct callers:** 2 files
- `app/utils/validators.py` (validate_tracking_numbers)
- `app/models/tracking.py` (check_tracking_not_used)

**Transitive callers:** Ticket creation → validation → tracking checks → Bosta API

**Orphan risk:** None — validation layer

**Risk level:** 🔴 **CRITICAL**

**What breaks if you remove checks:**
- Duplicate tracking numbers allowed
- Bosta data corruption (tracking is primary key)
- Wrong order enrichment (same tracking = wrong Bosta data)
- Customer confusion (multiple tickets with same tracking)

**What breaks if you delete it:**
- No uniqueness enforcement
- Duplicate tracking numbers
- Bosta API confusion
- Data integrity lost

**Safe to proceed?** **NO — Remove = duplicate tracking = Bosta confusion = production data corruption**

---

## Summary

| Hot Wire | Risk | Callers | Safe to Change? |
|----------|------|---------|-----------------|
| `app/utils/db.py` | 🔴 CRITICAL | 18 direct | **NO** |
| `app/utils/phone_normalizer.py` | 🔴 CRITICAL | 15 direct | **NO** |
| `front/src/styles/design-tokens.css` | 🔴 HIGH | 100+ indirect | **Yes, with caution** |
| `app/services/service_manager.py` | 🔴 CRITICAL | 3 direct | **NO** |
| `front/src/contexts/CallSessionContext.jsx` | 🟡 MEDIUM-HIGH | 3 direct | **Yes, with caution** |
| `confirmation_snapshot` (orders) | 🔴 CRITICAL | 5 direct | **NO** |
| Tracking uniqueness checks | 🔴 CRITICAL | 2 direct | **NO** |

**Recommendation:** Only `design-tokens.css` and `CallSessionContext.jsx` are safe to modify with proper testing. All others require full test suite + migration plan + blast radius verification.

---

*Generated: 2026-03-09*  
*VENOM init + audit protocol*
