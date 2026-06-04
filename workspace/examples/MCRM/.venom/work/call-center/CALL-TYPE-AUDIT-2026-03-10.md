# Call Type System Audit — 2026-03-10

> **Problem**: Call type (استبدال/صيانة/إرجاع/بيع) always shows as "sell" when reopening orders. Items show as sell items without direction. Orders auto-convert to sell regardless of selected type.

---

## What I Ate

**Scope**: Complete call center flow — creation → storage → retrieval → display  
**Files analyzed**: 
- Backend: `call_center_api.py`, `order.py`, `call.py`, `service_ticket.py`
- Frontend: `CallSessionFAB.jsx`, `callCenterAPI.js`, `CustomerServicePage.jsx`
- Docs: `DATA-AND-RELATIONS.md`, call-center docs

---

## Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│                     CALL TYPE FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. USER SELECTS TYPE
   └─> CallSessionFAB: callType state (استبدال/صيانة/إرجاع/بيع)

2. CONFIRM ORDER
   ├─> Frontend: confirmOrder(orderId, { call_type, items/itemsToSend/itemsToReceive })
   └─> Backend: confirm_by_customer
       ├─> Creates call record (calls.call_type = X)
       ├─> Stores snapshot (confirmation_snapshot.call_type = X, items with direction)
       └─> Updates order (orders.service_type = X)

3. RETRIEVE ORDER
   ├─> Backend: get_order → returns order.service_type + confirmation_snapshot
   └─> Frontend: getOrderCallContext → mapOrderFromBackend
       └─> Returns: order { service_type, confirmation_snapshot }

4. DISPLAY IN FAB
   ├─> CallSessionFAB.loadData()
   │   ├─> Gets orderFromContext (has service_type + snapshot)
   │   └─> Extracts: svcType, resolvedType → setCallType()
   └─> useEffect([order.service_type, order.confirmation_snapshot.call_type])
       └─> Sets callType state for UI

5. LEADER APPROVE
   └─> leader_approve → reads service_type OR snap.call_type → creates ticket
```

---

## Critical Bugs Identified

### 🔴 BUG 1: service_type is NOT updated on confirm

**Location**: `call_center_api.py:616`

```python
update_payload = {
    'status': 'confirmed',
    'confirmation_snapshot': snapshot,
    'service_type': order.get('service_type') or ('sell' if call_type == 'sell' else call_type),
}
```

**Problem**: Uses `order.get('service_type')` FIRST, which is the OLD value from ERP sync or creation. Only falls back to `call_type` if `service_type` is None.

**When it breaks**:
- Order created from ERP → `service_type='sell'` (default from ERP)
- Agent selects "استبدال" → `call_type='replacement'`
- Confirm → `service_type` stays `'sell'` because `order.get('service_type')` returns `'sell'`
- Reopen → shows "بيع" instead of "استبدال"

**Fix**: Always use `call_type` from the current confirm action:
```python
'service_type': call_type,  # Use what agent just selected, not old value
```

---

### 🔴 BUG 2: Items lose direction on display

**Location**: `CallSessionFAB.jsx:295`

```javascript
if (hasSnapshotItems) {
  const snapshotRes = await getOrderItemsFromSnapshot(orderFromContext);
  items = snapshotRes.items || [];
  sendItems = snapshotRes.itemsToSend || [];
  receiveItems = snapshotRes.itemsToReceive || [];
  initialTotal = snapshotRes.total ?? 0;
}
```

**Problem**: `getOrderItemsFromSnapshot` correctly splits items by direction, BUT the display logic shows:
1. "sell" type → `OrderItemsEditor` (single list, no direction)
2. R/M/T types → `CallCenterItemsSelection` (split lists)

When `callType` is incorrectly set to `'sell'` (due to Bug 1), items are rendered as sell items without direction.

**Depends on**: Bug 1 fix. Once `service_type` is correct, `callType` will be correct, and items will render with direction.

---

### 🟡 BUG 3: Case sensitivity

**Location**: Multiple files

```python
# Backend: confirm_by_customer
call_type = data.get('call_type', 'sell')  # Expects lowercase

# Frontend: confirmOrder
call_type: data.call_type || 'sell'  # Sends what UI has

# UI: CallSessionFAB
const resolvedType = ['sell', 'replacement', 'maintenance', 'return'].includes(svcType) ? svcType : 'sell';
```

**Problem**: If frontend sends `'Replacement'` (capitalized), backend accepts it (no validation fails), stores it, but frontend check fails because `'Replacement' !== 'replacement'`.

**Status**: Already fixed in latest code with `.toLowerCase().trim()` normalization.

---

### 🟡 BUG 4: Multiple sources of truth

**Where call type is stored**:
1. `orders.service_type` — main field
2. `confirmation_snapshot.call_type` — snapshot field
3. `calls.call_type` — call record

**Problem**: If these diverge, which one is truth?

**Current behavior**:
- Confirm: stores `call_type` in snapshot, updates `service_type` in order
- Retrieve: uses `service_type` first, falls back to `snapshot.call_type`
- Leader approve: uses `service_type` OR `snap.call_type`

**Risk**: If `service_type` is wrong (Bug 1), `snapshot.call_type` is correct, but UI uses `service_type` first.

---

### 🟢 NOT A BUG: Bosta auto-linking

**User report**: "auto linked to bosta_tracking without selection"

**What actually happens**:
1. ERP sync (`sync_orders_from_erp`) enriches orders with Bosta tracking if customer phone matches
2. This is intentional and happens during sync, not during confirm
3. Shown in UI as "original_tracking" field

**No fix needed**: This is expected behavior for ERP orders.

---

## Data Flow Issues

### Issue 1: ERP orders default to 'sell'

**Location**: `call_center_api.py:281` (`_erp_row_to_order`)

```python
'service_type': 'sell',  # All ERP orders are sell by default
```

**Impact**: When agent opens an ERP order and selects استبدال/صيانة/إرجاع, the OLD `service_type='sell'` persists due to Bug 1.

---

### Issue 2: Direct orders creation

**Location**: `call_center_api.py:44`

```python
service_type = data.get('service_type') or data.get('call_type')
```

**Impact**: Direct orders (Path B) use `service_type` from request, which is correct. BUT when confirming, Bug 1 applies.

---

### Issue 3: Leader approve uses fallback

**Location**: `call_center_api.py:672`

```python
service_type = (order.get('service_type') or snap.get('call_type') or 'sell')
```

**Impact**: If `service_type` is wrong, fallback to `snap.call_type` saves the day. BUT this is a band-aid, not a fix.

---

## Root Cause Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                  ROOT CAUSE CHAIN                           │
└─────────────────────────────────────────────────────────────┘

1. ERP sync creates order with service_type='sell' (default)
   ↓
2. Agent opens order, selects call_type='replacement'
   ↓
3. Agent confirms → Backend receives call_type='replacement'
   ↓
4. Backend stores snapshot.call_type='replacement' ✓
   ↓
5. Backend FAILS to update service_type (Bug 1)
   │  Uses: order.get('service_type') → returns 'sell'
   │  Should use: call_type → 'replacement'
   ↓
6. Order saved with:
   - service_type='sell' ✗
   - confirmation_snapshot.call_type='replacement' ✓
   - calls.call_type='replacement' ✓
   ↓
7. Agent reopens order
   ↓
8. Frontend loads order:
   - getOrderCallContext → order.service_type='sell'
   - confirmation_snapshot.call_type='replacement'
   ↓
9. CallSessionFAB.loadData():
   - svcType = orderFromContext.service_type || snap.call_type
   - Returns 'sell' (first value wins) ✗
   ↓
10. CallSessionFAB.useEffect():
    - order.service_type='sell' → setCallType('sell') ✗
    ↓
11. UI shows "بيع" instead of "استبدال" ✗
    Items render as sell items (single list, no direction) ✗
```

---

## Blast Radius

### Files Affected by Bug 1 Fix

**Backend (1 file)**:
- `app/api/call_center_api.py:616` — change `service_type` assignment

**Frontend (0 files)**:
- No frontend changes needed — already reads `service_type` correctly
- Existing normalization handles it

**Risk level**: 🟢 **Low risk** — single line change, no callers to update

---

### Files Affected by Comprehensive Fix

If we want to ensure consistency across all flows:

**Backend (3 files)**:
1. `app/api/call_center_api.py`
   - `confirm_by_customer` (Bug 1 fix)
   - `leader_approve` (fallback logic can stay)
   - `_erp_row_to_order` (could add service_type detection from ERP data if available)

2. `app/models/order.py`
   - No changes needed (service_type is already a valid column)

3. `app/models/call.py`
   - No changes needed (call_type is already stored)

**Frontend (2 files)**:
1. `front/src/components/call-center/CallSessionFAB.jsx`
   - Already fixed with normalization and loadData setCallType

2. `front/src/api/callCenterAPI.js`
   - Already sends call_type correctly
   - mapOrderFromBackend correctly maps service_type

**Risk level**: 🟢 **Low risk** — Bug 1 fix is isolated, other code already handles it correctly

---

## Verification Points

After Bug 1 fix, verify:

1. **Create & Confirm**:
   - [ ] Create ERP order (service_type='sell')
   - [ ] Open in FAB, select "استبدال"
   - [ ] Add items to send + receive
   - [ ] Confirm
   - [ ] Check DB: `orders.service_type='replacement'` ✓

2. **Reopen & Display**:
   - [ ] Reopen same order
   - [ ] UI shows "استبدال" selected ✓
   - [ ] Items show in two lists (للإرسال / للاستلام) ✓

3. **Leader Approve**:
   - [ ] Leader opens pending order
   - [ ] Modal shows "استبدال" ✓
   - [ ] Items show with direction ✓
   - [ ] Approve creates replacement ticket ✓

4. **Other Call Types**:
   - [ ] Repeat for صيانة, إرجاع
   - [ ] Verify each creates correct ticket type

---

## Recommended Fix Plan

### ✅ Phase 1: Critical Bug Fix — COMPLETED

**Changed 1 file, 1 line**:

```python
# app/api/call_center_api.py:616
'service_type': call_type,  # Now uses what agent selected, not old value
```

**Status**: ✅ Applied  
**Impact**: All future confirms will have correct `service_type`.

---

### ✅ Phase 2: Data Migration — COMPLETED

**Created**: `scripts/migrate_service_types.py`

One-time migration script to fix existing orders:

```bash
# Dry run (show what would change)
python scripts/migrate_service_types.py --dry-run

# Apply changes
python scripts/migrate_service_types.py
```

**Status**: ✅ Script created  
**Impact**: Fixes historical data so all orders show correct type when reopened.

**How it works**:
- Finds all confirmed orders with `confirmation_snapshot`
- Compares `service_type` vs `snapshot.call_type`
- Updates mismatched orders
- Safe: only updates confirmed orders with valid snapshots

---

### ✅ Phase 3: Consistency Checks — COMPLETED

**3A: Backend logging** ✅
```python
# call_center_api.py:622 (after update_order)
logger.info(f"Order {order_id} confirmed as call_type={call_type}, service_type={call_type}")
```

**3B: Frontend validation** ✅
```javascript
// CallSessionFAB.jsx:612 (before confirmOrder)
if (import.meta.env.DEV && confirmPayload.call_type !== callType) {
  console.error('[CallSessionFAB] call_type mismatch:', { payload: confirmPayload.call_type, state: callType });
}
```

**Status**: ✅ Applied  
**Impact**: Easier debugging if issues arise in future.

---

## Answer to User's Questions

### Q: "Why always shows sell?"
**A**: `orders.service_type` is not updated on confirm (Bug 1). Old value persists.

### Q: "Why items show as sell not استبدال?"
**A**: Because `callType` state is set from `service_type`, which is wrong. Items ARE stored correctly with direction in snapshot, but UI doesn't show them because call type is wrong.

### Q: "Why auto-linked to bosta_tracking?"
**A**: Not a bug. ERP sync enriches orders with Bosta tracking based on customer phone. This is intentional.

### Q: "Why auto-converted to sell?"
**A**: Same as Q1. `service_type` field is not updated, stays at default 'sell'.

---

## What NOT to Change

1. **DON'T** change how items are stored in snapshot (already correct)
2. **DON'T** change `getOrderItemsFromSnapshot` (already correct)
3. **DON'T** change `CallCenterItemsSelection` (already correct)
4. **DON'T** change leader_approve fallback logic (it's a safety net)
5. **DON'T** change Bosta auto-linking (it's intentional)

---

## Summary

**Single root cause**: Line 616 in `call_center_api.py` uses old `service_type` instead of current `call_type`.

**Single line fix**: Change `'service_type': order.get('service_type') or ...` to `'service_type': call_type,`

**Everything else already works**: Frontend correctly reads, normalizes, and displays. Items are stored correctly. The only issue is that one field is not updated on confirm.

**Test after fix**: Create order → select استبدال → confirm → reopen → should show استبدال with split items lists.

---

## Next Steps

### Immediate Actions

1. ✅ **Phase 1 fix applied** — `service_type` now correctly updates on confirm
2. ✅ **Phase 2 script created** — Run migration to fix existing data
3. ✅ **Phase 3 logging added** — Monitoring in place for future confirms

### To Complete

1. **Run migration** (production):
   ```bash
   # First, dry run to see what would change
   python scripts/migrate_service_types.py --dry-run
   
   # Then apply if results look good
   python scripts/migrate_service_types.py
   ```

2. **Verify the fix**:
   - [ ] Create ERP order (service_type='sell')
   - [ ] Open in FAB, select "استبدال"
   - [ ] Add items to send + receive
   - [ ] Confirm
   - [ ] Check logs: should see "Order X confirmed as call_type=replacement"
   - [ ] Check DB: `SELECT id, service_type, confirmation_snapshot FROM orders WHERE id=X`
   - [ ] Reopen order: UI should show "استبدال" selected ✓
   - [ ] Items should show in two lists (للإرسال / للاستلام) ✓

3. **Test other call types**:
   - [ ] Repeat for صيانة (maintenance)
   - [ ] Repeat for إرجاع (return)
   - [ ] Verify sell still works

4. **Monitor** (first few days):
   - Check logs for "Order X confirmed as call_type=Y"
   - Watch for any frontend console errors about call_type mismatch
   - Verify no regressions in leader approval flow

---

*Generated: 2026-03-10*  
*Analyst: VENOM*  
*Status: Ready for implementation*
